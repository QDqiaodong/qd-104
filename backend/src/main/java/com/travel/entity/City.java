package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("city")
public class City {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String province;
    private String name;
    private String description;
}
