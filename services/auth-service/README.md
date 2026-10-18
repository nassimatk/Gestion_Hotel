# auth-service

Service d'authentification : il identifie l'utilisateur et **emet un token JWT**. Rien d'autre.

- **Technologie** : Laravel
- **Port hote** : 8005 (port conteneur : 8000)
- **Schema PostgreSQL** : `auth` dans `hotel_db` (utilisateur `auth_user`, mot de passe `AUTH_DB_PASSWORD`)
- **Contrat d'API** : `docs/api-contracts/auth-service.yaml`
- **Responsable** : _a completer_

## Routes
| Route | Role |
|---|---|
| `POST /api/register` | Cree un utilisateur (role `client` par defaut) |
| `POST /api/login` | Verifie email + mot de passe, retourne un JWT |
| `GET /api/me` | Retourne l'utilisateur du token |

## JWT
- Algorithme **HS256**, signe avec `JWT_SECRET` (identique dans TOUS les services).
- Contenu minimal du token : `sub` (user_id), `role` (`client` ou `admin`), `exp`.
- Les autres services valident le token localement, sans appeler ce service.

## Lancer et tester ce service
_A completer par le responsable : installation, variables d'environnement, migrations, tests._

## Migrations
Les migrations vivent uniquement dans ce dossier.
