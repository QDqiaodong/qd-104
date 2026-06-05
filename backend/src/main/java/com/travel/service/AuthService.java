package com.travel.service;

import com.travel.dto.*;
import com.travel.entity.User;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    User getCurrentUser(Long userId);
}
