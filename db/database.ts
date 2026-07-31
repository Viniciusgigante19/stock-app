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

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      ordem INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subcategorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      ordem INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );
  `);

  // Migrações: adiciona colunas novas em bancos já existentes, ignorando erro se já existirem.
  const migracoes = [
    'ALTER TABLE produtos ADD COLUMN codigo_barras TEXT;',
    'ALTER TABLE produtos ADD COLUMN subcategoria_id INTEGER;',
    'ALTER TABLE produtos ADD COLUMN ordem INTEGER NOT NULL DEFAULT 0;',
  ];
  for (const sql of migracoes) {
    try {
      await db.execAsync(sql);
    } catch (err) {
      // Coluna já existe — ignora
    }
  }

  return db;
}

export function getDb() {
  return db;
}