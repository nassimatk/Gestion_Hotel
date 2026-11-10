# 📑 Fiche Technique d'Intégration — Auth Service (`auth-service`)
**Projet HotelHub — Référence officielle pour l'intégration interservices**  
*Document de spécification technique et contrat d'API*

---

## 🧭 Vue d'ensemble du service

* **Rôle** : Fournisseur d'identité centralisé (*Identity Provider / IdP*), gestion des utilisateurs et émission des jetons sécurisés **JWT (HS256)**.
* **Stack technique** : PHP 8.2 / Laravel 12.
* **Port conteneur (interne Docker)** : `8000`
* **Port hôte (exposé à l'extérieur / frontend)** : `8005`
* **URL interne interservices (Docker)** : `http://auth-service:8000/api`
* **URL publique (Frontend)** : `http://localhost:8005/api`
* **Base de données** : Schéma PostgreSQL `auth` dans la base `hotel_db` (utilisateur `auth_user`).

---

## 1️⃣ Données dont l'Auth Service a besoin provenant des autres microservices

> [!NOTE]
> **Conclusion architecturale : L'Auth Service n'a besoin d'AUCUNE donnée provenant des autres microservices.**

### Justification technique et architecturale :
1. **Source primaire d'identité (Single Source of Truth)** :
   L'Auth Service est le point d'entrée de la sécurité de tout le système. Il gère uniquement les identités (`users`), les rôles (`roles`), les permissions (`permissions`) et l'authentification (mots de passe hachés en **bcrypt**).
2. **Principe de découplage fort & absence de dépendances circulaires** :
   Dans la matrice des dépendances du projet (`docs/architecture.md`) :
   ```
   avis-service            ──┐
   disponibilites-service  ──┼──► chambres-service
   tarifs-service          ──┘
   auth-service            ────► (Aucune dépendance externe)
   ```
   Si l'Auth Service devait appeler un autre service pour authentifier un utilisateur, cela introduirait une dépendance circulaire ou un couplage fort qui compromettrait la résilience de tout le système (ex. : si le service des avis ou des chambres est indisponible, les utilisateurs ne pourraient plus se connecter).
3. **Autonomie complète** :
   Toutes les données requises pour exécuter les règles de l'Auth Service (création de compte, vérification d'email unique, validation de mot de passe, émission du JWT) résident exclusivement dans son schéma relationnel PostgreSQL privé (`auth`).

---

## 2️⃣ Endpoints exposés par l'Auth Service pour les autres microservices & le système

Tous les endpoints ci-dessous sont **réellement implémentés**, testés avec 14 tests automatisés (40 assertions) et conformes au contrat OpenAPI `docs/api-contracts/auth-service.yaml`.

---

### 🔹 Endpoint 1 : Consultation d'un utilisateur par ID (Appels interservices directs)
* **Méthode & URL** : `GET /api/users/{id}`
* **URL Docker interne** : `http://auth-service:8000/api/users/{id}`
* **Rôle & Fonctionnement** :
  Permet à un autre microservice (notamment `avis-service`) de vérifier l'existence réelle d'un utilisateur et de récupérer ses informations d'identité (nom, email, rôle) à partir de son identifiant numérique (`user_id`).
* **Paramètres** :
  * `id` *(dans le chemin / path, integer, obligatoire)* : l'identifiant unique de l'utilisateur à vérifier.
* **Request Body** : Aucun (requête HTTP GET).
* **Règles d'authentification / autorisation** :
  * **Public / Accès réseau interne** : Cet endpoint ne requiert pas de token JWT afin de permettre des vérifications synchrones légères et directes de conteneur à conteneur via le réseau privé Docker `hotelhub`.
* **Codes HTTP & Formats de réponses** :
  * **`200 OK`** : L'utilisateur existe.
    ```json
    {
      "id": 5,
      "name": "Sara Alami",
      "email": "sara@example.com",
      "role": "client"
    }
    ```
  * **`404 Not Found`** : L'utilisateur n'existe pas en base.
    ```json
    {
      "error": "Utilisateur introuvable",
      "code": 404
    }
    ```

---

### 🔹 Endpoint 2 : Contrôle de santé (*Healthcheck*)
* **Méthode & URL** : `GET /api/health`
* **URL Docker interne** : `http://auth-service:8000/api/health`
* **Rôle & Fonctionnement** :
  Permet à Docker, aux passerelles ou aux autres services de vérifier si `auth-service` est démarré et apte à traiter des requêtes HTTP.
* **Paramètres** : Aucun.
* **Request Body** : Aucun.
* **Règles d'authentification / autorisation** : Public (aucun token).
* **Codes HTTP & Formats de réponses** :
  * **`200 OK`** : Service opérationnel.
    ```json
    {
      "status": "ok"
    }
    ```

---

### 🔹 Endpoint 3 : Profil de l'utilisateur connecté via JWT
* **Méthode & URL** : `GET /api/me`
* **URL Docker interne** : `http://auth-service:8000/api/me`
* **Rôle & Fonctionnement** :
  Renvoie l'identité et le rôle de l'utilisateur associé au token JWT fourni en en-tête. Utilisé principalement par le Frontend et peut être utilisé par un service tiers pour valider une session.
* **Paramètres** : Aucun.
* **En-têtes HTTP requis** :
  * `Authorization: Bearer <token_jwt>`
* **Request Body** : Aucun.
* **Règles d'authentification / autorisation** :
  * **Protégé par Middleware JWT** : Le token doit être valide, non altéré et non expiré.
* **Codes HTTP & Formats de réponses** :
  * **`200 OK`** : Token valide, profil renvoyé.
    ```json
    {
      "id": 1,
      "name": "Administrateur HotelHub",
      "email": "admin@hotelhub.com",
      "role": "admin"
    }
    ```
  * **`401 Unauthorized`** (Token manquant) :
    ```json
    {
      "error": "Token manquant",
      "code": 401
    }
    ```
  * **`401 Unauthorized`** (Token faux ou expiré) :
    ```json
    {
      "error": "Token invalide ou expiré",
      "code": 401
    }
    ```

---

### 🔹 Endpoint 4 : Authentification & Émission du JWT (*Login*)
* **Méthode & URL** : `POST /api/login`
* **URL Docker interne** : `http://auth-service:8000/api/login`
* **Rôle & Fonctionnement** :
  Vérifie les identifiants d'un utilisateur et émet un jeton d'accès JWT signé en **HS256** valide pendant 3600 secondes (1 heure).
* **En-têtes HTTP requis** :
  * `Content-Type: application/json`
* **Request Body (JSON obligatoire)** :
  ```json
  {
    "email": "admin@hotelhub.com",
    "password": "admin_secret"
  }
  ```
* **Règles de validation** :
  * `email` : requis, chaîne de caractères.
  * `password` : requis, chaîne de caractères.
* **Codes HTTP & Formats de réponses** :
  * **`200 OK`** : Identifiants corrects, token généré.
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJob3RlbGh1Yi1hdXRoLXNlcnZpY2UiLCJzdWIiOjEsIm5hbWUiOiJBZG1pbmlzdHJhdGV1ciBIb3RlbEh1YiIsImVtYWlsIjoiYWRtaW5AaG90ZWxodWIuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkzNDQxMjAwLCJleHAiOjE3OTM0NDQ4MDB9...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
    ```
  * **`401 Unauthorized`** : Email introuvable ou mot de passe incorrect (message générique de sécurité pour éviter l'énumération de comptes).
    ```json
    {
      "error": "Identifiants invalides",
      "code": 401
    }
    ```
  * **`422 Unprocessable Content`** : Champ manquant dans la requête.
    ```json
    {
      "error": "Données invalides",
      "code": 422
    }
    ```

---

### 🔹 Endpoint 5 : Inscription d'un nouveau client (*Register*)
* **Méthode & URL** : `POST /api/register`
* **URL Docker interne** : `http://auth-service:8000/api/register`
* **Rôle & Fonctionnement** :
  Enregistre un nouvel utilisateur dans la base de données et lui attribue automatiquement le rôle `client`.
* **En-têtes HTTP requis** :
  * `Content-Type: application/json`
* **Request Body (JSON obligatoire)** :
  ```json
  {
    "name": "Éléonore de Montmirail",
    "email": "eleonore@prestige.com",
    "password": "password123"
  }
  ```
* **Règles de validation** :
  * `name` : requis, max 100 caractères.
  * `email` : requis, format email valide, max 255 caractères, doit être unique en base.
  * `password` : requis, minimum 8 caractères.
* **Codes HTTP & Formats de réponses** :
  * **`201 Created`** : Compte créé avec succès.
    ```json
    {
      "id": 2,
      "name": "Éléonore de Montmirail",
      "email": "eleonore@prestige.com",
      "role": "client"
    }
    ```
  * **`422 Unprocessable Content`** (Email déjà existant) :
    ```json
    {
      "error": "Email déjà utilisé",
      "code": 422
    }
    ```
  * **`422 Unprocessable Content`** (Validation échouée : mot de passe < 8 car., format email invalide) :
    ```json
    {
      "error": "Données invalides",
      "code": 422,
      "details": {
        "password": ["The password field must be at least 8 characters."]
      }
    }
    ```

---

## 3️⃣ Règle d'or de l'intégration : Le mécanisme de validation locale du JWT

Pour éviter d'appeler l'Auth Service à chaque requête HTTP, les autres microservices (`chambres-service`, `disponibilites-service`, `avis-service`, `tarifs-service`) doivent privilégier la **validation locale du token**.

```
Navigateur (Frontend)
       │
       │ En-tête : Authorization: Bearer <token>
       ▼
Microservice Consommateur (ex: avis-service :8002)
       │
       ├──► 1. Lit JWT_SECRET dans ses variables d'environnement
       ├──► 2. Valide la signature mathématique HS256 localement
       ├──► 3. Lit les informations dans le payload du token :
       │       - payload.sub   ==> ID de l'utilisateur (user_id)
       │       - payload.name  ==> Nom complet de l'utilisateur
       │       - payload.role  ==> 'client' ou 'admin'
       └──► 4. Traite la requête directement SANS APPELER auth-service !
```

### Contenu exact du Payload JWT émis par `auth-service` :
```json
{
  "iss": "hotelhub-auth-service",
  "sub": 5,
  "name": "Sara Alami",
  "email": "sara@example.com",
  "role": "client",
  "iat": 1793441200,
  "exp": 1793444800
}
```

### Configuration requise dans les autres microservices :
* Variable d'environnement (identique dans toute la stack Docker) :
  ```env
  JWT_SECRET=hotelhub_super_secret_jwt_key_2026_dev_secure
  ```
* Règle d'autorisation :
  * Si `payload.role !== "admin"` sur une route d'administration ➔ retourner **`403 Forbidden`** (`{"error": "Accès interdit", "code": 403}`).
  * Si token absent, expiré ou signature invalide ➔ retourner **`401 Unauthorized`** (`{"error": "Token invalide ou expiré", "code": 401}`).
