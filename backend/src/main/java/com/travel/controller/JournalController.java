package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.*;
import com.travel.service.JournalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    @Autowired
    private JournalService journalService;

    @GetMapping("/list")
    public ApiResponse<PageResponse<JournalResponse>> getJournalList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) String keyword) {
        PageResponse<JournalResponse> response = journalService.getJournalList(page, pageSize, cityId, keyword);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<JournalResponse> getJournalDetail(@PathVariable Long id) {
        try {
            JournalResponse response = journalService.getJournalDetail(id);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<JournalResponse> createJournal(@RequestBody JournalRequest request, HttpServletRequest httpRequest) {
        Long authorId = JwtInterceptor.getCurrentUserId(httpRequest);
        JournalResponse response = journalService.createJournal(authorId, request);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteJournal(@PathVariable Long id) {
        journalService.deleteJournal(id);
        return ApiResponse.success(null);
    }
}
