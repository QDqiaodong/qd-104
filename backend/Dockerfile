# 构建与运行合并，减少对额外运行时镜像的依赖
FROM docker.m.daocloud.io/library/maven:3.9.6-eclipse-temurin-17
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests
RUN mv target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
