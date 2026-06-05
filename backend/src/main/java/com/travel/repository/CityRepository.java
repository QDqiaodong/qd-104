package com.travel.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.travel.entity.City;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CityRepository extends BaseMapper<City> {
}
