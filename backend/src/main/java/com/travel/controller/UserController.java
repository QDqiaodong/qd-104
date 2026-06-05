package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.ApiResponse;
import com.travel.dto.UserProfileResponse;
import com.travel.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getUserProfile(HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        UserProfileResponse response = userService.getUserProfile(userId);
        return ApiResponse.success(response);
    }
}
