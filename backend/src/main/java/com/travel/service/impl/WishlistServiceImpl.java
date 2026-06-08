package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.dto.WishlistRequest;
import com.travel.dto.WishlistResponse;
import com.travel.entity.City;
import com.travel.entity.Wishlist;
import com.travel.repository.CityRepository;
import com.travel.repository.CommonMapper;
import com.travel.repository.WishlistRepository;
import com.travel.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private CommonMapper commonMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public List<WishlistResponse> getWishlist(Long userId) {
        QueryWrapper<Wishlist> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        queryWrapper.orderByDesc("create_time");

        List<Wishlist> wishlists = wishlistRepository.selectList(queryWrapper);

        return wishlists.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public WishlistResponse addWishlist(Long userId, WishlistRequest request) {
        Wishlist wishlist = new Wishlist();
        wishlist.setUserId(userId);
        wishlist.setCityId(request.getCityId());
        wishlist.setExpectedSeason(request.getExpectedSeason());
        wishlist.setReason(request.getReason());
        wishlist.setExperience(request.getExperience());
        wishlist.setCreateTime(LocalDateTime.now());

        wishlistRepository.insert(wishlist);

        Long id = commonMapper.getLastInsertId();
        wishlist.setId(id);

        return convertToResponse(wishlist);
    }

    @Override
    public void deleteWishlist(Long userId, Long id) {
        QueryWrapper<Wishlist> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("id", id);
        queryWrapper.eq("user_id", userId);
        wishlistRepository.delete(queryWrapper);
    }

    @Override
    public WishlistResponse updateWishlist(Long userId, Long id, WishlistRequest request) {
        QueryWrapper<Wishlist> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("id", id);
        queryWrapper.eq("user_id", userId);

        Wishlist wishlist = wishlistRepository.selectOne(queryWrapper);
        if (wishlist == null) {
            return null;
        }

        if (request.getCityId() != null) {
            wishlist.setCityId(request.getCityId());
        }
        if (request.getExpectedSeason() != null) {
            wishlist.setExpectedSeason(request.getExpectedSeason());
        }
        if (request.getReason() != null) {
            wishlist.setReason(request.getReason());
        }
        if (request.getExperience() != null) {
            wishlist.setExperience(request.getExperience());
        }

        wishlistRepository.updateById(wishlist);

        return convertToResponse(wishlist);
    }

    @Override
    public long getWishlistCount(Long userId) {
        QueryWrapper<Wishlist> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);
        return wishlistRepository.selectCount(queryWrapper);
    }

    private WishlistResponse convertToResponse(Wishlist wishlist) {
        City city = cityRepository.selectById(wishlist.getCityId());

        WishlistResponse response = new WishlistResponse();
        response.setId(wishlist.getId());
        response.setUserId(wishlist.getUserId());
        response.setCityId(wishlist.getCityId());
        response.setCityName(city != null ? city.getName() : "");
        response.setCityProvince(city != null ? city.getProvince() : "");
        response.setCityDescription(city != null ? city.getDescription() : "");
        response.setExpectedSeason(wishlist.getExpectedSeason());
        response.setReason(wishlist.getReason());
        response.setExperience(wishlist.getExperience());
        response.setCreateTime(wishlist.getCreateTime() != null ? wishlist.getCreateTime().format(FORMATTER) : "");
        return response;
    }
}
