package com.travel.dto;

import lombok.Data;
import java.util.List;

@Data
public class JournalRequest {
    private String title;
    private String content;
    private List<String> images;
    private Long cityId;
    private List<Long> checkinIds;
}
