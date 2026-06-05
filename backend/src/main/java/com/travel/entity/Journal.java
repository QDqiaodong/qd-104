package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("journal")
public class Journal {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String content;
    private String images;
    private Long cityId;
    private Long authorId;
    private LocalDateTime createTime;
    private Integer likeCount;
    private Integer collectCount;
}
