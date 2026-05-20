CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'scientist',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3f7d20'
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  freezer TEXT,
  shelf TEXT,
  box TEXT,
  position TEXT,
  notes TEXT
);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_stock REAL NOT NULL DEFAULT 0,
  max_stock REAL NOT NULL DEFAULT 0,
  location_id TEXT REFERENCES locations(id),
  protocol TEXT CHECK (protocol IN ('RT-qPCR', 'ELISA', 'Lipolyse', 'Glucose uptake', 'Imagerie') OR protocol IS NULL),
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE item_tags (
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE biological_samples (
  id TEXT PRIMARY KEY,
  anonymized_patient_id TEXT NOT NULL,
  depot TEXT NOT NULL CHECK (depot IN ('facial', 'abdominal', 'other')),
  collected_at TEXT NOT NULL,
  experimental_condition TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  location_id TEXT REFERENCES locations(id),
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_requests (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critique', 'muy urgente', 'urgente', 'no urgente')),
  supplier TEXT,
  notes TEXT,
  requested_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ordered_at TEXT
);

CREATE TABLE stock_updates (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('used', 'received')),
  amount REAL NOT NULL CHECK (amount > 0),
  unit TEXT NOT NULL,
  previous_quantity REAL NOT NULL,
  new_quantity REAL NOT NULL,
  notes TEXT,
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE protocol_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('RT-qPCR', 'ELISA', 'Lipolyse', 'Glucose uptake', 'Imagerie')),
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE protocol_items (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES protocol_templates(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  per_condition_quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES protocol_templates(id),
  template_name TEXT NOT NULL,
  name TEXT NOT NULL,
  conditions INTEGER NOT NULL DEFAULT 1,
  replicates INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at TEXT
);

CREATE TABLE experiment_items (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  source_protocol_item_id TEXT REFERENCES protocol_items(id),
  item_id TEXT REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  notes TEXT
);
