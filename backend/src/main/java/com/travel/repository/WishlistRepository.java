package com.travel.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.travel.entity.Wishlist;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WishlistRepository extends BaseMapper<Wishlist> {
}
