package com.travel.dto;

import lombok.Data;
import java.util.List;

@Data
public class FootprintHeatmapResponse {
    private String date;
    private int activityCount;
    private List<DailyActivity> activities;

    public FootprintHeatmapResponse(String date, int activityCount, List<DailyActivity> activities) {
        this.date = date;
        this.activityCount = activityCount;
        this.activities = activities;
    }

    @Data
    public static class DailyActivity {
        private Long id;
        private String type;
        private String title;
        private String cityName;
        private String time;
        private String image;

        public DailyActivity(Long id, String type, String title, String cityName, String time, String image) {
            this.id = id;
            this.type = type;
            this.title = title;
            this.cityName = cityName;
            this.time = time;
            this.image = image;
        }
    }
}
