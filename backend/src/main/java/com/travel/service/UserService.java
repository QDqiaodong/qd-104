package com.travel.service;

import com.travel.dto.UserProfileResponse;

public interface UserService {
    UserProfileResponse getUserProfile(Long userId);
}
