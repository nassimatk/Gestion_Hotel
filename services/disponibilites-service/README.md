# disponibilites-service

Microservice de gestion des disponibilités et des réservations de chambres pour **HotelHub**.

- **Port hôte** : `8003` (port conteneur : `8000`)
- **Base de données** : PostgreSQL (`hotel_db`, schéma `disponibilites`, utilisateur `disponibilites_user`)
- **Technologie** : Java 21 / Spring Boot 3 (Spring Web, Spring Data JPA, Spring Security JWT)
- **Contrat d'API** : `docs/api-contracts/disponibilites-service.yaml` (v0.3.0)

## Fonctionnalités principales

- Vérification de disponibilité d'une chambre sur une période (`GET /api/disponibilites/chambres/{id}`) avec récupération de la capacité auprès de `chambres-service` et calcul du prix total auprès de `tarifs-service` (`GET /api/tarifs/calcul`).
- Liste des chambres occupées sur une période (`GET /api/disponibilites`).
- Création de réservation (`POST /api/reservations`) avec validation des dates, du téléphone, de la capacité maximale (`nombre_personnes <= capacite`) et détection des chevauchements (`409 Conflict`).
- Consultation des réservations du client connecté (`GET /api/reservations/mes`) et vue globale administrateur (`GET /api/reservations`).
- Annulation logique (`DELETE /api/reservations/{id}` -> statut `ANNULEE`) réservée au propriétaire ou à un administrateur.

## Lancer ce service avec Docker

Depuis la racine du dépôt `Gestion_Hotel` :

```bash
docker compose --env-file .env -f infra/compose/docker-compose.yml up -d --build disponibilites-service