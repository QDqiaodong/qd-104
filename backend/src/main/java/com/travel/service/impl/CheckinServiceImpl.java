package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.dto.*;
import com.travel.entity.*;
import com.travel.repository.*;
import com.travel.service.CheckinService;
import com.travel.util.StringSimilarity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CheckinServiceImpl implements CheckinService {

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private CommonMapper commonMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final double HIGH_SIMILARITY_THRESHOLD = 0.75;

    @Override
    public PageResponse<CheckinResponse> getCheckinList(Long userId, String sortBy, String sortOrder) {
        QueryWrapper<Checkin> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        
        String sortField = "create_time".equals(sortBy) ? "create_time" : "travel_time";
        boolean isAsc = "asc".equalsIgnoreCase(sortOrder);
        
        if (isAsc) {
            queryWrapper.orderByAsc(sortField);
        } else {
            queryWrapper.orderByDesc(sortField);
        }

        List<Checkin> checkins = checkinRepository.selectList(queryWrapper);

        List<CheckinResponse> list = checkins.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(list, (long) list.size(), 1, list.size());
    }

    @Override
    public CheckinResponse createCheckin(Long userId, CheckinRequest request) {
        Checkin checkin = new Checkin();
        checkin.setUserId(userId);
        checkin.setCityId(request.getCityId());
        checkin.setLocation(request.getLocation());
        
        // 解析日期字符串
        try {
            LocalDateTime travelTime;
            if (request.getTravelTime().contains(" ")) {
                travelTime = LocalDateTime.parse(request.getTravelTime(), FORMATTER);
            } else {
                travelTime = LocalDateTime.parse(request.getTravelTime() + " 00:00:00", FORMATTER);
            }
            checkin.setTravelTime(travelTime);
        } catch (Exception e) {
            checkin.setTravelTime(LocalDateTime.now());
        }
        
        checkin.setTravelMethod(request.getTravelMethod());
        checkin.setCreateTime(LocalDateTime.now());
        checkinRepository.insert(checkin);
        
        Long checkinId = commonMapper.getLastInsertId();
        checkin.setId(checkinId);

        CheckinResponse response = convertToResponse(checkin);
        
        // 计算重访信息（排除当前刚创建的打卡）
        RevisitInfo revisitInfo = detectRevisit(userId, checkin, checkinId);
        response.setRevisitInfo(revisitInfo);

        return response;
    }

    @Override
    public List<City> getCities() {
        return cityRepository.selectList(null);
    }

    @Override
    public List<City> searchCities(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getCities();
        }
        String searchKeyword = keyword.trim();
        QueryWrapper<City> queryWrapper = new QueryWrapper<>();
        queryWrapper.and(wrapper -> wrapper
                .like("name", searchKeyword)
                .or()
                .like("province", searchKeyword)
                .or()
                .like("aliases", searchKeyword)
        );
        return cityRepository.selectList(queryWrapper);
    }

    private CheckinResponse convertToResponse(Checkin checkin) {
        City city = cityRepository.selectById(checkin.getCityId());

        CheckinResponse response = new CheckinResponse();
        response.setId(checkin.getId());
        response.setUserId(checkin.getUserId());
        response.setCityId(checkin.getCityId());
        response.setCityName(city != null ? city.getName() : "");
        response.setLocation(checkin.getLocation());
        response.setTravelTime(checkin.getTravelTime().format(FORMATTER));
        response.setTravelMethod(checkin.getTravelMethod());
        response.setCreateTime(checkin.getCreateTime().format(FORMATTER));
        return response;
    }

    private RevisitInfo detectRevisit(Long userId, Checkin newCheckin, Long excludeCheckinId) {
        // 获取该用户所有历史打卡（排除当前打卡）
        QueryWrapper<Checkin> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        if (excludeCheckinId != null) {
            queryWrapper.ne("id", excludeCheckinId);
        }
        List<Checkin> historicalCheckins = checkinRepository.selectList(queryWrapper);

        if (historicalCheckins.isEmpty()) {
            RevisitInfo info = new RevisitInfo();
            info.setType("new_city");
            info.setTotalVisitsInCity(0);
            return info;
        }

        Long cityId = newCheckin.getCityId();
        String location = newCheckin.getLocation();
        LocalDateTime travelTime = newCheckin.getTravelTime();

        // 筛选同城市的历史打卡
        List<Checkin> cityCheckins = historicalCheckins.stream()
                .filter(c -> c.getCityId().equals(cityId))
                .collect(Collectors.toList());

        boolean hasCityVisited = !cityCheckins.isEmpty();

        if (!hasCityVisited) {
            RevisitInfo info = new RevisitInfo();
            info.setType("new_city");
            info.setTotalVisitsInCity(0);
            return info;
        }

        // 计算总访问次数（包含当前这一次）
        int totalVisitsInCity = cityCheckins.size() + 1;

        // 查找最匹配的地点
        Checkin bestMatch = null;
        double bestSimilarity = 0.0;

        for (Checkin checkin : cityCheckins) {
            double similarity = StringSimilarity.calculateSimilarity(location, checkin.getLocation());
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = checkin;
            }
        }

        boolean isLocationMatch = bestSimilarity >= HIGH_SIMILARITY_THRESHOLD;

        City city = cityRepository.selectById(cityId);
        String cityName = city != null ? city.getName() : "";

        if (isLocationMatch && bestMatch != null) {
            long daysBetween = ChronoUnit.DAYS.between(bestMatch.getTravelTime(), travelTime);
            int daysSince = Math.abs((int) daysBetween);

            RevisitInfo info = new RevisitInfo();
            info.setType("revisit_location");
            info.setMatchedCheckinId(bestMatch.getId());
            info.setMatchedLocation(bestMatch.getLocation());
            info.setMatchedCityName(cityName);
            info.setDaysSinceLastVisit(daysSince);
            info.setTotalVisitsInCity(totalVisitsInCity);
            info.setSimilarityScore(Math.round(bestSimilarity * 100.0) / 100.0);
            return info;
        }

        // 同城新探索 - 找最近一次同城市打卡
        Checkin lastCityVisit = cityCheckins.stream()
                .max(Comparator.comparing(Checkin::getTravelTime))
                .orElse(null);

        if (lastCityVisit != null) {
            long daysBetween = ChronoUnit.DAYS.between(lastCityVisit.getTravelTime(), travelTime);
            int daysSince = Math.abs((int) daysBetween);

            RevisitInfo info = new RevisitInfo();
            info.setType("same_city_new");
            info.setMatchedCityName(cityName);
            info.setDaysSinceLastVisit(daysSince);
            info.setTotalVisitsInCity(totalVisitsInCity);
            info.setSimilarityScore(Math.round(bestSimilarity * 100.0) / 100.0);
            return info;
        }

        RevisitInfo info = new RevisitInfo();
        info.setType("same_city_new");
        info.setTotalVisitsInCity(totalVisitsInCity);
        info.setSimilarityScore(Math.round(bestSimilarity * 100.0) / 100.0);
        return info;
    }
}
