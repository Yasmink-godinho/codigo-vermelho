# Etapa 1: build da aplicação com Maven
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q clean package -DskipTests

# Etapa 2: imagem final, só com o jar (menor e mais rápida)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
