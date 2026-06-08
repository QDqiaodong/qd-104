package com.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import com.travel.entity.City;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String nickname;
    private Integer cityCount;
    private Integer journalCount;
    private Integer checkinCount;
    private Integer collectCount;
    private Integer wishlistCount;
    private List<City> cities;
}
