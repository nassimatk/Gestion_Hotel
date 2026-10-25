FROM php:8.2-cli-alpine

# Installer les dependances systeme et extensions PostgreSQL
RUN apk add --no-cache postgresql-dev bash curl \
    && docker-php-ext-install pdo pdo_pgsql bcmath

WORKDIR /app

# Copier le code
COPY . .

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Installer les dependances
RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8000

# Lancer les migrations puis demarrer le serveur Laravel sur le port 8000
CMD sh -c "php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000"
