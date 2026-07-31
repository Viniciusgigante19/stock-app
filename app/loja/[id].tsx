import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buscarLoja, type Loja } from '@/db/lojas';
import { listarProdutos, type Produto } from '@/db/produtos';
import {
  listarEstoqueLoja,
  adicionarProdutoNaLoja,
  removerProdutoDaLoja,
  atualizarQuantidade,
  zerarEstoqueLoja,
  type ItemEstoque,
} from '@/db/estoque';

export default function LojaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lojaId = Number(id);

  const [loja, setLoja] = useState<Loja | null>(null);
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [catalogo, setCatalogo] = useState<Produto[]>([]);
  const [buscaCatalogo, setBuscaCatalogo] = useState('');

  const carregar = useCallback(async () => {
    const [lojaEncontrada, estoque] = await Promise.all([
      buscarLoja(lojaId),
      listarEstoqueLoja(lojaId),
    ]);
    setLoja(lojaEncontrada);
    setItens(estoque);
  }, [lojaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function abrirModalAdicionar() {
    const todosProdutos = await listarProdutos();
    const idsNaLoja = new Set(itens.map((i) => i.produto_id));
    setCatalogo(todosProdutos.filter((p) => !idsNaLoja.has(p.id)));
    setBuscaCatalogo('');
    setModalVisivel(true);
  }

  async function handleAdicionarProduto(produtoId: number) {
    await adicionarProdutoNaLoja(lojaId, produtoId);
    setCatalogo((atual) => atual.filter((p) => p.id !== produtoId));
    carregar();
  }

  function handleRemoverProduto(item: ItemEstoque) {
    Alert.alert('Remover produto', `Remover "${item.nome}" do estoque desta loja?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await removerProdutoDaLoja(lojaId, item.produto_id);
          carregar();
        },
      },
    ]);
  }

  function handleZerarTudo() {
    Alert.alert(
      'Zerar estoque',
      'Isso vai apagar todas as quantidades desta loja (depósito e área de vendas). Confirma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Zerar tudo',
          style: 'destructive',
          onPress: async () => {
            await zerarEstoqueLoja(lojaId);
            carregar();
          },
        },
      ]
    );
  }

  function atualizarLocal(produtoId: number, campo: 'estoque' | 'prateleira', valor: string) {
    const numero = valor.trim() === '' ? null : Number(valor.replace(/[^0-9]/g, ''));
    setItens((atual) =>
      atual.map((item) => (item.produto_id === produtoId ? { ...item, [campo]: numero } : item))
    );
  }

  async function salvarQuantidade(produtoId: number, campo: 'estoque' | 'prateleira', valor: string) {
    const numero = valor.trim() === '' ? null : Number(valor.replace(/[^0-9]/g, ''));
    await atualizarQuantidade(lojaId, produtoId, campo, numero);
  }

  function fonteImagem(item: ItemEstoque | Produto) {
    if (item.imagem_tipo === 'foto' && item.imagem_arquivo) return { uri: item.imagem_arquivo };
    if (item.imagem_tipo === 'url' && item.imagem_url) return { uri: item.imagem_url };
    return null;
  }

  const catalogoFiltrado = buscaCatalogo.trim()
    ? catalogo.filter((p) => p.nome.toLowerCase().includes(buscaCatalogo.trim().toLowerCase()))
    : catalogo;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: loja?.nome ?? 'Loja' }} />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>{loja?.nome ?? '...'}</Text>
        <Pressable style={styles.botaoZerar} onPress={handleZerarTudo}>
          <Text style={styles.botaoZerarTexto}>Zerar tudo</Text>
        </Pressable>
      </View>

      <Pressable style={styles.botaoAdicionarProduto} onPress={abrirModalAdicionar}>
        <Text style={styles.botaoAdicionarProdutoTexto}>+ Adicionar produto do catálogo</Text>
      </Pressable>

      <FlatList
        data={itens}
        keyExtractor={(item) => String(item.produto_id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhum produto nesta loja ainda. Toque em "Adicionar produto do catálogo" acima.
          </Text>
        }
        renderItem={({ item }) => {
          const imagem = fonteImagem(item);
          return (
            <View style={styles.itemLinha}>
              {imagem ? (
                <Image source={imagem} style={styles.itemImagem} />
              ) : (
                <View style={[styles.itemImagem, styles.itemImagemVazia]} />
              )}

              <Text style={styles.itemNome} numberOfLines={2}>
                {item.nome}
              </Text>

              <View style={styles.quantidades}>
                <View style={styles.campoQuantidade}>
                  <Text style={styles.rotuloQuantidade}>Depósito</Text>
                  <TextInput
                    style={styles.inputQuantidade}
                    keyboardType="numeric"
                    value={item.estoque === null ? '' : String(item.estoque)}
                    onChangeText={(v) => atualizarLocal(item.produto_id, 'estoque', v)}
                    onEndEditing={(e) => salvarQuantidade(item.produto_id, 'estoque', e.nativeEvent.text)}
                  />
                </View>
                <View style={styles.campoQuantidade}>
                  <Text style={styles.rotuloQuantidade}>Vendas</Text>
                  <TextInput
                    style={styles.inputQuantidade}
                    keyboardType="numeric"
                    value={item.prateleira === null ? '' : String(item.prateleira)}
                    onChangeText={(v) => atualizarLocal(item.produto_id, 'prateleira', v)}
                    onEndEditing={(e) => salvarQuantidade(item.produto_id, 'prateleira', e.nativeEvent.text)}
                  />
                </View>
              </View>

              <Pressable style={styles.botaoRemover} onPress={() => handleRemoverProduto(item)}>
                <Text style={styles.botaoRemoverTexto}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Adicionar do catálogo</Text>
            <TextInput
              style={styles.modalBusca}
              placeholder="Buscar produto"
              placeholderTextColor="#888"
              value={buscaCatalogo}
              onChangeText={setBuscaCatalogo}
            />
            <FlatList
              data={catalogoFiltrado}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.vazio}>Todos os produtos do catálogo já estão nesta loja.</Text>
              }
              renderItem={({ item }) => (
                <Pressable style={styles.catalogoItem} onPress={() => handleAdicionarProduto(item.id)}>
                  <Text style={styles.catalogoItemTexto}>{item.nome}</Text>
                  <Text style={styles.catalogoItemMais}>+ adicionar</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.modalFechar} onPress={() => setModalVisivel(false)}>
              <Text style={styles.modalFecharTexto}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  titulo: { fontSize: 24, fontWeight: '700', color: '#fff', flexShrink: 1 },
  botaoZerar: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  botaoZerarTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  botaoAdicionarProduto: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoAdicionarProdutoTexto: { color: '#2563eb', fontWeight: '600' },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemImagem: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#222' },
  itemImagemVazia: {},
  itemNome: { flex: 1, marginLeft: 10, marginRight: 8, color: '#fff', fontSize: 15, fontWeight: '500' },
  quantidades: { flexDirection: 'row', gap: 8 },
  campoQuantidade: { alignItems: 'center' },
  rotuloQuantidade: { color: '#888', fontSize: 10, marginBottom: 2 },
  inputQuantidade: {
    width: 52,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingVertical: 6,
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
  },
  botaoRemover: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoRemoverTexto: { color: '#fff', fontSize: 14 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15, paddingHorizontal: 20 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalConteudo: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  modalBusca: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
  },
  catalogoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  catalogoItemTexto: { color: '#fff', fontSize: 15, flex: 1 },
  catalogoItemMais: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  modalFechar: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  modalFecharTexto: { color: '#888', fontWeight: '600' },
});