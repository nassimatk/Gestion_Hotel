# ─────────────────────────────────────────────────────────────────────────────
# chambres-service — Dockerfile
# Image : PHP 8.2 Alpine + extensions PostgreSQL
# Port interne : 8000  |  Port hôte : 8001
# ─────────────────────────────────────────────────────────────────────────────

# ── Étape 1 : build des dépendances Composer ─────────────────────────────────
FROM composer:2.7 AS composer-build

WORKDIR /app

COPY composer.json ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

COPY . .
RUN composer dump-autoload --optimize

# ── Étape 2 : image finale ────────────────────────────────────────────────────
FROM php:8.2-fpm-alpine

# Dépendances système
RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libpq \
    supervisor \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# Configuration Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Configuration Supervisor (nginx + php-fpm)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /var/www/html

# Copier l'application avec les dépendances buildées
COPY --from=composer-build /app /var/www/html

# Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Script d'entrée : migrations + seeder + démarrage
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
