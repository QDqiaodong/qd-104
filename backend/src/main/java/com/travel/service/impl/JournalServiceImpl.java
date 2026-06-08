package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.travel.dto.*;
import com.travel.entity.*;
import com.travel.repository.*;
import com.travel.service.JournalService;
import com.travel.util.ImageListSerializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JournalServiceImpl implements JournalService {

    @Autowired
    private JournalRepository journalRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private JournalCheckinRepository journalCheckinRepository;

    @Autowired
    private CommonMapper commonMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public PageResponse<JournalResponse> getJournalList(Integer page, Integer pageSize, Long cityId, String keyword) {
        Page<Journal> pageParam = new Page<>(page, pageSize);
        QueryWrapper<Journal> queryWrapper = new QueryWrapper<>();
        queryWrapper.orderByDesc("create_time");

        if (cityId != null) {
            queryWrapper.eq("city_id", cityId);
        }
        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(w -> w.like("title", keyword).or().like("content", keyword));
        }

        Page<Journal> result = journalRepository.selectPage(pageParam, queryWrapper);

        List<JournalResponse> list = result.getRecords().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(list, result.getTotal(), page, pageSize);
    }

    @Override
    public JournalResponse getJournalDetail(Long id) {
        Journal journal = journalRepository.selectById(id);
        if (journal == null) {
            throw new RuntimeException("游记不存在");
        }
        return convertToResponse(journal);
    }

    @Override
    public JournalResponse createJournal(Long authorId, JournalRequest request) {
        Journal journal = new Journal();
        journal.setTitle(request.getTitle());
        journal.setContent(request.getContent());
        journal.setImages(ImageListSerializer.serialize(request.getImages()));
        journal.setCityId(request.getCityId());
        journal.setAuthorId(authorId);
        journal.setCreateTime(LocalDateTime.now());
        journal.setLikeCount(0);
        journal.setCollectCount(0);
        journalRepository.insert(journal);
        
        Long journalId = commonMapper.getLastInsertId();
        journal.setId(journalId);

        if (request.getCheckinIds() != null && !request.getCheckinIds().isEmpty()) {
            for (Long checkinId : request.getCheckinIds()) {
                Checkin checkin = checkinRepository.selectById(checkinId);
                if (checkin != null && checkin.getUserId().equals(authorId)) {
                    JournalCheckin journalCheckin = new JournalCheckin();
                    journalCheckin.setJournalId(journalId);
                    journalCheckin.setCheckinId(checkinId);
                    journalCheckin.setCreateTime(LocalDateTime.now());
                    journalCheckinRepository.insert(journalCheckin);
                }
            }
        }

        return convertToResponse(journal);
    }

    @Override
    public void deleteJournal(Long id) {
        journalRepository.deleteById(id);
    }

    @Override
    public void collectJournal(Long userId, Long journalId) {
        // 检查是否已收藏
        QueryWrapper<JournalCollection> checkWrapper = new QueryWrapper<>();
        checkWrapper.eq("user_id", userId).eq("journal_id", journalId);
        if (collectionRepository.selectCount(checkWrapper) > 0) {
            return; // 已收藏，不重复操作
        }

        JournalCollection collection = new JournalCollection();
        collection.setUserId(userId);
        collection.setJournalId(journalId);
        collection.setCreateTime(LocalDateTime.now());
        collectionRepository.insert(collection);
        
        Long collectionId = commonMapper.getLastInsertId();
        collection.setId(collectionId);

        Journal journal = journalRepository.selectById(journalId);
        if (journal != null) {
            journal.setCollectCount(journal.getCollectCount() + 1);
            journalRepository.updateById(journal);
        }
    }

    @Override
    public void cancelCollect(Long userId, Long journalId) {
        QueryWrapper<JournalCollection> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId).eq("journal_id", journalId);
        collectionRepository.delete(queryWrapper);

        Journal journal = journalRepository.selectById(journalId);
        if (journal != null && journal.getCollectCount() > 0) {
            journal.setCollectCount(journal.getCollectCount() - 1);
            journalRepository.updateById(journal);
        }
    }

    @Override
    public PageResponse<JournalResponse> getUserCollections(Long userId, Integer page, Integer pageSize) {
        // 获取用户收藏的游记ID
        QueryWrapper<JournalCollection> collectionQuery = new QueryWrapper<>();
        collectionQuery.eq("user_id", userId);
        collectionQuery.orderByDesc("create_time");
        List<JournalCollection> collections = collectionRepository.selectList(collectionQuery);

        List<Long> journalIds = collections.stream()
                .map(JournalCollection::getJournalId)
                .collect(Collectors.toList());

        if (journalIds.isEmpty()) {
            return new PageResponse<>(new ArrayList<>(), 0L, page, pageSize);
        }

        // 分页获取游记
        Page<Journal> pageParam = new Page<>(page, pageSize);
        QueryWrapper<Journal> journalQuery = new QueryWrapper<>();
        journalQuery.in("id", journalIds);
        Page<Journal> result = journalRepository.selectPage(pageParam, journalQuery);

        List<JournalResponse> list = result.getRecords().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(list, result.getTotal(), page, pageSize);
    }

    private JournalResponse convertToResponse(Journal journal) {
        City city = cityRepository.selectById(journal.getCityId());
        User author = userRepository.selectById(journal.getAuthorId());

        List<String> images = ImageListSerializer.deserialize(journal.getImages());

        List<CheckinResponse> checkins = getJournalCheckins(journal.getId());

        JournalResponse response = new JournalResponse();
        response.setId(journal.getId());
        response.setTitle(journal.getTitle());
        response.setContent(journal.getContent());
        response.setImages(images);
        response.setCityId(journal.getCityId());
        response.setCityName(city != null ? city.getName() : "");
        response.setAuthorId(journal.getAuthorId());
        response.setAuthorName(author != null ? author.getNickname() : "");
        response.setCreateTime(journal.getCreateTime().format(FORMATTER));
        response.setLikeCount(journal.getLikeCount());
        response.setCollectCount(journal.getCollectCount());
        response.setCheckins(checkins);
        return response;
    }

    private List<CheckinResponse> getJournalCheckins(Long journalId) {
        QueryWrapper<JournalCheckin> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("journal_id", journalId);
        List<JournalCheckin> journalCheckins = journalCheckinRepository.selectList(queryWrapper);

        if (journalCheckins.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> checkinIds = journalCheckins.stream()
                .map(JournalCheckin::getCheckinId)
                .collect(Collectors.toList());

        QueryWrapper<Checkin> checkinQueryWrapper = new QueryWrapper<>();
        checkinQueryWrapper.in("id", checkinIds);
        List<Checkin> checkins = checkinRepository.selectList(checkinQueryWrapper);

        return checkins.stream()
                .map(this::convertCheckinToResponse)
                .sorted(Comparator.comparing(CheckinResponse::getTravelTime))
                .collect(Collectors.toList());
    }

    private CheckinResponse convertCheckinToResponse(Checkin checkin) {
        City city = cityRepository.selectById(checkin.getCityId());

        CheckinResponse response = new CheckinResponse();
        response.setId(checkin.getId());
        response.setUserId(checkin.getUserId());
        response.setCityId(checkin.getCityId());
        response.setCityName(city != null ? city.getName() : "");
        response.setLocation(checkin.getLocation());
        response.setTravelTime(checkin.getTravelTime().format(FORMATTER));
        response.setTravelMethod(checkin.getTravelMethod());
        response.setCreateTime(checkin.getCreateTime().format(FORMATTER));
        return response;
    }
}
