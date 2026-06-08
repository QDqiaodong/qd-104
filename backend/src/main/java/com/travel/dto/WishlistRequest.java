package com.travel.dto;

import lombok.Data;

@Data
public class WishlistRequest {
    private Long cityId;
    private String expectedSeason;
    private String reason;
    private String experience;
}
