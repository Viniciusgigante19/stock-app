import { getDb } from './database';

export type Produto = {
  id: number;
  nome: string;
  codigo_barras: string | null;
  imagem_tipo: 'nenhuma' | 'url' | 'foto';
  imagem_url: string | null;
  imagem_arquivo: string | null;
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

export async function criarProduto(
  nome: string,
  codigoBarras: string | null = null,
  imagemTipo: Produto['imagem_tipo'] = 'nenhuma',
  imagemUrl: string | null = null,
  imagemArquivo: string | null = null
): Promise<number> {
  const result = await getDb().runAsync(
    'INSERT INTO produtos (nome, codigo_barras, imagem_tipo, imagem_url, imagem_arquivo) VALUES (?, ?, ?, ?, ?)',
    nome,
    codigoBarras,
    imagemTipo,
    imagemUrl,
    imagemArquivo
  );
  return result.lastInsertRowId;
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