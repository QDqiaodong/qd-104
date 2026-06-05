package com.travel.service;

import com.travel.dto.CheckinRequest;
import com.travel.dto.CheckinResponse;
import com.travel.dto.PageResponse;
import com.travel.entity.City;
import java.util.List;

public interface CheckinService {
    PageResponse<CheckinResponse> getCheckinList(Long userId, String sortBy, String sortOrder);
    CheckinResponse createCheckin(Long userId, CheckinRequest request);
    List<City> getCities();
}
