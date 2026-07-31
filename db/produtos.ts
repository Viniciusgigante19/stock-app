import { getDb } from './database';

export type Produto = {
  id: number;
  nome: string;
  codigo_barras: string | null;
  imagem_tipo: 'nenhuma' | 'url' | 'foto';
  imagem_url: string | null;
  imagem_arquivo: string | null;
  subcategoria_id: number | null;
  ordem: number;
};

export async function listarProdutos(filtro?: string): Promise<Produto[]> {
  if (filtro) {
    return getDb().getAllAsync<Produto>(
      'SELECT * FROM produtos WHERE nome LIKE ? OR codigo_barras LIKE ? ORDER BY nome ASC',
      `%${filtro}%`,
      `%${filtro}%`
    );
  }
  return getDb().getAllAsync<Produto>('SELECT * FROM produtos ORDER BY nome ASC');
}

export async function listarProdutosPorSubcategoria(subcategoriaId: number | null): Promise<Produto[]> {
  if (subcategoriaId === null) {
    return getDb().getAllAsync<Produto>(
      'SELECT * FROM produtos WHERE subcategoria_id IS NULL ORDER BY ordem ASC, nome ASC'
    );
  }
  return getDb().getAllAsync<Produto>(
    'SELECT * FROM produtos WHERE subcategoria_id = ? ORDER BY ordem ASC, nome ASC',
    subcategoriaId
  );
}

async function proximaOrdem(subcategoriaId: number | null): Promise<number> {
  const db = getDb();
  const linha = subcategoriaId === null
    ? await db.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(ordem) as max FROM produtos WHERE subcategoria_id IS NULL'
      )
    : await db.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(ordem) as max FROM produtos WHERE subcategoria_id = ?',
        subcategoriaId
      );
  return (linha?.max ?? -1) + 1;
}

export async function criarProduto(
  nome: string,
  codigoBarras: string | null = null,
  imagemTipo: Produto['imagem_tipo'] = 'nenhuma',
  imagemUrl: string | null = null,
  imagemArquivo: string | null = null,
  subcategoriaId: number | null = null
): Promise<number> {
  const ordem = await proximaOrdem(subcategoriaId);
  const result = await getDb().runAsync(
    `INSERT INTO produtos (nome, codigo_barras, imagem_tipo, imagem_url, imagem_arquivo, subcategoria_id, ordem)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    nome,
    codigoBarras,
    imagemTipo,
    imagemUrl,
    imagemArquivo,
    subcategoriaId,
    ordem
  );
  return result.lastInsertRowId;
}

export async function atualizarProduto(
  id: number,
  nome: string,
  codigoBarras: string | null,
  imagemTipo: Produto['imagem_tipo'],
  imagemUrl: string | null,
  imagemArquivo: string | null,
  subcategoriaId: number | null
) {
  const db = getDb();
  const produtoAtual = await db.getFirstAsync<Produto>('SELECT * FROM produtos WHERE id = ?', id);
  // Se mudou de subcategoria, recalcula a ordem pro fim da nova subcategoria
  const ordem =
    produtoAtual && produtoAtual.subcategoria_id === subcategoriaId
      ? produtoAtual.ordem
      : await proximaOrdem(subcategoriaId);

  await db.runAsync(
    `UPDATE produtos
     SET nome = ?, codigo_barras = ?, imagem_tipo = ?, imagem_url = ?, imagem_arquivo = ?, subcategoria_id = ?, ordem = ?
     WHERE id = ?`,
    nome,
    codigoBarras,
    imagemTipo,
    imagemUrl,
    imagemArquivo,
    subcategoriaId,
    ordem,
    id
  );
}

export async function moverProdutoNaSubcategoria(
  id: number,
  subcategoriaId: number | null,
  direcao: 'cima' | 'baixo'
) {
  const db = getDb();
  const produtos = await listarProdutosPorSubcategoria(subcategoriaId);
  const indice = produtos.findIndex((p) => p.id === id);
  const alvo = direcao === 'cima' ? indice - 1 : indice + 1;
  if (indice === -1 || alvo < 0 || alvo >= produtos.length) return;

  const atual = produtos[indice];
  const vizinho = produtos[alvo];
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE produtos SET ordem = ? WHERE id = ?', vizinho.ordem, atual.id);
    await db.runAsync('UPDATE produtos SET ordem = ? WHERE id = ?', atual.ordem, vizinho.id);
  });
}

export async function produtoEstaEmUso(produtoId: number): Promise<boolean> {
  const linha = await getDb().getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) as total FROM estoque_loja WHERE produto_id = ?',
    produtoId
  );
  return (linha?.total ?? 0) > 0;
}

export async function excluirProduto(id: number) {
  const emUso = await produtoEstaEmUso(id);
  if (emUso) {
    throw new Error('Este produto está em uso em uma ou mais lojas e não pode ser excluído do catálogo.');
  }
  await getDb().runAsync('DELETE FROM produtos WHERE id = ?', id);
}

export async function importarProdutos(itens: { nome: string; codigo_barras?: string; imagem?: string }[]) {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    for (const item of itens) {
      await db.runAsync(
        'INSERT INTO produtos (nome, codigo_barras, imagem_tipo, imagem_url) VALUES (?, ?, ?, ?)',
        item.nome,
        item.codigo_barras ?? null,
        item.imagem ? 'url' : 'nenhuma',
        item.imagem ?? null
      );
    }
  });
}