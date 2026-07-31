import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('estoque.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS lojas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      imagem_tipo TEXT NOT NULL DEFAULT 'nenhuma',
      imagem_url TEXT,
      imagem_arquivo TEXT
    );

    CREATE TABLE IF NOT EXISTS estoque_loja (
      loja_id INTEGER NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      estoque INTEGER,
      prateleira INTEGER,
      PRIMARY KEY (loja_id, produto_id)
    );

    CREATE INDEX IF NOT EXISTS idx_estoque_loja ON estoque_loja(loja_id);
  `);

  // Migração: adiciona a coluna codigo_barras se ainda não existir.
  // Bancos criados antes desta versão não têm essa coluna.
  try {
    await db.execAsync('ALTER TABLE produtos ADD COLUMN codigo_barras TEXT;');
  } catch (err) {
    // Coluna já existe — ignora o erro
  }

  return db;
}

export function getDb() {
  return db;
}