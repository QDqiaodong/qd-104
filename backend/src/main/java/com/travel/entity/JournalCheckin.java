package com.travel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("journal_checkin")
public class JournalCheckin {
    @TableId(type = IdType.INPUT)
    private Long id;
    private Long journalId;
    private Long checkinId;
    private LocalDateTime createTime;
}
