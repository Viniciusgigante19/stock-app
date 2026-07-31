import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { listarProdutos, criarProduto, atualizarProduto, excluirProduto, type Produto } from '@/db/produtos';
import { listarCategorias, listarSubcategorias, type Categoria, type Subcategoria } from '@/db/categorias';
import { useAppTheme, type Cores } from '@/contexts/theme-context';

const MARGEM_TOPO_EXTRA = 14;

export default function ProdutosScreen() {
  const { cores } = useAppTheme();
  const styles = useMemo(() => criarEstilos(cores), [cores]);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [nome, setNome] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemLocal, setImagemLocal] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number | null>(null);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<number | null>(null);

  const carregarProdutos = useCallback(async () => {
    const dados = await listarProdutos(busca.trim() || undefined);
    setProdutos(dados);
  }, [busca]);

  useFocusEffect(
    useCallback(() => {
      carregarProdutos();
    }, [carregarProdutos])
  );

  async function abrirModalNovoProduto() {
    setProdutoEditando(null);
    resetFormulario();
    const cats = await listarCategorias();
    setCategorias(cats);
    setSubcategorias([]);
    setModalVisivel(true);
  }

  async function abrirModalEditarProduto(produto: Produto) {
    setProdutoEditando(produto);
    setNome(produto.nome);
    setCodigoBarras(produto.codigo_barras ?? '');
    setImagemUrl(produto.imagem_tipo === 'url' ? produto.imagem_url ?? '' : '');
    setImagemLocal(produto.imagem_tipo === 'foto' ? produto.imagem_arquivo : null);

    const cats = await listarCategorias();
    setCategorias(cats);

    if (produto.subcategoria_id) {
      for (const cat of cats) {
        const subs = await listarSubcategorias(cat.id);
        const achou = subs.find((s) => s.id === produto.subcategoria_id);
        if (achou) {
          setCategoriaSelecionada(cat.id);
          setSubcategorias(subs);
          setSubcategoriaSelecionada(produto.subcategoria_id);
          break;
        }
      }
    } else {
      setCategoriaSelecionada(null);
      setSubcategorias([]);
      setSubcategoriaSelecionada(null);
    }

    setModalVisivel(true);
  }

  function resetFormulario() {
    setNome('');
    setCodigoBarras('');
    setImagemUrl('');
    setImagemLocal(null);
    setCategoriaSelecionada(null);
    setSubcategoriaSelecionada(null);
    setSubcategorias([]);
  }

  async function handleSelecionarCategoria(categoriaId: number) {
    setCategoriaSelecionada(categoriaId);
    setSubcategoriaSelecionada(null);
    const subs = await listarSubcategorias(categoriaId);
    setSubcategorias(subs);
  }

  async function handleEscolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Preciso de acesso às fotos para escolher uma imagem.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      setImagemLocal(resultado.assets[0].uri);
      setImagemUrl('');
    }
  }

  async function handleSalvarProduto() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      Alert.alert('Erro', 'Digite o nome do produto.');
      return;
    }
    const imagemTipo = imagemLocal ? 'foto' : imagemUrl.trim() ? 'url' : 'nenhuma';

    if (produtoEditando) {
      await atualizarProduto(
        produtoEditando.id,
        nomeLimpo,
        codigoBarras.trim() || null,
        imagemTipo,
        imagemTipo === 'url' ? imagemUrl.trim() : null,
        imagemTipo === 'foto' ? imagemLocal : null,
        subcategoriaSelecionada
      );
    } else {
      await criarProduto(
        nomeLimpo,
        codigoBarras.trim() || null,
        imagemTipo,
        imagemTipo === 'url' ? imagemUrl.trim() : null,
        imagemTipo === 'foto' ? imagemLocal : null,
        subcategoriaSelecionada
      );
    }

    resetFormulario();
    setProdutoEditando(null);
    setModalVisivel(false);
    carregarProdutos();
  }

  function handleExcluirProduto(produto: Produto) {
    Alert.alert('Excluir produto', `Excluir "${produto.nome}" do catálogo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirProduto(produto.id);
            carregarProdutos();
          } catch (err: any) {
            Alert.alert(
              'Não foi possível excluir',
              err.message ?? 'Este produto está em uso em alguma loja.'
            );
          }
        },
      },
    ]);
  }

  function fonteImagem(produto: Produto) {
    if (produto.imagem_tipo === 'foto' && produto.imagem_arquivo) {
      return { uri: produto.imagem_arquivo };
    }
    if (produto.imagem_tipo === 'url' && produto.imagem_url) {
      return { uri: produto.imagem_url };
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Produtos</Text>
        <Pressable style={styles.botaoCategorias} onPress={() => router.push('/categorias')}>
          <Text style={styles.botaoCategoriasTexto}>Categorias</Text>
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou código de barras"
          placeholderTextColor={cores.placeholder}
          value={busca}
          onChangeText={setBusca}
        />
        <Pressable style={styles.botaoAdicionar} onPress={abrirModalNovoProduto}>
          <Text style={styles.botaoAdicionarTexto}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={produtos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum produto cadastrado ainda. Adicione um acima.</Text>
        }
        renderItem={({ item }) => {
          const imagem = fonteImagem(item);
          return (
            <Pressable style={styles.produtoItem} onPress={() => abrirModalEditarProduto(item)}>
              {imagem ? (
                <Image source={imagem} style={styles.produtoImagem} />
              ) : (
                <View style={[styles.produtoImagem, styles.produtoImagemVazia]}>
                  <Text style={styles.produtoImagemVaziaTexto}>Sem foto</Text>
                </View>
              )}
              <View style={styles.produtoInfo}>
                <Text style={styles.produtoNome}>{item.nome}</Text>
                {item.codigo_barras ? (
                  <Text style={styles.produtoCodigo}>Cód: {item.codigo_barras}</Text>
                ) : null}
              </View>
              <Pressable style={styles.botaoExcluir} onPress={() => handleExcluirProduto(item)}>
                <Text style={styles.botaoExcluirTexto}>Excluir</Text>
              </Pressable>
            </Pressable>
          );
        }}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitulo}>
                {produtoEditando ? 'Editar produto' : 'Novo produto'}
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nome do produto"
                placeholderTextColor={cores.placeholder}
                value={nome}
                onChangeText={setNome}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Código de barras (opcional)"
                placeholderTextColor={cores.placeholder}
                value={codigoBarras}
                onChangeText={setCodigoBarras}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="URL da imagem (opcional)"
                placeholderTextColor={cores.placeholder}
                value={imagemUrl}
                onChangeText={(texto) => {
                  setImagemUrl(texto);
                  if (texto) setImagemLocal(null);
                }}
                autoCapitalize="none"
              />

              <Pressable style={styles.botaoSecundario} onPress={handleEscolherFoto}>
                <Text style={styles.botaoSecundarioTexto}>
                  {imagemLocal ? 'Foto selecionada ✓' : 'Escolher foto da galeria'}
                </Text>
              </Pressable>

              <Text style={styles.rotuloSecao}>Categoria (opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <Pressable
                  style={[styles.chip, categoriaSelecionada === null && styles.chipSelecionado]}
                  onPress={() => {
                    setCategoriaSelecionada(null);
                    setSubcategoriaSelecionada(null);
                    setSubcategorias([]);
                  }}
                >
                  <Text
                    style={[
                      styles.chipTexto,
                      categoriaSelecionada === null && styles.chipTextoSelecionado,
                    ]}
                  >
                    Nenhuma
                  </Text>
                </Pressable>
                {categorias.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, categoriaSelecionada === cat.id && styles.chipSelecionado]}
                    onPress={() => handleSelecionarCategoria(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        categoriaSelecionada === cat.id && styles.chipTextoSelecionado,
                      ]}
                    >
                      {cat.nome}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {categoriaSelecionada !== null && subcategorias.length > 0 && (
                <>
                  <Text style={styles.rotuloSecao}>Subcategoria</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {subcategorias.map((sub) => (
                      <Pressable
                        key={sub.id}
                        style={[
                          styles.chip,
                          subcategoriaSelecionada === sub.id && styles.chipSelecionado,
                        ]}
                        onPress={() => setSubcategoriaSelecionada(sub.id)}
                      >
                        <Text
                          style={[
                            styles.chipTexto,
                            subcategoriaSelecionada === sub.id && styles.chipTextoSelecionado,
                          ]}
                        >
                          {sub.nome}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={styles.modalBotoes}>
                <Pressable
                  style={[styles.modalBotao, styles.modalBotaoCancelar]}
                  onPress={() => {
                    resetFormulario();
                    setProdutoEditando(null);
                    setModalVisivel(false);
                  }}
                >
                  <Text style={styles.modalBotaoTexto}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalBotao, styles.modalBotaoSalvar]} onPress={handleSalvarProduto}>
                  <Text style={styles.modalBotaoTexto}>
                    {produtoEditando ? 'Salvar alterações' : 'Salvar'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: MARGEM_TOPO_EXTRA, backgroundColor: cores.fundo },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 16,
    },
    titulo: { fontSize: 28, fontWeight: '700', color: cores.texto },
    botaoCategorias: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: cores.primaria,
    },
    botaoCategoriasTexto: { color: cores.primaria, fontWeight: '600', fontSize: 13 },
    inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: cores.texto,
    },
    botaoAdicionar: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: cores.primaria,
      justifyContent: 'center',
      alignItems: 'center',
    },
    botaoAdicionarTexto: { color: '#fff', fontSize: 24, fontWeight: '700' },
    produtoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    produtoImagem: { width: 48, height: 48, borderRadius: 8, backgroundColor: cores.fundoCartao },
    produtoImagemVazia: { justifyContent: 'center', alignItems: 'center' },
    produtoImagemVaziaTexto: { fontSize: 9, color: cores.textoSecundario, textAlign: 'center' },
    produtoInfo: { flex: 1, marginLeft: 12 },
    produtoNome: { fontSize: 17, fontWeight: '600', color: cores.texto },
    produtoCodigo: { fontSize: 13, color: cores.textoSecundario, marginTop: 2 },
    botaoExcluir: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: cores.perigo,
      marginLeft: 8,
    },
    botaoExcluirTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
    vazio: { textAlign: 'center', marginTop: 40, color: cores.textoSecundario, fontSize: 16 },
    modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalConteudo: {
      backgroundColor: cores.fundoCartao,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      maxHeight: '85%',
    },
    modalTitulo: { fontSize: 20, fontWeight: '700', color: cores.texto, marginBottom: 16 },
    modalInput: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: cores.texto,
      marginBottom: 12,
    },
    botaoSecundario: {
      borderWidth: 1,
      borderColor: cores.primaria,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    botaoSecundarioTexto: { color: cores.primaria, fontWeight: '600' },
    rotuloSecao: { color: cores.textoSecundario, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    chip: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginRight: 8,
    },
    chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
    chipTexto: { color: cores.texto, fontSize: 13 },
    chipTextoSelecionado: { color: '#fff', fontWeight: '600' },
    modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBotao: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    modalBotaoCancelar: { backgroundColor: cores.borda },
    modalBotaoSalvar: { backgroundColor: cores.primaria },
    modalBotaoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}