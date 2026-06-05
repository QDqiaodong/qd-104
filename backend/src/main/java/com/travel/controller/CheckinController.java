package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.*;
import com.travel.entity.City;
import com.travel.service.CheckinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/checkin")
public class CheckinController {

    @Autowired
    private CheckinService checkinService;

    @GetMapping("/list")
    public ApiResponse<PageResponse<CheckinResponse>> getCheckinList(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "travel_time") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        PageResponse<CheckinResponse> response = checkinService.getCheckinList(userId, sortBy, sortOrder);
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<CheckinResponse> createCheckin(@RequestBody CheckinRequest request, HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        CheckinResponse response = checkinService.createCheckin(userId, request);
        return ApiResponse.success(response);
    }
}
