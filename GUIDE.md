# GUIDE.md - Guide de collaboration HotelHub

À lire par tous les membres avant de commencer.

## 1. Branches

| Branche | Rôle | Qui peut y pousser |
|---|---|---|
| `main` | Versions stables et validées, prêtes à être présentées | Personne directement, uniquement via PR `dev → main` validée par la cheffe de projet |
| `dev` | Intégration de tous les services | Personne directement, uniquement via Pull Request |
| `feature/...` | Travail d'un membre | Son auteur |

Nommage des branches de travail : `<type>/<service>-<description-courte>`

```
feature/chambres-crud
feature/avis-moderation
fix/tarifs-calcul-saison
docs/api-contract-avis
```

## 2. Démarrer (une seule fois)

```bash
git clone -b dev https://github.com/nassimatk/Gestion_d-Hotels.git
cd hotelhub
cp .env.example .env
```

## 3. Workflow quotidien

```bash
# 1. Se placer sur dev et récupérer les dernières modifications
git checkout dev
git pull origin dev

# 2. Créer sa branche de travail depuis dev
git checkout -b feature/chambres-crud

# 3. Développer, puis vérifier ce qui a changé
git status
git add services/chambres-service/
git commit -m "feat(auth): add login endpoint"

# 4. Se resynchroniser avec dev AVANT de pousser
git fetch origin
git merge origin/dev

# 5. Pousser la branche
git push -u origin feature/chambres-crud     # la première fois
git push                                      # ensuite
```

### Ouvrir une Pull Request
1. Sur GitHub, ouvrir **Compare & pull request** (ou l'onglet *Pull requests* → *New*).
2. Base : **`dev`**, compare : votre branche.
3. Remplir le modèle de PR (checklist).
4. Demander une relecture. Ne fusionnez pas vous-même sans approbation.

Avec GitHub CLI : `gh pr create --base dev --title "feat(chambres): add rooms CRUD" --fill`

### Après la fusion
```bash
git checkout dev && git pull origin dev
git branch -d feature/chambres-crud
```

## 4. Messages de commit

Format : `type(scope): description`

- **type** : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`
- **scope** : `auth`, `chambres`, `avis`, `disponibilites`, `tarifs`, `frontend`, `infra`, `docs`
- **description** : en anglais ou en français (choisir une langue pour toute l'équipe, voir décisions), à l'impératif, sans point final.

Exemples :
```
feat(auth): add login endpoint
fix(tarifs): correct seasonal price calculation
docs(avis): update API contract
chore(infra): add healthcheck to postgres
```

Un commit = un changement logique. Commits petits et fréquents.

## 5. Règles à respecter

### Secrets
- **Ne jamais pousser `.env`** ni aucun mot de passe, clé ou token. Seul `.env.example` (valeurs factices) est versionné.
- Si un secret est poussé par erreur : prévenez la cheffe de projet **immédiatement** et changez-le. Le supprimer dans un commit suivant ne suffit pas, il reste dans l'historique.
- Toute nouvelle variable d'environnement est ajoutée à `.env.example`.

### Isolation des services
- Chaque service travaille **uniquement dans son dossier** `services/<nom>/`.
- Un service n'accède **jamais** au schéma d'un autre. Il passe par l'API REST de ce service.
- Pas de clé étrangère entre schémas de services différents : on stocke un identifiant (ex. `chambre_id`) et on vérifie via un appel REST.

### Migrations
- Les migrations restent **dans le dossier du service** auquel elles appartiennent.
- Il est **interdit** de modifier les migrations d'un autre service sans coordination (issue ou message à son responsable + validation en PR).
- Ne modifiez pas une migration déjà fusionnée dans `dev` : créez-en une nouvelle.

### Docker
- Chaque service possède son `Dockerfile`, écoute sur le **port 8000 dans le conteneur** et expose `GET /api/health`.
- Le fichier `infra/compose/docker-compose.yml` est partagé : ne modifiez que le **bloc de votre service**, en petits commits, et prévenez l'équipe.

### Contrats d'API
- Le contrat OpenAPI de votre service (`docs/api-contracts/<service>.yaml`) est écrit **avant ou en même temps** que le code.
- Tout changement cassant (route, champ, code retour) passe par une PR relue par les consommateurs du service.

### Documentation
- Toute PR qui change une route, une variable d'environnement, une table ou le lancement du service **met à jour la doc concernée** (contrat d'API, README du service, `docs/`).
- Le README de votre service doit permettre à quelqu'un d'autre de le lancer.

## 6. Résolution des conflits Git

```bash
git fetch origin
git merge origin/dev          # ou : git rebase origin/dev (si vous maîtrisez)
# Git signale les fichiers en conflit : les ouvrir, repérer <<<<<<< ======= >>>>>>>
# garder la bonne version, supprimer les marqueurs
git add <fichier-resolu>
git commit                    # termine le merge
```

Conseils :
- Les conflits se produisent surtout sur les fichiers partagés (`docker-compose.yml`, `.env.example`, `docs/`). Gardez les **deux** apports quand ils ne se contredisent pas.
- Si le conflit touche le travail de quelqu'un d'autre, **parlez-lui** avant de trancher.
- En cas de doute : `git merge --abort` et demandez de l'aide.
- Ne jamais faire `git push --force` sur `dev` ou `main`.

## 7. Processus de validation

### Fusion dans `dev` (PR de fonctionnalité)
Une PR est fusionnée si :
1. Elle cible `dev` et la branche est à jour avec `dev`.
2. Le projet démarre : `docker compose ... up --build` sans erreur, `GET /api/health` répond.
3. Aucun secret ni `.env` n'est inclus.
4. Migrations et fichiers sont dans le bon dossier de service.
5. La documentation et le contrat d'API sont à jour.
6. Au moins **1 approbation** (le responsable du service concerné pour les changements partagés).

### Fusion de `dev` dans `main`
Réservée à la cheffe de projet, quand :
1. Tous les services démarrent ensemble sur une machine propre (`down -v` puis `up --build`).
2. Les scénarios principaux fonctionnent de bout en bout (frontend → services).
3. La documentation est à jour.
4. L'équipe a validé la version (jalon, rendu, démonstration).

Ensuite : tag de version, par exemple `git tag v1.0.0 && git push origin v1.0.0`.

## 8. En cas de problème
- Un service ne démarre pas : `docker compose ... logs <service>`.
- Base à réinitialiser : `docker compose ... down -v` puis `up --build`.
- Un doute sur une règle : demandez à la cheffe de projet **avant** de pousser.
