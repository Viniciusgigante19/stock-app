import { getDb } from './database';

export type ItemEstoque = {
  produto_id: number;
  nome: string;
  imagem_tipo: string;
  imagem_url: string | null;
  imagem_arquivo: string | null;
  estoque: number | null;
  prateleira: number | null;
  categoria_id: number | null;
  categoria_nome: string | null;
  subcategoria_id: number | null;
  subcategoria_nome: string | null;
};

export async function listarEstoqueLoja(lojaId: number): Promise<ItemEstoque[]> {
  return getDb().getAllAsync<ItemEstoque>(
    `SELECT p.id as produto_id, p.nome, p.imagem_tipo, p.imagem_url, p.imagem_arquivo,
            e.estoque, e.prateleira,
            c.id as categoria_id, c.nome as categoria_nome,
            s.id as subcategoria_id, s.nome as subcategoria_nome
     FROM estoque_loja e
     JOIN produtos p ON p.id = e.produto_id
     LEFT JOIN subcategorias s ON s.id = p.subcategoria_id
     LEFT JOIN categorias c ON c.id = s.categoria_id
     WHERE e.loja_id = ?
     ORDER BY
       CASE WHEN c.id IS NULL THEN 1 ELSE 0 END,
       c.ordem ASC,
       CASE WHEN s.id IS NULL THEN 1 ELSE 0 END,
       s.ordem ASC,
       p.ordem ASC,
       p.nome ASC`,
    lojaId
  );
}

export async function adicionarProdutoNaLoja(lojaId: number, produtoId: number) {
  await getDb().runAsync(
    'INSERT OR IGNORE INTO estoque_loja (loja_id, produto_id, estoque, prateleira) VALUES (?, ?, NULL, NULL)',
    lojaId,
    produtoId
  );
}

export async function removerProdutoDaLoja(lojaId: number, produtoId: number) {
  await getDb().runAsync('DELETE FROM estoque_loja WHERE loja_id = ? AND produto_id = ?', lojaId, produtoId);
}

export async function atualizarQuantidade(
  lojaId: number,
  produtoId: number,
  campo: 'estoque' | 'prateleira',
  valor: number | null
) {
  await getDb().runAsync(
    `UPDATE estoque_loja SET ${campo} = ? WHERE loja_id = ? AND produto_id = ?`,
    valor,
    lojaId,
    produtoId
  );
}

export async function zerarEstoqueLoja(lojaId: number) {
  await getDb().runAsync(
    'UPDATE estoque_loja SET estoque = NULL, prateleira = NULL WHERE loja_id = ?',
    lojaId
  );
}