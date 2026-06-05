package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("checkin")
public class Checkin {
    @TableId(type = IdType.INPUT)
    private Long id;
    private Long userId;
    private Long cityId;
    private String location;
    private LocalDateTime travelTime;
    private String travelMethod;
    private LocalDateTime createTime;
}
