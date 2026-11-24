#!/bin/sh
# entrypoint.sh â€” DÃ©marre chambres-service
set -e

cd /var/www/html

echo "ðŸ”§ [chambres-service] GÃ©nÃ©ration de la clÃ© d'application..."
php artisan key:generate --no-interaction --force 2>/dev/null || true

echo "ðŸ—„ï¸  [chambres-service] ExÃ©cution des migrations..."
php artisan migrate --force --no-interaction

echo "ðŸŒ± [chambres-service] Seeding des donnÃ©es initiales..."
php artisan db:seed --force --no-interaction 2>/dev/null || true

echo "ðŸš€ [chambres-service] DÃ©marrage de Nginx + PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
