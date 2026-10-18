# Conventions de développement

## 1. Règles communes aux services

| Règle | Valeur |
|---|---|
| Préfixe des routes | `/api/...` |
| Format | JSON (`Content-Type: application/json`) |
| Port dans le conteneur | `8000` pour tous les services |
| Ports hôte | chambres 8001, avis 8002, disponibilités 8003, tarifs 8004, auth 8005 |
| Authentification | JWT HS256 émis par `auth-service` ; header `Authorization: Bearer <token>` ; même `JWT_SECRET` dans tous les services |
| Contenu du token | `sub` (id utilisateur), `role` (`client` ou `admin`), `exp` |
| Autorisation | Écriture (POST/PUT/DELETE) et admin : rôle `admin` sinon `403` ; token absent/invalide : `401` |
| Santé | `GET /api/health` → `{"status":"ok"}` |
| Format d'erreur | `{"error":"message","code":404}` |
| Codes HTTP | 200, 201, 204, 400, 401, 403, 404, 422, 500 |
| Configuration | Variables d'environnement uniquement |
| Variables BDD | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA` |
| Base de données | Uniquement le schéma du service ; pas de clé étrangère entre schémas |
| CORS | Autoriser `http://localhost:3000` |
| Appels entre services | Nom Docker : `http://chambres-service:8000/api/...` |
| Dates | ISO 8601 (`2026-07-14`) |
| Nommage | Ressources au pluriel (`/chambres`), `snake_case` dans le JSON |

Chaque framework mappe les variables `DB_*` sur sa configuration (Laravel : `config/database.php` avec `'search_path' => env('DB_SCHEMA')` ; Spring Boot : `?currentSchema=${DB_SCHEMA}` dans l'URL JDBC).

## 2. Git
Le workflow complet (branches, clonage, commits, Pull Requests, conflits, validation) est dans [`GUIDE.md`](../GUIDE.md).

Résumé :
- Branches : `main` (stable), `dev` (intégration), `feature/<service>-<tâche>`.
- Commit : `type(scope): description`, ex. `feat(chambres): add rooms CRUD`.
- Types : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Scopes : `auth`, `chambres`, `avis`, `disponibilites`, `tarifs`, `frontend`, `infra`, `docs`.

## 3. Règles essentielles
- Jamais de `.env` ni de secret (dont `JWT_SECRET`) dans Git.
- Travailler uniquement dans le dossier de son service.
- Migrations dans le dossier de leur service ; pas de modification de celles d'un autre service sans coordination.
- Jamais d'accès direct au schéma d'un autre service : passer par son API REST.
- Contrat d'API écrit avant ou avec le code ; documentation mise à jour dans la même PR.
