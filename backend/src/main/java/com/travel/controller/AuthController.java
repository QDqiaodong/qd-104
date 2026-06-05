package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.*;
import com.travel.entity.User;
import com.travel.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/current")
    public ApiResponse<User> getCurrentUser(HttpServletRequest request) {
        try {
            Long userId = JwtInterceptor.getCurrentUserId(request);
            User user = authService.getCurrentUser(userId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(401, "未授权");
        }
    }
}
