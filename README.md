# HotelHub

Application de gestion d'hôtel basée sur une **architecture microservices**.
Chaque service est indépendant (code, Dockerfile, migrations, base de données) et communique avec les autres par **API REST (HTTP + JSON)**.

## Objectifs
- Appliquer une architecture microservices avec des technologies hétérogènes (Laravel, Spring Boot, ...).
- Garantir l'indépendance des services : un service = un dossier, une base, un Dockerfile.
- Faire communiquer les services uniquement via des API REST.
- Fournir une interface unique (React) qui consomme ces API.

## Architecture générale

```
        Frontend React (:3000)
               │  REST / JSON + JWT
  ┌────────┬───┴────┬──────────┬───────────────┬────────┐
  ▼        ▼        ▼          ▼               ▼        
 Auth   Chambres   Avis   Disponibilités     Tarifs
:8005    :8001    :8002      :8003           :8004
  └────────┴────────┴─────┬────┴───────────────┴────────┘
                          ▼
       PostgreSQL (:5432) - 1 schéma par service
```

| Service | Responsabilité | Port hôte | Schéma |
|---|---|---|---|
| auth-service | Authentification, émission du JWT (rôles client/admin) | 8005 | `auth` |
| chambres-service | Catalogue des chambres, types, équipements | 8001 | `chambres` |
| avis-service | Avis et notes des clients | 8002 | `avis` |
| disponibilites-service | Disponibilité des chambres par date | 8003 | `disponibilites` |
| tarifs-service | Prix, saisons, promotions | 8004 | `tarifs` |
| pgadmin | Interface web d'administration de la BDD | 5050 | Tous |
| frontend | Interface React (client + admin) | 3000 | - |

Détails : [`docs/architecture.md`](docs/architecture.md), [`docs/conventions.md`](docs/conventions.md), [`docs/DB.md`](docs/DB.md), [`docs/database.md`](docs/database.md).

## Technologies
- **Backend** : au choix de chaque membre (Laravel, Spring Boot, ...), tant que les conventions de `docs/conventions.md` sont respectées.
- **Frontend** : React + Vite
- **Base de données** : PostgreSQL 16 (une base `hotel_db`, un schéma par service)
- **Conteneurs** : Docker + Docker Compose

## Structure du repository

```
hotelhub/
├── README.md / GUIDE.md / .env.example / .gitignore
├── .github/            (CODEOWNERS, modèle de Pull Request)
├── services/           (un dossier par microservice)
├── frontend/           (application React)
├── infra/
│   ├── compose/        (docker-compose.yml)
│   └── postgres/init/  (création des schémas et utilisateurs)
└── docs/               (architecture, conventions, base de données, contrats d'API, diagrammes)
```

## Lancement rapide

Prérequis : Git, Docker Desktop (ou Docker Engine + Compose v2).

```bash
git clone -b dev https://github.com/nassimatk/Gestion_d-Hotels.git
cd hotelhub
cp .env.example .env          # puis adapter les mots de passe
docker compose --env-file .env -f infra/compose/docker-compose.yml up --build
```

Vérification :
- Frontend : http://localhost:3000
- pgAdmin : http://localhost:5050 (préconfiguré, voir [`docs/DB.md`](docs/DB.md))
- Santé des services : http://localhost:8001/api/health (idem 8002, 8003, 8004, 8005)

Arrêter : `docker compose --env-file .env -f infra/compose/docker-compose.yml down`
Repartir de zéro (efface les bases) : ajouter `-v` à la commande `down`.

> Les scripts d'initialisation PostgreSQL ne s'exécutent qu'à la création du volume. Si vous les modifiez, faites un `down -v`.

## Collaboration
Lisez **obligatoirement** [`GUIDE.md`](GUIDE.md) avant d'écrire du code.
