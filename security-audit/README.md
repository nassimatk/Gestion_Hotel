# Rapport d'Audit de Sécurité des Dépendances — Snyk (HotelHub)

Ce dossier contient l'outillage et les rapports d'analyse de sécurité des dépendances logicielles (SCA) réalisés avec **Snyk CLI** sur l'ensemble de la plateforme microservices **HotelHub**.

---

## 1. Tableau de Bord en Ligne (Snyk Cloud)

👉 **Lien direct de tableau de bord en ligne Snyk global :** [https://app.snyk.io/org/ntaikouk/projects](https://app.snyk.io/org/ntaikouk/projects)

### Liens directs par service sur Snyk Cloud :
- **Frontend (React)** : [Projet Snyk Frontend](https://app.snyk.io/org/ntaikouk/project/dba89ca0-fb3e-4155-820c-96382c30140d)
- **Auth Service (Laravel)** : [Projet Snyk Auth Service](https://app.snyk.io/org/ntaikouk/project/6bcf5a02-d369-4ec7-9dab-2f4ccdb8f6a3)
- **Chambres Service (Laravel)** : [Projet Snyk Chambres Service](https://app.snyk.io/org/ntaikouk/project/8d536c26-7b29-4295-8b6b-a7a89c7c6fc0)
- **Avis Service (Laravel)** : [Projet Snyk Avis Service](https://app.snyk.io/org/ntaikouk/project/48c837f4-2a4f-41a0-aac0-5fd8a275b823)
- **Tarifs Service (Laravel)** : [Projet Snyk Tarifs Service](https://app.snyk.io/org/ntaikouk/project/0bf7c518-8968-4ff0-a0f4-4416f7cd0e63)
- **Disponibilités Service (Spring Boot)** : [Projet Snyk Disponibilités](https://app.snyk.io/org/ntaikouk/project/cd9374cc-9237-44d1-9b46-1fd0f19f0e31)

---

## 2. Synthèse Globale des Vulnérabilités

| Composant | Technologie | Fichier Scanné | Total Failles | Critique | Élevée (High) | Moyenne (Med) | Faible (Low) | Statut |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auth Service** | PHP / Laravel | `composer.lock` | **0** | 0 | 0 | 0 | 0 | Conforme |
| **Avis Service** | PHP / Laravel | `composer.lock` | **0** | 0 | 0 | 0 | 0 | Conforme |
| **Tarifs Service** | PHP / Laravel | `composer.lock` | **0** | 0 | 0 | 0 | 0 | Conforme |
| **Chambres Service**| PHP / Laravel | `composer.lock` | **1** | 0 | 0 | 1 | 0 | Action recommandée |
| **Frontend** | React / Node.js | `package.json` | **3** | 0 | 2 | 1 | 0 | Action recommandée |
| **Disponibilités** | Java / Spring Boot | `pom.xml` | **51** | 9 | 15 | 25 | 2 | Action recommandée |

---

## 3. Détail des Vulnérabilités Identifiées

### A. Services PHP / Laravel

- **Auth Service, Avis Service, Tarifs Service** :
  - **Résultat : 0 vulnérabilité détectée.**
  - Les dépendances de ces 3 microservices sont à jour et ne présentent aucune faille connue.

- **Chambres Service (1 vulnérabilité moyenne)** :
  - **Package vulnérable :** `firebase/php-jwt@6.11.1`
  - **Type de vulnérabilité :** *Inadequate Encryption Strength* (Sévérité : **Medium**)

---

### B. Frontend React (3 vulnérabilités)

1. **`follow-redirects` (Sévérité : Élevée - High)**
   - *Intitulé :* Insertion of Sensitive Information Into Sent Data
   - *Origine :* Dépendance transitive via `axios`
2. **`react-router` (Sévérité : Élevée - High)**
   - *Intitulé :* Open Redirect
3. **`react-router` (Sévérité : Moyenne - Medium)**
   - *Intitulé :* Use of Externally-Controlled Input to Select Classes or Code ('Unsafe Reflection')

---

### C. Service Disponibilités — Java / Spring Boot (51 vulnérabilités transitives)

- Les 51 vulnérabilités détectées proviennent des dépendances embarquées transitives :
  - `org.apache.tomcat.embed:tomcat-embed-core` (20 failles)
  - `tools.jackson.core:jackson-databind` (6 failles)
  - `org.apache.tomcat.embed:tomcat-embed-websocket` (5 failles)
  - `org.springframework:spring-web` (4 failles)
  - Autres sous-packages de logback et postgresql.

---

## 4. Re-lancement Rapide de l'Audit

### Audit Local (Rapports HTML & JSON)
- **Script Batch :** `security-audit\run-snyk-audit.bat`
- **Script PowerShell :** `.\security-audit\run-snyk-audit.ps1`

### Synchronisation vers le Dashboard Snyk Cloud
- **Script PowerShell :** `.\security-audit\push-to-snyk-dashboard.ps1`

---

## 5. Rapports HTML Locaux Générés

- [Frontend (React)](./reports/snyk-frontend.html)
- [Auth Service](./reports/snyk-auth.html)
- [Chambres Service](./reports/snyk-chambres.html)
- [Avis Service](./reports/snyk-avis.html)
- [Tarifs Service](./reports/snyk-tarifs.html)
- [Disponibilités Service](./reports/snyk-disponibilites.html)
