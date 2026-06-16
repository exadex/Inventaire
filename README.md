# Inventaire
# ExAdEx Inventaire MVP

Première version fonctionnelle d'une application web d'inventaire pour laboratoire biomédical.

## Inclus

- Authentification simulée par nom utilisateur
- Dashboard avec métriques de stock
- Inventaire réactifs, consommables, anticorps, primers, composés et kits
- Recherche rapide, filtres par statut et catégorie
- Ajout, modification et suppression d'items
- Protocoles optionnels et mise a jour de stock par item
- Section `Experiences` avec templates de protocoles, copie editable, calcul conditions x replicats et controle du stock
- Alertes de stock critique
- Localisations par freezer, pièce, étagère et boîte
- Historique simple des modifications
- Liste `A commander` avec priorités critique, muy urgente, urgente et no urgente
- Vue échantillons biologiques avec patient ID anonymisé, dépôt, date, condition et type d'analyse
- Interface responsive inspirée biotech / longevity

## Structure cible pour l'évolution

```txt
app/
  frontend/        Next.js + Tailwind + composants UI
  backend/         API REST ou tRPC
  database/        SQLite pour MVP, PostgreSQL en production
  docker/          Dockerfile + compose
```

Structure déjà présente dans ce MVP:

```txt
index.html          Interface applicative ExAdEx Inventaire
design.css          Design system et responsive
script.js           Données mockées, filtres, CRUD, historique
database/schema.sql Schéma SQL cible SQLite/PostgreSQL
Dockerfile          Image statique nginx
docker-compose.yml  Lancement conteneur local
```

## Modèle de données recommandé

- `users`: id, name, role, created_at
- `inventory_items`: id, name, category_id, quantity, unit, min_stock, location_id, protocol, notes
- `categories`: id, name, color
- `tags`: id, name
- `item_tags`: item_id, tag_id
- `samples`: id, anonymized_patient_id, depot, collected_at, experimental_condition, analysis_type, location_id
- `locations`: id, room, freezer, shelf, box, position
- `audit_logs`: id, user_id, entity_type, entity_id, action, payload, created_at
- `purchase_requests`: id, item_name, quantity, priority, supplier, notes, requested_by, created_at, ordered_at
- `stock_updates`: id, item_id, title, direction, amount, unit, previous_quantity, new_quantity, notes, updated_by, created_at
- `protocol_templates`: id, name, protocol, notes, created_by, created_at, updated_at
- `protocol_items`: id, template_id, item_id, item_name, per_condition_quantity, unit, notes
- `experiments`: id, template_id, template_name, name, conditions, replicates, status, notes, created_by, created_at, updated_at, consumed_at
- `experiment_items`: id, experiment_id, source_protocol_item_id, item_id, item_name, quantity, unit, notes

## Lancement

Ouvrir `index.html` dans le navigateur. Les donnees partagees sont chargees depuis `shared_data.json` quand GitHub est configure; sinon le cache local permet de continuer a tester en local.

Avec Docker:

```bash
docker compose up --build
```

Puis ouvrir `http://localhost:8080`.

## Persistance partagee GitHub

Les donnees modifiables ne sont plus traitees comme des donnees locales au navigateur:

- `seed_items.js`: inventaire initial/default, utilise uniquement pour initialiser `shared_data.json` quand celui-ci est vide.
- `protocols.js`: templates de protocoles en lecture seule, toujours versionnes dans le depot.
- `shared_data.json`: source de verite partagee pour `inventoryItems`, `experiments`, `orders` et `history`.
- `localStorage`: cache local et migration des anciennes donnees MVP uniquement.

Le navigateur lit et ecrit `shared_data.json` avec l'API GitHub Contents via `github_storage.js`.

Configuration runtime:

```js
localStorage.setItem("exadex_github_storage_config", JSON.stringify({
  owner: "ORGANISATION_OU_USER",
  repo: "NOM_DU_REPO",
  branch: "main",
  path: "shared_data.json"
}));

localStorage.setItem("exadex_github_token", "GITHUB_FINE_GRAINED_TOKEN");
```

Le token doit avoir le droit Contents read/write sur ce depot. Sans token, l'application peut lire les donnees publiques configurees mais ne peut pas sauvegarder les modifications. Pour une mise en production robuste, preferer un petit backend/proxy afin de ne pas exposer de token GitHub dans le navigateur.

Migration:

Au premier chargement, si `shared_data.json` est vide, l'application initialise l'inventaire depuis `seed_items.js` et tente aussi de reprendre les anciennes cles `localStorage` (`exadex_web_items`, `exadex_seed_overrides`, `exadex_deleted_seed_ids`, `exadex_orders`, `exadex_experiments`, `exadex_history`). Apres sauvegarde GitHub, `shared_data.json` devient la source commune pour tous les utilisateurs.
