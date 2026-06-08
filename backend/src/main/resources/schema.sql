-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 城市字典表
CREATE TABLE IF NOT EXISTS city (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    aliases TEXT
);

-- 游记表
CREATE TABLE IF NOT EXISTS journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    city_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    FOREIGN KEY (city_id) REFERENCES city(id),
    FOREIGN KEY (author_id) REFERENCES user(id)
);

-- 打卡记录表
CREATE TABLE IF NOT EXISTS checkin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    location VARCHAR(200) NOT NULL,
    travel_time DATETIME NOT NULL,
    travel_method VARCHAR(20) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (city_id) REFERENCES city(id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS collection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    journal_id INTEGER NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (journal_id) REFERENCES journal(id)
);

-- 旅行愿望单表
CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    expected_season VARCHAR(20),
    reason TEXT,
    experience TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (city_id) REFERENCES city(id)
);

-- 游记-打卡关联表
CREATE TABLE IF NOT EXISTS journal_checkin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_id INTEGER NOT NULL,
    checkin_id INTEGER NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_id) REFERENCES journal(id),
    FOREIGN KEY (checkin_id) REFERENCES checkin(id),
    UNIQUE (journal_id, checkin_id)
);
