package com.travel.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtConfig jwtConfig;

    public static final String USER_ID_ATTR = "userId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Long userId = jwtConfig.getUserIdFromToken(token);
                request.setAttribute(USER_ID_ATTR, userId);
            } catch (Exception e) {
                // 无效的token，继续但不设置userId
            }
        }
        return true;
    }

    public static Long getCurrentUserId(HttpServletRequest request) {
        Object attr = request.getAttribute(USER_ID_ATTR);
        return attr != null ? (Long) attr : 1L; // 如果没有token，默认返回1
    }
}
