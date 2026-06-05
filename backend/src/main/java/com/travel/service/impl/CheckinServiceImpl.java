package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.dto.*;
import com.travel.entity.*;
import com.travel.repository.*;
import com.travel.service.CheckinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

        return convertToResponse(checkin);
    }

    @Override
    public List<City> getCities() {
        return cityRepository.selectList(null);
    }

    private CheckinResponse convertToResponse(Checkin checkin) {
        City city = cityRepository.selectById(checkin.getCityId());

        return new CheckinResponse(
                checkin.getId(),
                checkin.getUserId(),
                checkin.getCityId(),
                city != null ? city.getName() : "",
                checkin.getLocation(),
                checkin.getTravelTime().format(FORMATTER),
                checkin.getTravelMethod(),
                checkin.getCreateTime().format(FORMATTER)
        );
    }
}
