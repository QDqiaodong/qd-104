package com.travel.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CommonMapper {
    @Select("SELECT last_insert_rowid()")
    Long getLastInsertId();
}
