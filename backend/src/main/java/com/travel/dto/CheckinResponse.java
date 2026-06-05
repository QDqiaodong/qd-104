package com.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckinResponse {
    private Long id;
    private Long userId;
    private Long cityId;
    private String cityName;
    private String location;
    private String travelTime;
    private String travelMethod;
    private String createTime;
}
