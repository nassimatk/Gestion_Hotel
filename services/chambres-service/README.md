# chambres-service — HotelHub

Microservice de gestion des chambres d'hôtel.  
Stack : **PHP 8.2 / Laravel 12 / PostgreSQL** (schéma `chambres`).

---

## 🔌 Endpoints

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `GET` | `/api/health` | Aucune | Health check |
| `GET` | `/api/chambres` | Aucune | Liste des chambres (filtres optionnels) |
| `GET` | `/api/chambres/{id}` | Aucune | Détail d'une chambre |
| `POST` | `/api/chambres` | Admin JWT | Créer une chambre |
| `PUT` | `/api/chambres/{id}` | Admin JWT | Modifier une chambre |
| `DELETE` | `/api/chambres/{id}` | Admin JWT | Soft-delete d'une chambre |

### Filtres GET /api/chambres
```
?type=suite&capacite=2&prix_min=500&prix_max=2000&statut=disponible
```

---

## 🔐 Authentification

JWT partagé avec `auth-service` — algorithme **HS256**.  
Header : `Authorization: Bearer <token>`

---

## 🗄️ Modèle Chambre

| Champ | Type | Description |
|-------|------|-------------|
| `numero` | string(10) | Numéro unique de chambre |
| `type` | enum | `simple`, `double`, `suite`, `presidentielle` |
| `capacite` | int | Nombre de personnes max |
| `prix_nuit` | decimal | Prix par nuit en MAD |
| `description` | text | Description détaillée |
| `superficie` | decimal | Surface en m² |
| `etage` | int | Numéro d'étage |
| `vue` | string | Type de vue |
| `equipements` | jsonb | Liste des équipements |
| `images` | jsonb | Chemins des images |
| `statut` | enum | `disponible`, `occupee`, `maintenance` |
| `deleted_at` | timestamp | Soft delete (null = actif) |

---

## 🚀 Lancement local

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve --port=8001
```

## 🧪 Tests

```bash
php artisan test --testdox
```

---

## 🐳 Docker

Via Docker Compose (depuis la racine) :
```bash
docker compose -f infra/compose/docker-compose.yml up chambres-service
```

---

## 📁 Structure

```
chambres-service/
├── app/
│   ├── Http/
│   │   ├── Controllers/ChambreController.php
│   │   └── Middleware/JwtMiddleware.php + JwtAdminMiddleware.php
│   └── Models/Chambre.php
├── database/migrations/ + seeders/
├── docker/ (nginx.conf, supervisord.conf, entrypoint.sh)
├── routes/api.php
├── tests/Feature/ChambreApiTest.php
└── Dockerfile
```
