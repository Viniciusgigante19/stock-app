import { getDb } from './database';

export type Loja = { 
  id: number;
  nome: string;
  imagem_tipo: 'nenhuma' | 'url' | 'foto';
  imagem_url: string | null;
  imagem_arquivo: string | null;
};

export async function listarLojas(): Promise<Loja[]> {
  return getDb().getAllAsync<Loja>('SELECT * FROM lojas ORDER BY nome ASC');
}

export async function buscarLoja(id: number): Promise<Loja | null> {
  const loja = await getDb().getFirstAsync<Loja>('SELECT * FROM lojas WHERE id = ?', id);
  return loja ?? null;
}

export async function criarLoja(
  nome: string,
  imagemTipo: Loja['imagem_tipo'] = 'nenhuma',
  imagemUrl: string | null = null,
  imagemArquivo: string | null = null
): Promise<number> {
  const result = await getDb().runAsync(
    `INSERT INTO lojas 
      (nome, imagem_tipo, imagem_url, imagem_arquivo)
     VALUES (?, ?, ?, ?)`,
    nome,
    imagemTipo,
    imagemUrl,
    imagemArquivo
  );

  return result.lastInsertRowId;
}

export async function atualizarLoja(
  id: number,
  nome: string,
  imagemTipo: Loja['imagem_tipo'],
  imagemUrl: string | null,
  imagemArquivo: string | null
) {
  await getDb().runAsync(
    `UPDATE lojas
     SET nome = ?,
         imagem_tipo = ?,
         imagem_url = ?,
         imagem_arquivo = ?
     WHERE id = ?`,
    nome,
    imagemTipo,
    imagemUrl,
    imagemArquivo,
    id
  );
}

export async function renomearLoja(id: number, nome: string) {
  await getDb().runAsync('UPDATE lojas SET nome = ? WHERE id = ?', nome, id);
}

export async function excluirLoja(id: number) {
  await getDb().runAsync('DELETE FROM lojas WHERE id = ?', id);
}