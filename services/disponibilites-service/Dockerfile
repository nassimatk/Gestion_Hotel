# PLACEHOLDER : a remplacer par le Dockerfile reel du service (Laravel, Spring Boot...).
# Regle : le service doit ecouter sur le port 8000 DANS le conteneur
# et exposer GET /api/health -> {"status":"ok"}
FROM nginx:alpine
COPY placeholder.conf /etc/nginx/conf.d/default.conf
EXPOSE 8000

# Etape 1 : construire le .jar avec Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

# Etape 2 : image finale legere avec Java seulement
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]
