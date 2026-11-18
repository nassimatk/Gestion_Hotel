# 📑 Fiche Technique d'Intégration — Chambres Service (`chambres-service`)
**Projet HotelHub — Référence officielle pour l'intégration interservices**  
*Conforme au Cahier des charges (Atelier 02) et aux Diagrammes UML officiels*

---

## 🧭 Vue d'ensemble du service

* **Rôle** : Référence unique et source de vérité du parc des chambres de l'hôtel (catalogue, caractéristiques, capacités, tarifs de base et statuts).
* **Stack technique recommandée** : PHP 8.2 / Laravel 12 (avec support natif du *Soft Delete*).
* **Port conteneur (interne Docker)** : `8000`
* **Port hôte (exposé à l'extérieur / frontend)** : `8001`
* **URL interne interservices (Docker)** : `http://chambres-service:8000/api`
* **URL publique (Frontend)** : `http://localhost:8001/api`
* **Base de données** : Schéma PostgreSQL dédié `chambres` dans la base `hotel_db` (utilisateur `chambres_user`).

---

## 1️⃣ Données dont le Chambres Service a besoin provenant des autres microservices

> [!NOTE]
> **Conclusion architecturale : Le Chambres Service n'a besoin d'AUCUNE donnée provenant des autres microservices.**

### Justification basée sur le Cahier des charges & l'Architecture :
1. **Source de Vérité Indépendante (Règle de gestion 4.2 du Cahier des charges)** :
   Le cahier des charges stipule textuellement :
   > *« Chambres Service est la référence unique des chambres de l'hôtel : les autres services s'appuient sur lui pour savoir si une chambre existe. »*  
   > *« Chambres Service ne dépend d'aucun autre service et ne lit ni n'écrit dans les données des autres. »*
2. **Sens unidirectionnel des dépendances** :
   Dans l'architecture microservices de HotelHub, les flux de dépendance convergent **vers** `chambres-service` :
   ```
   avis-service            ──┐
   disponibilites-service  ──┼──► chambres-service (Source primaire)
   tarifs-service          ──┘
   auth-service            ────── (Indépendant)
   ```
   `chambres-service` ne fait aucun appel sortant HTTP vers un autre service.
3. **Gestion locale de la sécurité** :
   Pour les opérations d'administration (ajout, modification, suppression), `chambres-service` ne requête même pas `auth-service` : il valide le jeton JWT **localement** grâce à la variable d'environnement partagée `JWT_SECRET`.
4. **Autonomie des données** :
   Toutes les caractéristiques d'une chambre (nom, étage, description, surface, lits, prix de base, devise, statut) sont stockées dans son propre schéma PostgreSQL `chambres`.

---

## 2️⃣ Endpoints exposés par le Chambres Service pour les autres microservices & le système

Conformément aux diagrammes de cas d'utilisation, diagrammes de séquence (cas nominal & cas d'erreur) et au cahier des charges, voici les **6 endpoints exposés** :

---

### 🔹 Endpoint 1 : Liste de toutes les chambres actives (Consommation publique & Interservices)
* **Méthode & URL** : `GET /api/chambres`
* **URL Docker interne** : `http://chambres-service:8000/api/chambres`
* **Rôle & Consommation** :
  - **Pour le Frontend** : Affiche le catalogue des suites et chambres aux visiteurs et clients.
  - **Pour `disponibilites-service`** : Récupère la liste complète des chambres actives pour en déduire les chambres disponibles après déduction des chambres occupées sur une période (Règle 4.4.2).
* **Filtres / Règle métier** :
  - Exclut strictement les chambres supprimées (`WHERE deleted_at IS NULL`).
* **Paramètres / Request Body** : Aucun.
* **Authentification** : Aucune (Consultation publique ouverte).
* **Codes HTTP & Format de réponse** :
  * **`200 OK`** :
    ```json
    [
      {
        "id": 1,
        "numero_etage": 2,
        "nom": "Suite Deluxe Atlas",
        "description": "Vue imprenable sur les montagnes avec terrasse privée.",
        "capacite_max": 2,
        "nombre_lits": 1,
        "type_lits": "King Size",
        "surface": 45.00,
        "prix_nuit": 1400.00,
        "devise": "MAD",
        "statut": "active",
        "created_at": "2026-10-25T12:00:00Z",
        "updated_at": "2026-10-25T12:00:00Z"
      }
    ]
    ```

---

### 🔹 Endpoint 2 : Détail d'une chambre / Vérification d'existence (Appels Interservices Essentiels)
* **Méthode & URL** : `GET /api/chambres/{id}`
* **URL Docker interne** : `http://chambres-service:8000/api/chambres/{id}`
* **Rôle & Consommation Interservices** :
  - **Pour `avis-service`** : Vérifie qu'une chambre existe (`deleted_at IS NULL`) avant d'autoriser la publication d'un avis client (Règle 4.3).
  - **Pour `disponibilites-service`** : Vérifie l'existence de la chambre avant d'enregistrer une réservation. Si la chambre n'existe pas, renvoie `404` ; si `chambres-service` est injoignable, `disponibilites-service` répond `503` (Règles 4.4.2 & NFR).
  - **Pour `tarifs-service`** : Vérifie l'existence de la chambre pour lui appliquer des règles de saisonnalité ou récupérer son prix de base (Règle 4.5).
  - **Pour le Frontend** : Affiche la fiche détaillée de la chambre sélectionnée par le client.
* **Paramètres** :
  * `id` *(dans le path, integer, obligatoire)* : Identifiant unique de la chambre.
* **Request Body** : Aucun.
* **Authentification** : Aucune (Consultation publique ouverte).
* **Codes HTTP & Format de réponse** :
  * **`200 OK`** : Chambre trouvée et active.
    ```json
    {
      "id": 1,
      "numero_etage": 2,
      "nom": "Suite Deluxe Atlas",
      "description": "Vue imprenable sur les montagnes avec terrasse privée.",
      "capacite_max": 2,
      "nombre_lits": 1,
      "type_lits": "King Size",
      "surface": 45.00,
      "prix_nuit": 1400.00,
      "devise": "MAD",
      "statut": "active",
      "created_at": "2026-10-25T12:00:00Z",
      "updated_at": "2026-10-25T12:00:00Z"
    }
    ```
  * **`404 Not Found`** (Chambre inexistante ou supprimée via soft-delete) :
    ```json
    {
      "error": "Chambre introuvable",
      "code": 404
    }
    ```

---

### 🔹 Endpoint 3 : Ajout d'une nouvelle chambre (Dashboard Admin)
* **Méthode & URL** : `POST /api/chambres`
* **URL Docker interne** : `http://chambres-service:8000/api/chambres`
* **Rôle** : Permet à l'administrateur de l'hôtel de créer une nouvelle chambre dans le catalogue.
* **En-têtes HTTP obligatoires** :
  * `Authorization: Bearer <token_jwt>`
  * `Content-Type: application/json`
* **Règles d'autorisation** :
  * Token JWT valide obligatoire (signé avec `JWT_SECRET`).
  * Rôle obligatoire : `payload.role === "admin"`.
* **Request Body (JSON)** :
  ```json
  {
    "numero_etage": 3,
    "nom": "Suite Royale Palmeraie",
    "description": "Grand salon, jacuzzi privatif et service majordome.",
    "capacite_max": 4,
    "nombre_lits": 2,
    "type_lits": "King Size",
    "surface": 85.50,
    "prix_nuit": 3200.00,
    "devise": "MAD",
    "statut": "active"
  }
  ```
  *(Note : si `devise` et `statut` sont omis, les valeurs par défaut sont appliquées : `devise="MAD"`, `statut="active"`).*
* **Règles de validation (Diagramme de classe & Séquence)** :
  * `numero_etage` : integer, obligatoire.
  * `nom` : string, max 100 caractères, obligatoire.
  * `capacite_max` : integer, strictement > 0.
  * `nombre_lits` : integer, strictement > 0.
  * `type_lits` : string, max 50 caractères, obligatoire.
  * `surface` : numeric, strictement > 0.
  * `prix_nuit` : numeric, >= 0.
* **Codes HTTP & Format de réponse** :
  * **`201 Created`** : Chambre créée.
    ```json
    {
      "id": 2,
      "numero_etage": 3,
      "nom": "Suite Royale Palmeraie",
      "description": "Grand salon, jacuzzi privatif et service majordome.",
      "capacite_max": 4,
      "nombre_lits": 2,
      "type_lits": "King Size",
      "surface": 85.50,
      "prix_nuit": 3200.00,
      "devise": "MAD",
      "statut": "active",
      "created_at": "2026-10-31T17:00:00Z",
      "updated_at": "2026-10-31T17:00:00Z"
    }
    ```
  * **`401 Unauthorized`** : Token absent ou token invalide/expiré (`{"error": "Token manquant", "code": 401}`).
  * **`403 Forbidden`** : Utilisateur authentifié mais rôle non-admin (`{"error": "Accès interdit", "code": 403}`).
  * **`422 Unprocessable Content`** : Validation échouée (surface ≤ 0, prix < 0, champ manquant) (`{"error": "Données invalides", "code": 422}`).

---

### 🔹 Endpoint 4 : Modification d'une chambre (Dashboard Admin)
* **Méthode & URL** : `PUT /api/chambres/{id}`
* **URL Docker interne** : `http://chambres-service:8000/api/chambres/{id}`
* **Rôle** : Met à jour les informations d'une chambre existante.
* **En-têtes HTTP obligatoires** :
  * `Authorization: Bearer <token_jwt>`
  * `Content-Type: application/json`
* **Règles d'autorisation** : Rôle `admin` exigé.
* **Paramètres** : `id` (dans le path, integer).
* **Request Body** : Champs à mettre à jour (mêmes règles de validation que pour la création).
* **Codes HTTP & Format de réponse** :
  * **`200 OK`** : Chambre mise à jour avec succès.
  * **`401 Unauthorized`** / **`403 Forbidden`** : Erreur d'authentification ou droits insuffisants.
  * **`404 Not Found`** : Chambre introuvable ou déjà supprimée (`{"error": "Chambre introuvable", "code": 404}`).
  * **`422 Unprocessable Content`** : Données invalides.

---

### 🔹 Endpoint 5 : Suppression d'une chambre (Soft Delete / Suppression Logique)
* **Méthode & URL** : `DELETE /api/chambres/{id}`
* **URL Docker interne** : `http://chambres-service:8000/api/chambres/{id}`
* **Rôle & Règle métier critique** :
  - **Soft Delete** : La chambre n'est **JAMAIS** supprimée physiquement de la base (`DELETE FROM chambres`).
  - Le système applique une mise à jour d'horodatage :  
    `UPDATE chambres SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL;`
  - **Objectif** : Conserver l'intégrité de l'historique des réservations passées (`disponibilites-service`) et des avis déjà publiés (`avis-service`).
* **En-têtes HTTP obligatoires** :
  * `Authorization: Bearer <token_jwt>`
* **Règles d'autorisation** : Rôle `admin` exigé.
* **Codes HTTP & Format de réponse** :
  * **`204 No Content`** : Suppression logique effectuée avec succès (aucun corps de réponse).
  * **`401 Unauthorized`** : Token manquant ou expiré.
  * **`403 Forbidden`** : Rôle non-admin.
  * **`404 Not Found`** : Chambre inexistante ou déjà supprimée (`{"error": "Chambre introuvable", "code": 404}`).

---

### 🔹 Endpoint 6 : Contrôle de santé (*Healthcheck*)
* **Méthode & URL** : `GET /api/health`
* **URL Docker interne** : `http://chambres-service:8000/api/health`
* **Rôle** : Vérifie l'état de fonctionnement du conteneur et de sa connexion à la base PostgreSQL.
* **Codes HTTP & Réponse** :
  * **`200 OK`** : `{"status": "ok"}`

---

## 3️⃣ Matrice d'Interaction Interservices avec Chambres Service

| Microservice Appelant | Méthode & Endpoint consommé | Rôle métier dans l'écosystème HotelHub |
|:---|:---|:---|
| **`disponibilites-service`** | `GET /api/chambres/{id}` | Vérifier que la chambre existe avant de créer une réservation (`404` si introuvable, `503` si service hors ligne). |
| **`disponibilites-service`** | `GET /api/chambres` | Récupérer le catalogue de toutes les chambres pour en soustraire les chambres occupées et afficher les chambres libres. |
| **`avis-service`** | `GET /api/chambres/{id}` | Valider l'association d'un avis à une chambre réelle avant son enregistrement. |
| **`tarifs-service`** | `GET /api/chambres/{id}` | Récupérer les informations de la chambre (prix de base, type) pour calculer le montant total d'un séjour selon la saison. |
| **`frontend` (Client)** | `GET /api/chambres` & `GET /api/chambres/{id}` | Afficher la page d'accueil, le catalogue des suites et les détails. |
| **`frontend` (Admin)** | `POST`, `PUT`, `DELETE /api/chambres` | Gérer le parc hôtelier depuis le Dashboard Admin avec le Bearer Token. |
