FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
RUN groupadd --system pethub && useradd --system --gid pethub pethub
WORKDIR /app
COPY --from=build /workspace/target/pethub-backend-1.0.0.jar app.jar
RUN mkdir /app/data && chown -R pethub:pethub /app
USER pethub
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
