import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarProdutosPorSubcategoria, moverProdutoNaSubcategoria, type Produto } from '@/db/produtos';
import { getDb } from '@/db/database';
import { useAppTheme, type Cores } from '@/contexts/theme-context';

export default function ProdutosOrdemScreen() {
  const { subcategoriaId } = useLocalSearchParams<{ subcategoriaId: string }>();
  const subId = Number(subcategoriaId);

  const { cores } = useAppTheme();
  const styles = useMemo(() => criarEstilos(cores), [cores]);

  const [nomeSubcategoria, setNomeSubcategoria] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const carregar = useCallback(async () => {
    const linha = await getDb().getFirstAsync<{ nome: string }>(
      'SELECT nome FROM subcategorias WHERE id = ?',
      subId
    );
    setNomeSubcategoria(linha?.nome ?? '');
    setProdutos(await listarProdutosPorSubcategoria(subId));
  }, [subId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function handleMover(produto: Produto, direcao: 'cima' | 'baixo') {
    await moverProdutoNaSubcategoria(produto.id, subId, direcao);
    carregar();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: nomeSubcategoria || 'Ordem dos produtos' }} />

      <Text style={styles.titulo}>{nomeSubcategoria}</Text>
      <Text style={styles.subtitulo}>
        Essa ordem é a que os produtos aparecerão em todas as lojas, dentro desta subcategoria.
      </Text>

      <FlatList
        data={produtos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhum produto nesta subcategoria ainda. Atribua produtos a ela na aba Produtos.
          </Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <View style={styles.setas}>
              <Pressable
                style={[styles.botaoSeta, index === 0 && styles.botaoSetaDesabilitado]}
                disabled={index === 0}
                onPress={() => handleMover(item, 'cima')}
              >
                <Text style={styles.botaoSetaTexto}>▲</Text>
              </Pressable>
              <Pressable
                style={[styles.botaoSeta, index === produtos.length - 1 && styles.botaoSetaDesabilitado]}
                disabled={index === produtos.length - 1}
                onPress={() => handleMover(item, 'baixo')}
              >
                <Text style={styles.botaoSetaTexto}>▼</Text>
              </Pressable>
            </View>
            <Text style={styles.nome}>{item.nome}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 14, backgroundColor: cores.fundo },
    titulo: { fontSize: 24, fontWeight: '700', color: cores.texto, marginTop: 8 },
    subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4, marginBottom: 16 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    setas: { marginRight: 12 },
    botaoSeta: { width: 28, height: 22, justifyContent: 'center', alignItems: 'center' },
    botaoSetaDesabilitado: { opacity: 0.25 },
    botaoSetaTexto: { color: cores.texto, fontSize: 12 },
    nome: { fontSize: 16, fontWeight: '600', color: cores.texto },
    vazio: { textAlign: 'center', marginTop: 40, color: cores.textoSecundario, fontSize: 15, paddingHorizontal: 10 },
  });
}