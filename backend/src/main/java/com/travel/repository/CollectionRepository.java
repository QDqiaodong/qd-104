package com.travel.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.travel.entity.JournalCollection;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CollectionRepository extends BaseMapper<JournalCollection> {
}
