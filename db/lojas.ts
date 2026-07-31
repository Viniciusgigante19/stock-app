import { getDb } from './database';

export type Loja = { id: number; nome: string };

export async function listarLojas(): Promise<Loja[]> {
  return getDb().getAllAsync<Loja>('SELECT * FROM lojas ORDER BY nome ASC');
}

export async function buscarLoja(id: number): Promise<Loja | null> {
  const loja = await getDb().getFirstAsync<Loja>('SELECT * FROM lojas WHERE id = ?', id);
  return loja ?? null;
}

export async function criarLoja(nome: string): Promise<number> {
  const result = await getDb().runAsync('INSERT INTO lojas (nome) VALUES (?)', nome);
  return result.lastInsertRowId;
}

export async function renomearLoja(id: number, nome: string) {
  await getDb().runAsync('UPDATE lojas SET nome = ? WHERE id = ?', nome, id);
}

export async function excluirLoja(id: number) {
  await getDb().runAsync('DELETE FROM lojas WHERE id = ?', id);
}