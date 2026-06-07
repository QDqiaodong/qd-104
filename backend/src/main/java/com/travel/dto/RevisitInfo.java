package com.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevisitInfo {
    private String type;
    private Long matchedCheckinId;
    private String matchedLocation;
    private String matchedCityName;
    private Integer daysSinceLastVisit;
    private Integer totalVisitsInCity;
    private Double similarityScore;
}
