import { getDb } from './database';

export async function obterConfiguracao(chave: string): Promise<string | null> {
  const linha = await getDb().getFirstAsync<{ valor: string }>(
    'SELECT valor FROM configuracoes WHERE chave = ?',
    chave
  );
  return linha?.valor ?? null;
}

export async function definirConfiguracao(chave: string, valor: string) {
  await getDb().runAsync(
    `INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    valor
  );
}