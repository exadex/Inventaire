# ExAdEx Inventaire MVP

Première version fonctionnelle d'une application web d'inventaire pour laboratoire biomédical.

## Inclus

- Authentification simulée par nom utilisateur
- Dashboard avec métriques de stock
- Inventaire réactifs, consommables, anticorps, primers, composés et kits
- Recherche rapide, filtres par statut et catégorie
- Ajout, modification et suppression d'items
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
- `inventory_items`: id, name, category_id, quantity, unit, min_stock, max_stock, location_id, notes
- `categories`: id, name, color
- `tags`: id, name
- `item_tags`: item_id, tag_id
- `samples`: id, anonymized_patient_id, depot, collected_at, experimental_condition, analysis_type, location_id
- `locations`: id, room, freezer, shelf, box, position
- `audit_logs`: id, user_id, entity_type, entity_id, action, payload, created_at
- `purchase_requests`: id, item_name, quantity, priority, supplier, notes, requested_by, created_at, ordered_at

## Lancement

Ouvrir `index.html` dans le navigateur. Les données sont persistées dans `localStorage` pour ce MVP.

Avec Docker:

```bash
docker compose up --build
```

Puis ouvrir `http://localhost:8080`.
