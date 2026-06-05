ARG DOCKER_REGISTRY=docker.m.daocloud.io

# 构建与运行合并，减少对额外运行时镜像的依赖
FROM ${DOCKER_REGISTRY}/library/maven:3.9.6-eclipse-temurin-17
WORKDIR /app

COPY .mvn ./.mvn
COPY pom.xml .
RUN mvn -B -DskipTests dependency:resolve dependency:resolve-plugins dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package
RUN mv target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
