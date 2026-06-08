package com.travel.dto;

import lombok.Data;

@Data
public class WishlistResponse {
    private Long id;
    private Long userId;
    private Long cityId;
    private String cityName;
    private String cityProvince;
    private String cityDescription;
    private String expectedSeason;
    private String reason;
    private String experience;
    private String createTime;
}
