package com.travel.dto;

import lombok.Data;

@Data
public class CheckinRequest {
    private Long cityId;
    private String location;
    private String travelTime; // 使用 String 避免格式转换问题
    private String travelMethod;
}
