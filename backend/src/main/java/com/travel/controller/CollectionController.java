package com.travel.controller;

import com.travel.config.JwtInterceptor;
import com.travel.dto.*;
import com.travel.service.JournalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/collection")
public class CollectionController {

    @Autowired
    private JournalService journalService;

    @PostMapping
    public ApiResponse<Void> collectJournal(@RequestBody CollectionRequest request, HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        journalService.collectJournal(userId, request.getJournalId());
        return ApiResponse.success("收藏成功", null);
    }

    @DeleteMapping("/{journalId}")
    public ApiResponse<Void> cancelCollect(@PathVariable Long journalId, HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        journalService.cancelCollect(userId, journalId);
        return ApiResponse.success("取消收藏成功", null);
    }

    @GetMapping("/list")
    public ApiResponse<PageResponse<JournalResponse>> getUserCollections(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize,
            HttpServletRequest httpRequest) {
        Long userId = JwtInterceptor.getCurrentUserId(httpRequest);
        PageResponse<JournalResponse> response = journalService.getUserCollections(userId, page, pageSize);
        return ApiResponse.success(response);
    }
}
