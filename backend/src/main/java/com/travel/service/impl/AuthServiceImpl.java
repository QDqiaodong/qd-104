package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.dto.*;
import com.travel.entity.User;
import com.travel.repository.UserRepository;
import com.travel.repository.CommonMapper;
import com.travel.service.AuthService;
import com.travel.config.JwtConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommonMapper commonMapper;

    @Autowired
    private JwtConfig jwtConfig;

    @Override
    public AuthResponse login(LoginRequest request) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("email", request.getEmail());
        queryWrapper.eq("password", request.getPassword());
        User user = userRepository.selectOne(queryWrapper);

        if (user == null) {
            throw new RuntimeException("邮箱或密码错误");
        }

        String token = jwtConfig.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getNickname(), user.getEmail());
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("email", request.getEmail());
        User existUser = userRepository.selectOne(queryWrapper);

        if (existUser != null) {
            throw new RuntimeException("邮箱已被注册");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setNickname(request.getNickname());
        user.setCreateTime(LocalDateTime.now());
        userRepository.insert(user);
        
        Long userId = commonMapper.getLastInsertId();
        user.setId(userId);

        String token = jwtConfig.generateToken(userId);
        return new AuthResponse(token, userId, user.getNickname(), user.getEmail());
    }

    @Override
    public User getCurrentUser(Long userId) {
        return userRepository.selectById(userId);
    }
}
