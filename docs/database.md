# Base de données

Un serveur PostgreSQL, une base `hotel_db`, **un schéma et un utilisateur par service**. Chaque utilisateur n'a accès qu'à son schéma : tout accès croisé est refusé par PostgreSQL.

| Service | Schéma | Utilisateur |
|---|---|---|
| auth-service | `auth` | `auth_user` |
| chambres-service | `chambres` | `chambres_user` |
| avis-service | `avis` | `avis_user` |
| disponibilites-service | `disponibilites` | `disponibilites_user` |
| tarifs-service | `tarifs` | `tarifs_user` |

Création : `infra/postgres/init/01-init-schemas.sql`, exécuté **uniquement à la première création du volume** (sinon : `down -v`).

## Tables par service
_Chaque responsable complète sa section (tables, colonnes, types)._

### Schéma `auth`
_À compléter (ex. users avec name, email, password hashé, role)._

### Schéma `chambres`
_À compléter (ex. chambres, types_chambre)._

### Schéma `avis`
_À compléter (ex. avis)._

### Schéma `disponibilites`
_À compléter (ex. disponibilites)._

### Schéma `tarifs`
_À compléter (ex. tarifs, saisons, promotions)._

## Relations logiques entre services
Pas de clé étrangère entre schémas : on stocke l'identifiant et on valide via REST.

- `avis.avis.user_id` → `auth.users.id` (identifié par le JWT, sans appel)
- `avis.avis.chambre_id` → `chambres.chambres.id`
- `disponibilites.disponibilites.chambre_id` → `chambres.chambres.id`
- `tarifs.tarifs.type_chambre` ← type fourni par `chambres-service`
