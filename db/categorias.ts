import { getDb } from './database';

export type Categoria = { id: number; nome: string; ordem: number };
export type Subcategoria = { id: number; categoria_id: number; nome: string; ordem: number };

export async function listarCategorias(): Promise<Categoria[]> {
  return getDb().getAllAsync<Categoria>('SELECT * FROM categorias ORDER BY ordem ASC, id ASC');
}

export async function listarSubcategorias(categoriaId: number): Promise<Subcategoria[]> {
  return getDb().getAllAsync<Subcategoria>(
    'SELECT * FROM subcategorias WHERE categoria_id = ? ORDER BY ordem ASC, id ASC',
    categoriaId
  );
}

export async function listarTodasSubcategoriasComCategoria(): Promise
  (Subcategoria & { categoria_nome: string })[]
> {
  return getDb().getAllAsync(
    `SELECT s.*, c.nome as categoria_nome
     FROM subcategorias s
     JOIN categorias c ON c.id = s.categoria_id
     ORDER BY c.ordem ASC, s.ordem ASC`
  );
}

export async function criarCategoria(nome: string): Promise<number> {
  const db = getDb();
  const maior = await db.getFirstAsync<{ max: number | null }>('SELECT MAX(ordem) as max FROM categorias');
  const ordem = (maior?.max ?? -1) + 1;
  const result = await db.runAsync('INSERT INTO categorias (nome, ordem) VALUES (?, ?)', nome, ordem);
  return result.lastInsertRowId;
}

export async function renomearCategoria(id: number, nome: string) {
  await getDb().runAsync('UPDATE categorias SET nome = ? WHERE id = ?', nome, id);
}

export async function excluirCategoria(id: number) {
  const db = getDb();
  // Produtos que usavam subcategorias dessa categoria ficam "sem categoria"
  await db.runAsync(
    `UPDATE produtos SET subcategoria_id = NULL
     WHERE subcategoria_id IN (SELECT id FROM subcategorias WHERE categoria_id = ?)`,
    id
  );
  await db.runAsync('DELETE FROM subcategorias WHERE categoria_id = ?', id);
  await db.runAsync('DELETE FROM categorias WHERE id = ?', id);
}

export async function moverCategoria(id: number, direcao: 'cima' | 'baixo') {
  const db = getDb();
  const categorias = await listarCategorias();
  const indice = categorias.findIndex((c) => c.id === id);
  const alvo = direcao === 'cima' ? indice - 1 : indice + 1;
  if (indice === -1 || alvo < 0 || alvo >= categorias.length) return;

  const atual = categorias[indice];
  const vizinha = categorias[alvo];
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE categorias SET ordem = ? WHERE id = ?', vizinha.ordem, atual.id);
    await db.runAsync('UPDATE categorias SET ordem = ? WHERE id = ?', atual.ordem, vizinha.id);
  });
}

export async function criarSubcategoria(categoriaId: number, nome: string): Promise<number> {
  const db = getDb();
  const maior = await db.getFirstAsync<{ max: number | null }>(
    'SELECT MAX(ordem) as max FROM subcategorias WHERE categoria_id = ?',
    categoriaId
  );
  const ordem = (maior?.max ?? -1) + 1;
  const result = await db.runAsync(
    'INSERT INTO subcategorias (categoria_id, nome, ordem) VALUES (?, ?, ?)',
    categoriaId,
    nome,
    ordem
  );
  return result.lastInsertRowId;
}

export async function renomearSubcategoria(id: number, nome: string) {
  await getDb().runAsync('UPDATE subcategorias SET nome = ? WHERE id = ?', nome, id);
}

export async function excluirSubcategoria(id: number) {
  const db = getDb();
  await db.runAsync('UPDATE produtos SET subcategoria_id = NULL WHERE subcategoria_id = ?', id);
  await db.runAsync('DELETE FROM subcategorias WHERE id = ?', id);
}

export async function moverSubcategoria(id: number, categoriaId: number, direcao: 'cima' | 'baixo') {
  const db = getDb();
  const subs = await listarSubcategorias(categoriaId);
  const indice = subs.findIndex((s) => s.id === id);
  const alvo = direcao === 'cima' ? indice - 1 : indice + 1;
  if (indice === -1 || alvo < 0 || alvo >= subs.length) return;

  const atual = subs[indice];
  const vizinha = subs[alvo];
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE subcategorias SET ordem = ? WHERE id = ?', vizinha.ordem, atual.id);
    await db.runAsync('UPDATE subcategorias SET ordem = ? WHERE id = ?', atual.ordem, vizinha.id);
  });
}