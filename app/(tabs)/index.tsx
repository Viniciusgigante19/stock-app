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

import { listarLojas, criarLoja, atualizarLoja, excluirLoja, type Loja } from '@/db/lojas';
import { useAppTheme, type Cores } from '@/contexts/theme-context';

const MARGEM_TOPO_EXTRA = 14;

export default function LojasScreen() {
  const { cores, modo, alternarTema } = useAppTheme();
  const styles = useMemo(() => criarEstilos(cores), [cores]);

  const [lojas, setLojas] = useState<Loja[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [lojaEditando, setLojaEditando] = useState<Loja | null>(null);

  const [nome, setNome] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [imagemLocal, setImagemLocal] = useState<string | null>(null);

  const carregarLojas = useCallback(async () => {
    const dados = await listarLojas();
    setLojas(dados);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarLojas();
    }, [carregarLojas])
  );

  function resetFormulario() {
    setNome('');
    setImagemUrl('');
    setImagemLocal(null);
  }

  function abrirModalNovaLoja() {
    setLojaEditando(null);
    resetFormulario();
    setModalVisivel(true);
  }

  function abrirModalEditarLoja(loja: Loja) {
    setLojaEditando(loja);
    setNome(loja.nome);
    setImagemUrl(loja.imagem_tipo === 'url' ? loja.imagem_url ?? '' : '');
    setImagemLocal(loja.imagem_tipo === 'foto' ? loja.imagem_arquivo : null);
    setModalVisivel(true);
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

  async function handleSalvarLoja() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      Alert.alert('Erro', 'Digite o nome da loja.');
      return;
    }
    const imagemTipo = imagemLocal ? 'foto' : imagemUrl.trim() ? 'url' : 'nenhuma';

    try {
      if (lojaEditando) {
        await atualizarLoja(
          lojaEditando.id,
          nomeLimpo,
          imagemTipo,
          imagemTipo === 'url' ? imagemUrl.trim() : null,
          imagemTipo === 'foto' ? imagemLocal : null
        );
      } else {
        await criarLoja(
          nomeLimpo,
          imagemTipo,
          imagemTipo === 'url' ? imagemUrl.trim() : null,
          imagemTipo === 'foto' ? imagemLocal : null
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Já existe uma loja com esse nome.');
      return;
    }

    resetFormulario();
    setLojaEditando(null);
    setModalVisivel(false);
    carregarLojas();
  }

  function handleExcluirLoja(loja: Loja) {
    Alert.alert('Excluir loja', `Excluir "${loja.nome}"? Isso apaga também os dados de estoque dela.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirLoja(loja.id);
          carregarLojas();
        },
      },
    ]);
  }

  function fonteImagem(loja: Loja) {
    if (loja.imagem_tipo === 'foto' && loja.imagem_arquivo) {
      return { uri: loja.imagem_arquivo };
    }
    if (loja.imagem_tipo === 'url' && loja.imagem_url) {
      return { uri: loja.imagem_url };
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Lojas</Text>
        <Pressable style={styles.botaoTema} onPress={alternarTema}>
          <Text style={styles.botaoTemaTexto}>{modo === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}</Text>
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <Pressable style={styles.botaoAdicionarLoja} onPress={abrirModalNovaLoja}>
          <Text style={styles.botaoAdicionarLojaTexto}>+ Nova loja</Text>
        </Pressable>
      </View>

      <FlatList
        data={lojas}
        style={{ flex: 1 }}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma loja cadastrada ainda. Adicione uma acima.</Text>
        }
        renderItem={({ item }) => {
          const imagem = fonteImagem(item);
          return (
            <View style={styles.lojaItem}>
              <Pressable style={styles.lojaNomeArea} onPress={() => router.push(`/loja/${item.id}`)}>
                {imagem ? (
                  <Image source={imagem} style={styles.lojaImagem} />
                ) : (
                  <View style={[styles.lojaImagem, styles.lojaImagemVazia]}>
                    <Text style={styles.lojaImagemVaziaTexto}>Sem logo</Text>
                  </View>
                )}
                <Text style={styles.lojaNome}>{item.nome}</Text>
              </Pressable>
              <View style={styles.lojaAcoes}>
                <Pressable style={styles.botaoEditar} onPress={() => abrirModalEditarLoja(item)}>
                  <Text style={styles.botaoEditarTexto}>Editar</Text>
                </Pressable>
                <Pressable style={styles.botaoExcluir} onPress={() => handleExcluirLoja(item)}>
                  <Text style={styles.botaoExcluirTexto}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitulo}>{lojaEditando ? 'Editar loja' : 'Nova loja'}</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nome da loja"
                placeholderTextColor={cores.placeholder}
                value={nome}
                onChangeText={setNome}
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

              <View style={styles.modalBotoes}>
                <Pressable
                  style={[styles.modalBotao, styles.modalBotaoCancelar]}
                  onPress={() => {
                    resetFormulario();
                    setLojaEditando(null);
                    setModalVisivel(false);
                  }}
                >
                  <Text style={styles.modalBotaoTexto}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalBotao, styles.modalBotaoSalvar]} onPress={handleSalvarLoja}>
                  <Text style={styles.modalBotaoTexto}>
                    {lojaEditando ? 'Salvar alterações' : 'Salvar'}
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
    botaoTema: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: cores.borda,
    },
    botaoTemaTexto: { color: cores.texto, fontSize: 13, fontWeight: '600' },
    inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    botaoAdicionarLoja: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: cores.primaria,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
    },
    botaoAdicionarLojaTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
    lojaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    lojaNomeArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    lojaImagem: { width: 56, height: 56, borderRadius: 10, backgroundColor: cores.fundoCartao },
    lojaImagemVazia: { justifyContent: 'center', alignItems: 'center' },
    lojaImagemVaziaTexto: { fontSize: 10, color: cores.textoSecundario, textAlign: 'center' },
    lojaNome: { fontSize: 18, fontWeight: '600', color: cores.texto, marginLeft: 12, flexShrink: 1 },
    lojaAcoes: { flexDirection: 'row', gap: 8, marginLeft: 8 },
    botaoEditar: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: cores.primaria,
    },
    botaoEditarTexto: { color: cores.primaria, fontWeight: '600', fontSize: 13 },
    botaoExcluir: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: cores.perigo,
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
    modalBotoes: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBotao: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    modalBotaoCancelar: { backgroundColor: cores.borda },
    modalBotaoSalvar: { backgroundColor: cores.primaria },
    modalBotaoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}