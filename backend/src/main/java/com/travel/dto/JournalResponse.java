package com.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JournalResponse {
    private Long id;
    private String title;
    private String content;
    private List<String> images;
    private Long cityId;
    private String cityName;
    private Long authorId;
    private String authorName;
    private String createTime;
    private Integer likeCount;
    private Integer collectCount;
    private List<CheckinResponse> checkins;
}
