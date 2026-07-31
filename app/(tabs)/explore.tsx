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
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { listarProdutos, criarProduto, excluirProduto, type Produto } from '@/db/produtos';

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);

  const [nome, setNome] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemLocal, setImagemLocal] = useState<string | null>(null);

  const carregarProdutos = useCallback(async () => {
    const dados = await listarProdutos(busca.trim() || undefined);
    setProdutos(dados);
  }, [busca]);

  useFocusEffect(
    useCallback(() => {
      carregarProdutos();
    }, [carregarProdutos])
  );

  function resetFormulario() {
    setNome('');
    setCodigoBarras('');
    setImagemUrl('');
    setImagemLocal(null);
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
    await criarProduto(
      nomeLimpo,
      codigoBarras.trim() || null,
      imagemTipo,
      imagemTipo === 'url' ? imagemUrl.trim() : null,
      imagemTipo === 'foto' ? imagemLocal : null
    );
    resetFormulario();
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
      <Text style={styles.titulo}>Produtos</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou código de barras"
          placeholderTextColor="#888"
          value={busca}
          onChangeText={setBusca}
        />
        <Pressable style={styles.botaoAdicionar} onPress={() => setModalVisivel(true)}>
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
            <View style={styles.produtoItem}>
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
            </View>
          );
        }}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Novo produto</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nome do produto"
              placeholderTextColor="#888"
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Código de barras (opcional)"
              placeholderTextColor="#888"
              value={codigoBarras}
              onChangeText={setCodigoBarras}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="URL da imagem (opcional)"
              placeholderTextColor="#888"
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

            <View style={styles.modalBotoes}>
              <Pressable
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => {
                  resetFormulario();
                  setModalVisivel(false);
                }}
              >
                <Text style={styles.modalBotaoTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBotao, styles.modalBotaoSalvar]} onPress={handleSalvarProduto}>
                <Text style={styles.modalBotaoTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  titulo: { fontSize: 28, fontWeight: '700', marginTop: 12, marginBottom: 16, color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  botaoAdicionar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoAdicionarTexto: { color: '#fff', fontSize: 24, fontWeight: '700' },
  produtoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  produtoImagem: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#222' },
  produtoImagemVazia: { justifyContent: 'center', alignItems: 'center' },
  produtoImagemVaziaTexto: { fontSize: 9, color: '#888', textAlign: 'center' },
  produtoInfo: { flex: 1, marginLeft: 12 },
  produtoNome: { fontSize: 17, fontWeight: '600', color: '#fff' },
  produtoCodigo: { fontSize: 13, color: '#888', marginTop: 2 },
  botaoExcluir: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#7f1d1d',
    marginLeft: 8,
  },
  botaoExcluirTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalConteudo: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoSecundarioTexto: { color: '#2563eb', fontWeight: '600' },
  modalBotoes: { flexDirection: 'row', gap: 12 },
  modalBotao: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBotaoCancelar: { backgroundColor: '#333' },
  modalBotaoSalvar: { backgroundColor: '#2563eb' },
  modalBotaoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});