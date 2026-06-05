package com.travel.controller;

import com.travel.dto.ApiResponse;
import com.travel.entity.City;
import com.travel.service.CheckinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
public class CityController {

    @Autowired
    private CheckinService checkinService;

    @GetMapping
    public ApiResponse<List<City>> getCities() {
        List<City> cities = checkinService.getCities();
        return ApiResponse.success(cities);
    }
}
