# 🔐 Auth Service — HotelHub

Service d'authentification et de gestion des identités du projet **HotelHub**.  
Il est responsable de l'identification des utilisateurs (`register`, `login`, `me`) et de **l'émission des tokens JWT (HS256)** permettant de sécuriser l'ensemble de l'architecture microservices.

---

## 📋 Informations générales

* **Technologie** : PHP 8.2 / Laravel 12
* **Port hôte** : `8005` (port interne conteneur : `8000`)
* **Base de données** : PostgreSQL 16
  * **Schéma dédié** : `auth` (isolé dans `hotel_db`)
  * **Utilisateur BDD** : `auth_user`
* **Sécurité** : JWT (JSON Web Token) signé en **HS256** avec `JWT_SECRET` partagé
* **Contrat OpenAPI** : [`docs/api-contracts/auth-service.yaml`](../../docs/api-contracts/auth-service.yaml)

---

## 🗄️ Modèle de données (Schéma `auth`)

Le schéma respecte le diagramme de classes UML avec 4 tables :

```
roles (id, name, description)
  ▲
  │ (1 à N)
users (id, name, email, password, role_id)
  
roles (id) ◄─── role_permission (role_id, permission_id) ───► permissions (id, name, description)
```

* **`roles`** : `client` (par défaut pour les nouveaux inscrits) et `admin`.
* **`permissions`** : permissions modulaires du système (ex. `chambres.write`, `avis.moderate`, `users.list`).
* **`role_permission`** : table pivot associant les permissions aux rôles.
* **`users`** : utilisateurs avec mot de passe haché par **bcrypt**.

> **Données initiales créées par le Seeder :**
> * Compte administrateur par défaut : `admin@hotelhub.com` / `admin_secret` (rôle : `admin`).

---

## 🚀 Endpoints API REST développés

Tous les endpoints sont préfixés par `/api` et communiquent exclusivement en `application/json` avec format d'erreur uniforme `{"error": "message", "code": HTTP_CODE}`.

### 1. Contrôle de santé
* **`GET /api/health`**
  * **Description** : Vérifie la disponibilité du service.
  * **Réponse 200 OK** :
    ```json
    { "status": "ok" }
    ```

---

### 2. Inscription d'un nouveau client
* **`POST /api/register`**
  * **Description** : Crée un nouvel utilisateur et lui assigne automatiquement le rôle `client`.
  * **Corps de la requête (JSON)** :
    ```json
    {
      "name": "Éléonore de Montmirail",
      "email": "eleonore@prestige.com",
      "password": "password123"
    }
    ```
  * **Réponse 201 Created** :
    ```json
    {
      "id": 2,
      "name": "Éléonore de Montmirail",
      "email": "eleonore@prestige.com",
      "role": "client"
    }
    ```
  * **Erreurs possibles** :
    * `422 Unprocessable Content` : `{"error": "Email déjà utilisé", "code": 422}`
    * `422 Unprocessable Content` : `{"error": "Données invalides", "code": 422}` (mot de passe < 8 caractères ou champ manquant)

---

### 3. Connexion utilisateur & Émission JWT
* **`POST /api/login`**
  * **Description** : Vérifie l'email et le mot de passe puis génère un jeton JWT HS256 valide 1 heure (3600 secondes).
  * **Corps de la requête (JSON)** :
    ```json
    {
      "email": "admin@hotelhub.com",
      "password": "admin_secret"
    }
    ```
  * **Réponse 200 OK** :
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
    ```
  * **Erreurs possibles** :
    * `401 Unauthorized` : `{"error": "Identifiants invalides", "code": 401}` (même message si email inconnu ou mot de passe faux pour éviter l'énumération de comptes)
    * `422 Unprocessable Content` : `{"error": "Données invalides", "code": 422}`

---

### 4. Profil de l'utilisateur connecté
* **`GET /api/me`**
  * **Description** : Renvoie les informations de l'utilisateur authentifié via son token.
  * **En-tête HTTP obligatoire** :
    ```http
    Authorization: Bearer <votre_token_jwt>
    ```
  * **Réponse 200 OK** :
    ```json
    {
      "id": 1,
      "name": "Administrateur HotelHub",
      "email": "admin@hotelhub.com",
      "role": "admin"
    }
    ```
  * **Erreurs possibles** :
    * `401 Unauthorized` : `{"error": "Token manquant", "code": 401}`
    * `401 Unauthorized` : `{"error": "Token invalide ou expiré", "code": 401}`

---

## 🔑 Rôle du token JWT dans l'architecture Microservices

Le jeton émis par `auth-service` est **autonome (stateless)** et contient les informations essentielles :

```json
{
  "iss": "hotelhub-auth-service",
  "sub": 1,
  "name": "Administrateur HotelHub",
  "email": "admin@hotelhub.com",
  "role": "admin",
  "iat": 1792955311,
  "exp": 1792958911
}
```

> **Validation locale :**  
> Les autres microservices (`chambres-service`, `disponibilites-service`, `avis-service`, etc.) reçoivent ce token dans leurs requêtes REST et le **valident localement** en vérifiant la signature HS256 avec la même variable `JWT_SECRET`.  
> Ils n'ont pas besoin de surcharger `auth-service` par des requêtes de vérification.

---

## 🧪 Tests unitaires et fonctionnels

Une suite de **12 tests automatisés (36 assertions)** est incluse pour garantir la conformité aux diagrammes de séquence UML :

```bash
# Exécuter les tests dans le terminal
php artisan test
```

---

## 🐳 Démarrage avec Docker

Le service est automatiquement orchestré depuis la racine du projet :

```bash
# Démarrer auth-service avec sa base de données
docker compose --env-file .env -f infra/compose/docker-compose.yml up -d --build auth-service

# Voir les logs du service
docker logs -f hotelhub-auth-service-1
```
