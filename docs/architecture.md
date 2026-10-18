# Architecture globale de HotelHub

## Principes
- **Microservices indépendants** : un dossier, un Dockerfile, des migrations et un schéma PostgreSQL par service.
- **Communication REST** : HTTP + JSON uniquement, quel que soit le langage du service.
- **Données privées** : chaque service est seul propriétaire de son schéma.
- **Authentification JWT** : émise par `auth-service`, validée localement par chaque service ; routes d'écriture et dashboard admin réservés au rôle `admin`.
- **Frontend unique** : une application React qui appelle directement chaque service (pas de passerelle API à ce stade).

## Services

### auth-service (port 8005)
Identifie les utilisateurs (`register`, `login`, `me`) et **émet le token JWT** (HS256) contenant `sub` et `role` (`client` ou `admin`). Il ne fait rien d'autre. Les autres services valident le token **localement** avec le même `JWT_SECRET`, sans l'appeler.

### chambres-service (port 8001)
Source de vérité des chambres : numéro, type, capacité, équipements, description, statut. Les autres services référencent une chambre par son `chambre_id`.

### avis-service (port 8002)
Avis et notes des clients : création, lecture, modération, moyenne par chambre. Appelle `chambres-service` pour vérifier qu'une chambre existe.

### disponibilites-service (port 8003)
Disponibilité des chambres par période : blocages, périodes occupées, recherche de chambres libres entre deux dates. Appelle `chambres-service` pour valider les `chambre_id`.

### tarifs-service (port 8004)
Prix de base par type de chambre, tarifs saisonniers, promotions, calcul du prix d'un séjour. Appelle `chambres-service` pour connaître le type d'une chambre.

### frontend (port 3000)
Interface React : `pages/client/` (consultation, recherche, avis) et `pages/admin/` (dashboard de gestion).

## Dépendances entre services

```
avis ──────────────┐
disponibilités ────┼──► chambres-service
tarifs ────────────┘
```
`chambres-service` ne dépend d'aucun autre service. Pas d'appels circulaires.

## Schéma global

```
        Frontend React (:3000)
               │ REST / JSON + JWT
   ┌────────┬──┴────────┬──────────────┬──────────┐
   ▼        ▼           ▼              ▼          ▼
  Auth   Chambres      Avis       Disponibilités Tarifs
 :8005    :8001        :8002         :8003       :8004
   └────────┴────────┬───┴──────────────┴──────────┘
                      ▼
          PostgreSQL (:5432) - hotel_db
  schémas : auth | chambres | avis | disponibilites | tarifs
```

## Infrastructure
- `infra/compose/docker-compose.yml` lance PostgreSQL, les 5 services et le frontend sur le réseau `hotelhub`.
- `infra/postgres/init/01-init-schemas.sql` crée les schémas et utilisateurs.
- Les Dockerfiles des services sont des placeholders (nginx répondant sur `/api/health`) à remplacer par chaque responsable.

## Décisions ouvertes
Service de réservation (non prévu pour l'instant), langue des commits, durée de validité du token.
