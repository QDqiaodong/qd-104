package com.travel.service;

import com.travel.dto.WishlistRequest;
import com.travel.dto.WishlistResponse;
import java.util.List;

public interface WishlistService {
    List<WishlistResponse> getWishlist(Long userId);
    WishlistResponse addWishlist(Long userId, WishlistRequest request);
    void deleteWishlist(Long userId, Long id);
    WishlistResponse updateWishlist(Long userId, Long id, WishlistRequest request);
    long getWishlistCount(Long userId);
}
