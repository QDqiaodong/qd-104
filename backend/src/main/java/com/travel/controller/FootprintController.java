package com.travel.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.config.JwtInterceptor;
import com.travel.dto.ApiResponse;
import com.travel.dto.FootprintHeatmapResponse;
import com.travel.entity.Checkin;
import com.travel.entity.City;
import com.travel.entity.Journal;
import com.travel.repository.CheckinRepository;
import com.travel.repository.CityRepository;
import com.travel.repository.JournalRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/footprint")
public class FootprintController {

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private JournalRepository journalRepository;

    @Autowired
    private CityRepository cityRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    @GetMapping("/heatmap")
    public ApiResponse<List<FootprintHeatmapResponse>> getHeatmap(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int year,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getMonthValue()}") int month) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<FootprintHeatmapResponse> heatmap = new ArrayList<>();

        Map<String, List<FootprintHeatmapResponse.DailyActivity>> dateActivitiesMap = new HashMap<>();

        QueryWrapper<Checkin> checkinQuery = new QueryWrapper<>();
        checkinQuery.eq("user_id", userId);
        checkinQuery.between("travel_time", startDateTime, endDateTime);
        List<Checkin> checkins = checkinRepository.selectList(checkinQuery);

        for (Checkin checkin : checkins) {
            String date = checkin.getTravelTime().toLocalDate().format(DATE_FORMATTER);
            City city = cityRepository.selectById(checkin.getCityId());
            String time = checkin.getTravelTime().format(TIME_FORMATTER);
            
            dateActivitiesMap.computeIfAbsent(date, k -> new ArrayList<>()).add(
                    new FootprintHeatmapResponse.DailyActivity(
                            checkin.getId(),
                            "checkin",
                            checkin.getLocation(),
                            city != null ? city.getName() : "",
                            time,
                            null
                    )
            );
        }

        QueryWrapper<Journal> journalQuery = new QueryWrapper<>();
        journalQuery.eq("author_id", userId);
        journalQuery.between("create_time", startDateTime, endDateTime);
        List<Journal> journals = journalRepository.selectList(journalQuery);

        for (Journal journal : journals) {
            String date = journal.getCreateTime().toLocalDate().format(DATE_FORMATTER);
            City city = cityRepository.selectById(journal.getCityId());
            String time = journal.getCreateTime().format(TIME_FORMATTER);
            String firstImage = null;
            if (journal.getImages() != null && !journal.getImages().isEmpty()) {
                String[] images = journal.getImages().split(",");
                if (images.length > 0) {
                    firstImage = images[0];
                }
            }
            
            dateActivitiesMap.computeIfAbsent(date, k -> new ArrayList<>()).add(
                    new FootprintHeatmapResponse.DailyActivity(
                            journal.getId(),
                            "journal",
                            journal.getTitle(),
                            city != null ? city.getName() : "",
                            time,
                            firstImage
                    )
            );
        }

        for (Map.Entry<String, List<FootprintHeatmapResponse.DailyActivity>> entry : dateActivitiesMap.entrySet()) {
            List<FootprintHeatmapResponse.DailyActivity> activities = entry.getValue();
            activities.sort(Comparator.comparing(FootprintHeatmapResponse.DailyActivity::getTime));
            heatmap.add(new FootprintHeatmapResponse(
                    entry.getKey(),
                    activities.size(),
                    activities
            ));
        }

        heatmap.sort(Comparator.comparing(FootprintHeatmapResponse::getDate));

        return ApiResponse.success(heatmap);
    }

    @GetMapping("/date/{date}")
    public ApiResponse<FootprintHeatmapResponse> getActivitiesByDate(
            HttpServletRequest httpRequest,
            @PathVariable String date) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        
        LocalDate localDate = LocalDate.parse(date, DATE_FORMATTER);
        LocalDateTime startDateTime = localDate.atStartOfDay();
        LocalDateTime endDateTime = localDate.atTime(23, 59, 59);

        List<FootprintHeatmapResponse.DailyActivity> activities = new ArrayList<>();

        QueryWrapper<Checkin> checkinQuery = new QueryWrapper<>();
        checkinQuery.eq("user_id", userId);
        checkinQuery.between("travel_time", startDateTime, endDateTime);
        List<Checkin> checkins = checkinRepository.selectList(checkinQuery);

        for (Checkin checkin : checkins) {
            City city = cityRepository.selectById(checkin.getCityId());
            String time = checkin.getTravelTime().format(TIME_FORMATTER);
            
            activities.add(new FootprintHeatmapResponse.DailyActivity(
                    checkin.getId(),
                    "checkin",
                    checkin.getLocation(),
                    city != null ? city.getName() : "",
                    time,
                    null
            ));
        }

        QueryWrapper<Journal> journalQuery = new QueryWrapper<>();
        journalQuery.eq("author_id", userId);
        journalQuery.between("create_time", startDateTime, endDateTime);
        List<Journal> journals = journalRepository.selectList(journalQuery);

        for (Journal journal : journals) {
            City city = cityRepository.selectById(journal.getCityId());
            String time = journal.getCreateTime().format(TIME_FORMATTER);
            String firstImage = null;
            if (journal.getImages() != null && !journal.getImages().isEmpty()) {
                String[] images = journal.getImages().split(",");
                if (images.length > 0) {
                    firstImage = images[0];
                }
            }
            
            activities.add(new FootprintHeatmapResponse.DailyActivity(
                    journal.getId(),
                    "journal",
                    journal.getTitle(),
                    city != null ? city.getName() : "",
                    time,
                    firstImage
            ));
        }

        activities.sort(Comparator.comparing(FootprintHeatmapResponse.DailyActivity::getTime));

        FootprintHeatmapResponse response = new FootprintHeatmapResponse(
                date,
                activities.size(),
                activities
        );

        return ApiResponse.success(response);
    }
}
