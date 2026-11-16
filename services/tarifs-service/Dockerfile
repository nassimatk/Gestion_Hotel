FROM php:8.3-cli-alpine

RUN apk add --no-cache postgresql-dev git unzip \
 && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize && cp -n .env.example .env

ENV DB_CONNECTION=pgsql \
    SESSION_DRIVER=array \
    CACHE_STORE=array \
    QUEUE_CONNECTION=sync \
    APP_ENV=production \
    APP_DEBUG=false

EXPOSE 8000
CMD ["sh", "-c", "php artisan key:generate --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]