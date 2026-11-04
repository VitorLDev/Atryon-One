-- Schema de referência para uma futura persistência SQLite.
-- Não é executado pela aplicação atual.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'support', 'requester')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
  status TEXT NOT NULL DEFAULT 'Em andamento' CHECK (status IN ('Em andamento', 'Resolvido')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tickets_status_created_at_idx ON tickets(status, created_at);
CREATE INDEX IF NOT EXISTS tickets_assigned_to_status_idx ON tickets(assigned_to, status);
