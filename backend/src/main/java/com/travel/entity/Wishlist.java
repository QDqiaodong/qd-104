package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("wishlist")
public class Wishlist {
    @TableId(type = IdType.INPUT)
    private Long id;
    private Long userId;
    private Long cityId;
    private String expectedSeason;
    private String reason;
    private String experience;
    private LocalDateTime createTime;
}
