package com.travel.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.travel.entity.Journal;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface JournalRepository extends BaseMapper<Journal> {
}
