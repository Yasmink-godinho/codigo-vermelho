# syntax=docker/dockerfile:1

# ========================= Etapa 1: build =========================
# Compila a aplicacao e RODA OS TESTES. Se algum teste estiver vermelho,
# o build falha aqui e a imagem final nunca e gerada.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q clean verify

# ========================= Etapa 2: runtime =======================
# Imagem final enxuta: so o JRE + o jar. Menor e com menos pacotes
# vulneraveis do que a imagem de build (que carrega o JDK e o Maven).
FROM eclipse-temurin:21-jre
WORKDIR /app

# curl: usado pelo healthcheck do compose.  Usuario nao-root: a app nao roda como root.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home --uid 10001 spring

COPY --from=build /app/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
