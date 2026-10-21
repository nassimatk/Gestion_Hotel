# Guide de la Base de Données Partagée & pgAdmin (HotelHub)

Ce guide détaille l'organisation, le démarrage et l'utilisation de la base de données PostgreSQL 16 et de son interface d'administration pgAdmin 4 pour le projet **HotelHub**.

---

## 1. Démarrage rapide (1 seule commande)

### Prérequis
* Docker Desktop installé et en cours d'exécution.
* Avoir copié le fichier d'environnement à la racine :
  ```bash
  cp .env.example .env
  ```

### Lancement de toute la stack
Depuis la racine du projet `hotelhub/`, exécutez :

```bash
docker compose --env-file .env -f infra/compose/docker-compose.yml up -d --build
```

Cette commande démarre automatiquement en arrière-plan :
* Le serveur de base de données **PostgreSQL 16** (port 5432).
* L'interface d'administration **pgAdmin 4** (port 5050).
* Les 5 microservices backend (ports 8001 à 8005).
* Le frontend React (port 3000).

---

## 2. Accès à pgAdmin 4 (Interface Web)

pgAdmin est configuré pour être **immédiatement opérationnel**, sans configuration manuelle du serveur de base de données.

* **URL d'accès** : [http://localhost:5050](http://localhost:5050)
* **Identifiants de connexion pgAdmin** (configurés dans `.env`) :
  * **Email** : `admin@hotelhub.com`
  * **Mot de passe** : `admin_secret`

### Connexion automatique à la base `hotel_db`
Grâce au fichier de provisionnement monté dans le conteneur (`infra/pgadmin/servers.json`) :
1. Dès votre connexion à pgAdmin, le serveur nommé **`HotelHub (PostgreSQL 16)`** apparaît automatiquement dans l'arborescence à gauche sous le groupe `HotelHub`.
2. Cliquez dessus pour vous connecter.
3. Le mot de passe demandé pour l'utilisateur super-admin `admin` est celui défini par `POSTGRES_ADMIN_PASSWORD` (par défaut en dev : `admin_pass`).
4. Cochez **"Save Password"** si vous souhaitez que votre session pgAdmin le mémorise.

---

## 3. Architecture & Organisation de la base partagée

### Principe "Database-Per-Service" par Schémas
Pour concilier simplicité de déploiement et isolation microservices, nous utilisons **une base physique unique (`hotel_db`)** découpée en **5 schémas PostgreSQL strictement étanches**.

| Microservice | Port API | Schéma BDD | Utilisateur BDD | Mot de passe dev (`.env`) |
| :--- | :--- | :--- | :--- | :--- |
| **auth-service** | 8005 | `auth` | `auth_user` | `auth_pass` |
| **chambres-service** | 8001 | `chambres` | `chambres_user` | `chambres_pass` |
| **avis-service** | 8002 | `avis` | `avis_user` | `avis_pass` |
| **disponibilites-service** | 8003 | `disponibilites` | `disponibilites_user` | `disponibilites_pass` |
| **tarifs-service** | 8004 | `tarifs` | `tarifs_user` | `tarifs_pass` |
| **Super-Admin / pgAdmin** | 5432 | Tous | `admin` | `admin_pass` |

### Règles strictes d'étanchéité
1. **Accès exclusif** : `auth_user` n'a de droits que sur le schéma `auth`. S'il tente de requêter `chambres.*`, PostgreSQL refusera la requête (`permission denied`).
2. **Pas de clés étrangères (FK) inter-schémas** : Ne créez jamais de contrainte `FOREIGN KEY` référençant une table d'un autre schéma.
   * *Exemple* : Dans `avis.avis`, on stocke `chambre_id INT` et `user_id INT`.
   * La validation de l'existence de la chambre se fait via un appel REST à `chambres-service`.
   * L'identité du client est vérifiée via le token JWT signé par `auth-service`.
3. **Schéma public verrouillé** : L'accès au schéma `public` par défaut est révoqué.

---

## 4. Configuration des microservices

Chaque conteneur de microservice reçoit automatiquement ses variables de connexion dans `docker-compose.yml` :

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hotel_db
DB_USER=<nom_utilisateur_du_service>
DB_PASSWORD=<mot_de_passe>
DB_SCHEMA=<nom_du_schema>
```

### Exemple pour Laravel (`config/database.php`)
```php
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST', 'postgres'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_NAME', 'hotel_db'),
    'username' => env('DB_USER', 'chambres_user'),
    'password' => env('DB_PASSWORD', 'chambres_pass'),
    'charset' => 'utf8',
    'prefix' => '',
    'search_path' => env('DB_SCHEMA', 'chambres'),
    'sslmode' => 'prefer',
],
```

### Exemple pour Spring Boot (`application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://postgres:5432/hotel_db?currentSchema=${DB_SCHEMA}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.properties.hibernate.default_schema=${DB_SCHEMA}
```

---

## 5. Initialisation automatique & Migrations

### Script d'initialisation initial (`infra/postgres/init/01-init-schemas.sql`)
Ce script s'exécute automatiquement **uniquement lors de la première création du conteneur PostgreSQL** (quand le volume Docker est vierge) :
1. Il crée les 5 schémas (`auth`, `chambres`, etc.).
2. Il crée les utilisateurs applicatifs et leur assigne leurs mots de passe.
3. Il configure les droits (`GRANT ALL ON SCHEMA`) et les privilèges par défaut (`ALTER DEFAULT PRIVILEGES`) pour que les futures tables créées lors des migrations appartiennent bien à leur utilisateur respectif.
4. Il positionne le `search_path` par défaut de chaque utilisateur sur son schéma propre.

### Exécution des migrations applicatives
Chaque développeur place et exécute les migrations de son service dans le dossier de son service (ex: `services/chambres-service/`). 
Comme son utilisateur est configuré avec son `search_path` par défaut, les tables se créent automatiquement dans son propre schéma.

---

## 6. Persistance des données (Volumes Docker)

Le projet utilise deux volumes Docker nommés déclarés dans `infra/compose/docker-compose.yml` :
* `pgdata` : Stocke l'ensemble des données de la base PostgreSQL (`/var/lib/postgresql/data`).
* `pgadmin_data` : Stocke les sessions et préférences pgAdmin (`/var/lib/pgadmin`).

### Arrêter le projet sans perdre les données
```bash
docker compose --env-file .env -f infra/compose/docker-compose.yml down
```
Toutes les données, tables, utilisateurs et sessions pgAdmin sont conservées intactes pour le prochain démarrage.

### Réinitialiser la base à zéro (Clean Reset)
Si vous modifiez `01-init-schemas.sql` ou souhaitez repartir d'une base totalement neuve :
```bash
docker compose --env-file .env -f infra/compose/docker-compose.yml down -v
docker compose --env-file .env -f infra/compose/docker-compose.yml up -d --build
```
> [!WARNING]
> L'option `-v` supprime définitivement les volumes Docker (`pgdata` et `pgadmin_data`). Vos scripts d'initialisation seront alors réexécutés au redémarrage.

---

## 7. Commandes utiles & Dépannage

### Voir les logs de PostgreSQL ou pgAdmin
```bash
# Logs PostgreSQL
docker compose --env-file .env -f infra/compose/docker-compose.yml logs -f postgres

# Logs pgAdmin
docker compose --env-file .env -f infra/compose/docker-compose.yml logs -f pgadmin
```

### Se connecter directement en ligne de commande (psql)
```bash
# Connexion administrateur
docker compose --env-file .env -f infra/compose/docker-compose.yml exec postgres psql -U admin -d hotel_db

# Connexion avec l'utilisateur d'un service (ex: chambres_user)
docker compose --env-file .env -f infra/compose/docker-compose.yml exec postgres psql -U chambres_user -d hotel_db
```

### Lister les schémas et tables depuis psql
```sql
\dn              -- Lister tous les schémas
\dt auth.*       -- Lister les tables du schéma auth
\dt chambres.*   -- Lister les tables du schéma chambres
```
