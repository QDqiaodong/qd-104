package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.travel.dto.UserProfileResponse;
import com.travel.entity.*;
import com.travel.repository.*;
import com.travel.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private JournalRepository journalRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 获取打卡城市数
        QueryWrapper<Checkin> checkinWrapper = new QueryWrapper<>();
        checkinWrapper.eq("user_id", userId);
        List<Checkin> checkins = checkinRepository.selectList(checkinWrapper);
        Set<Long> cityIds = new HashSet<>();
        for (Checkin checkin : checkins) {
            cityIds.add(checkin.getCityId());
        }
        List<City> cities = cityIds.stream()
                .map(cityRepository::selectById)
                .collect(Collectors.toList());

        // 获取游记数
        QueryWrapper<Journal> journalWrapper = new QueryWrapper<>();
        journalWrapper.eq("author_id", userId);
        Long journalCount = journalRepository.selectCount(journalWrapper);

        // 获取收藏数
        QueryWrapper<JournalCollection> collectionWrapper = new QueryWrapper<>();
        collectionWrapper.eq("user_id", userId);
        Long collectCount = collectionRepository.selectCount(collectionWrapper);

        // 获取愿望单数量
        QueryWrapper<Wishlist> wishlistWrapper = new QueryWrapper<>();
        wishlistWrapper.eq("user_id", userId);
        Long wishlistCount = wishlistRepository.selectCount(wishlistWrapper);

        return new UserProfileResponse(
                userId,
                user.getNickname(),
                cityIds.size(),
                journalCount.intValue(),
                checkins.size(),
                collectCount.intValue(),
                wishlistCount.intValue(),
                cities
        );
    }
}
