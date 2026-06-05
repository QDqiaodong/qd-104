package com.travel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.travel.dto.*;
import com.travel.entity.*;
import com.travel.repository.*;
import com.travel.service.JournalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
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
        journal.setImages(String.join(",", request.getImages()));
        journal.setCityId(request.getCityId());
        journal.setAuthorId(authorId);
        journal.setCreateTime(LocalDateTime.now());
        journal.setLikeCount(0);
        journal.setCollectCount(0);
        journalRepository.insert(journal);
        
        Long journalId = commonMapper.getLastInsertId();
        journal.setId(journalId);

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

        List<String> images = journal.getImages() != null
                ? Arrays.asList(journal.getImages().split(","))
                : new ArrayList<>();

        return new JournalResponse(
                journal.getId(),
                journal.getTitle(),
                journal.getContent(),
                images,
                journal.getCityId(),
                city != null ? city.getName() : "",
                journal.getAuthorId(),
                author != null ? author.getNickname() : "",
                journal.getCreateTime().format(FORMATTER),
                journal.getLikeCount(),
                journal.getCollectCount()
        );
    }
}
