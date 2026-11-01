#!/bin/sh
# entrypoint.sh — Démarre chambres-service
set -e

cd /var/www/html

echo "🔧 [chambres-service] Génération de la clé d'application..."
php artisan key:generate --no-interaction --force 2>/dev/null || true

echo "🗄️  [chambres-service] Exécution des migrations..."
php artisan migrate --force --no-interaction

echo "🌱 [chambres-service] Seeding des données initiales..."
php artisan db:seed --force --no-interaction 2>/dev/null || true

echo "🚀 [chambres-service] Démarrage de Nginx + PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
