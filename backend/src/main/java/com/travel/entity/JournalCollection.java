package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("collection")
public class JournalCollection {
    @TableId(type = IdType.INPUT)
    private Long id;
    private Long userId;
    private Long journalId;
    private LocalDateTime createTime;
}
