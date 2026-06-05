package com.travel;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.travel.repository")
public class TravelApplication {
    public static void main(String[] args) {
        SpringApplication.run(TravelApplication.class, args);
    }
}
