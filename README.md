# 旅行足迹游记记录平台

一款主打个人生活记录的旅行游记平台，为旅行爱好者提供足迹打卡、图文游记发布、优质攻略收藏的一站式服务。

## 技术栈

### 前端
- Vue 3 + Composition API
- TypeScript
- Vite 5.x
- TailwindCSS 3.x
- Pinia (状态管理)
- Vue Router 4.x

### 后端
- SpringBoot 3.2.x
- MyBatis-Plus 3.5.x
- SQLite 数据库
- JWT 认证

### 部署
- Docker & Docker Compose
- Nginx

## 快速开始

### 前端开发

```bash
npm install
npm run dev
```

### 后端开发

```bash
cd backend
# 需要 Maven 3.9+ 和 JDK 17+
mvn spring-boot:run
```

### Docker 部署

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

## 核心功能

1. **旅行足迹打卡** - 选择城市、记录地点、出行时间和方式
2. **图文游记发布** - 富文本编辑、图片上传、智能压缩
3. **游记浏览与收藏** - 发现优质游记、收藏攻略
4. **个人旅行档案** - 统计数据、查看足迹地图

## 项目结构

```
├── src/               # Vue3 前端源码
├── backend/           # SpringBoot 后端项目
├── docker-compose.yml # Docker Compose 配置
├── Dockerfile         # 前端生产镜像
└── nginx.conf         # Nginx 配置
```

## 离线特性

- 城市字典库本地内置
- 无需第三方定位API
- 无需外网地图解析接口
- 支持纯离线商用部署

## Docker 交付说明

- 前端镜像会在构建时自动执行 `npm ci && npm run build`
- 后端使用 SQLite，数据库文件持久化到宿主机 `./data/travel_footprint.db`
- 启动后访问 `http://localhost`，接口通过 Nginx 反向代理到 `http://localhost:8080`
