package com.travel.service;

import com.travel.dto.JournalRequest;
import com.travel.dto.JournalResponse;
import com.travel.dto.PageResponse;

public interface JournalService {
    PageResponse<JournalResponse> getJournalList(Integer page, Integer pageSize, Long cityId, String keyword);
    JournalResponse getJournalDetail(Long id);
    JournalResponse createJournal(Long authorId, JournalRequest request);
    void deleteJournal(Long id);
    void collectJournal(Long userId, Long journalId);
    void cancelCollect(Long userId, Long journalId);
    PageResponse<JournalResponse> getUserCollections(Long userId, Integer page, Integer pageSize);
}
