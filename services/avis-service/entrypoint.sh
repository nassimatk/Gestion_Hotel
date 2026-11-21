#!/bin/sh

set -e

cd /var/www

echo "======================================"
echo " Demarrage du service Avis"
echo "======================================"

echo "[avis-service] Execution des migrations..."

ATTEMPTS=0
MAX_ATTEMPTS=10

until php artisan migrate --force --no-interaction; do
    ATTEMPTS=$((ATTEMPTS + 1))

    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
        echo "[avis-service] ERREUR : migrations impossibles."
        exit 1
    fi

    echo "[avis-service] PostgreSQL indisponible."
    echo "[avis-service] Nouvelle tentative dans 5 secondes..."
    sleep 5
done

echo "[avis-service] Migrations terminees."
echo "[avis-service] Demarrage de Laravel..."

exec php artisan serve --host=0.0.0.0 --port=8000