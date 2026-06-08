package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.ApiResponse;
import com.travel.dto.WishlistRequest;
import com.travel.dto.WishlistResponse;
import com.travel.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<WishlistResponse>> getWishlist(HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        List<WishlistResponse> wishlist = wishlistService.getWishlist(userId);
        return ApiResponse.success(wishlist);
    }

    @PostMapping
    public ApiResponse<WishlistResponse> addWishlist(
            HttpServletRequest httpRequest,
            @RequestBody WishlistRequest request
    ) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        WishlistResponse response = wishlistService.addWishlist(userId, request);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<WishlistResponse> updateWishlist(
            HttpServletRequest httpRequest,
            @PathVariable Long id,
            @RequestBody WishlistRequest request
    ) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        WishlistResponse response = wishlistService.updateWishlist(userId, id, request);
        if (response == null) {
            return ApiResponse.error("愿望单不存在");
        }
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteWishlist(
            HttpServletRequest httpRequest,
            @PathVariable Long id
    ) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        wishlistService.deleteWishlist(userId, id);
        return ApiResponse.success(null);
    }
}
