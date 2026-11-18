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

# Generer la cle d'application, migrer la DB, seeder, puis demarrer le serveur
CMD sh -c " \
    php artisan key:generate --no-interaction --force 2>/dev/null || true && \
    php artisan migrate --force --no-interaction && \
    php artisan db:seed --force --no-interaction && \
    php artisan serve --host=0.0.0.0 --port=8000 --no-interaction \
"
