import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, Modal, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listarCategorias,
  criarCategoria,
  renomearCategoria,
  excluirCategoria,
  moverCategoria,
  type Categoria,
} from '@/db/categorias';
import { useAppTheme, type Cores } from '@/contexts/theme-context';

export default function CategoriasScreen() {
  const { cores } = useAppTheme();
  const styles = useMemo(() => criarEstilos(cores), [cores]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nomeNova, setNomeNova] = useState('');

  const [modalRenomearVisivel, setModalRenomearVisivel] = useState(false);
  const [categoriaRenomeando, setCategoriaRenomeando] = useState<Categoria | null>(null);
  const [nomeRenomear, setNomeRenomear] = useState('');

  const carregar = useCallback(async () => {
    setCategorias(await listarCategorias());
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function handleAdicionar() {
    const nome = nomeNova.trim();
    if (!nome) return;
    try {
      await criarCategoria(nome);
      setNomeNova('');
      carregar();
    } catch {
      Alert.alert('Erro', 'Já existe uma categoria com esse nome.');
    }
  }

  function abrirModalRenomear(cat: Categoria) {
    setCategoriaRenomeando(cat);
    setNomeRenomear(cat.nome);
    setModalRenomearVisivel(true);
  }

  async function handleConfirmarRenomear() {
    const nome = nomeRenomear.trim();
    if (!nome || !categoriaRenomeando) return;
    await renomearCategoria(categoriaRenomeando.id, nome);
    setModalRenomearVisivel(false);
    setCategoriaRenomeando(null);
    carregar();
  }

  function handleExcluir(cat: Categoria) {
    Alert.alert(
      'Excluir categoria',
      `Excluir "${cat.nome}"? As subcategorias dela também serão excluídas. Produtos ficam sem categoria.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await excluirCategoria(cat.id);
            carregar();
          },
        },
      ]
    );
  }

  async function handleMover(cat: Categoria, direcao: 'cima' | 'baixo') {
    await moverCategoria(cat.id, direcao);
    carregar();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.titulo}>Categorias</Text>
      <Text style={styles.subtitulo}>
        Essa ordem define como os produtos aparecem organizados dentro de cada loja.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome da categoria (ex: Pães)"
          placeholderTextColor={cores.placeholder}
          value={nomeNova}
          onChangeText={setNomeNova}
          onSubmitEditing={handleAdicionar}
          returnKeyType="done"
        />
        <Pressable style={styles.botaoAdicionar} onPress={handleAdicionar}>
          <Text style={styles.botaoAdicionarTexto}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={categorias}
        style={{ flex: 1 }}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma categoria ainda. Adicione uma acima.</Text>
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
                style={[styles.botaoSeta, index === categorias.length - 1 && styles.botaoSetaDesabilitado]}
                disabled={index === categorias.length - 1}
                onPress={() => handleMover(item, 'baixo')}
              >
                <Text style={styles.botaoSetaTexto}>▼</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.nomeArea}
              onPress={() => router.push(`/subcategorias/${item.id}`)}
            >
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.verSubcategorias}>Ver subcategorias ›</Text>
            </Pressable>

            <View style={styles.acoes}>
              <Pressable style={styles.botaoAcao} onPress={() => abrirModalRenomear(item)}>
                <Text style={styles.botaoAcaoTexto}>Renomear</Text>
              </Pressable>
              <Pressable style={[styles.botaoAcao, styles.botaoExcluir]} onPress={() => handleExcluir(item)}>
                <Text style={styles.botaoExcluirTexto}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={modalRenomearVisivel} animationType="fade" transparent>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Renomear categoria</Text>
            <TextInput
              style={styles.modalInput}
              value={nomeRenomear}
              onChangeText={setNomeRenomear}
              placeholder="Nome da categoria"
              placeholderTextColor={cores.placeholder}
              autoFocus
            />
            <View style={styles.modalBotoes}>
              <Pressable
                style={[styles.modalBotao, styles.modalBotaoCancelar]}
                onPress={() => setModalRenomearVisivel(false)}
              >
                <Text style={styles.modalBotaoTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBotao, styles.modalBotaoSalvar]}
                onPress={handleConfirmarRenomear}
              >
                <Text style={styles.modalBotaoTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 14, backgroundColor: cores.fundo },
    titulo: { fontSize: 24, fontWeight: '700', color: cores.texto, marginTop: 8 },
    subtitulo: { fontSize: 13, color: cores.textoSecundario, marginTop: 4, marginBottom: 16 },
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
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    setas: { marginRight: 10 },
    botaoSeta: { width: 28, height: 22, justifyContent: 'center', alignItems: 'center' },
    botaoSetaDesabilitado: { opacity: 0.25 },
    botaoSetaTexto: { color: cores.texto, fontSize: 12 },
    nomeArea: { flex: 1 },
    nome: { fontSize: 17, fontWeight: '600', color: cores.texto },
    verSubcategorias: { fontSize: 12, color: cores.primaria, marginTop: 2 },
    acoes: { flexDirection: 'row', gap: 6 },
    botaoAcao: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: cores.borda,
    },
    botaoAcaoTexto: { color: cores.texto, fontSize: 12, fontWeight: '600' },
    botaoExcluir: { backgroundColor: cores.perigo, borderColor: cores.perigo },
    botaoExcluirTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
    vazio: { textAlign: 'center', marginTop: 40, color: cores.textoSecundario, fontSize: 15 },
    modalFundo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalConteudo: {
      backgroundColor: cores.fundoCartao,
      borderRadius: 14,
      padding: 20,
      width: '100%',
    },
    modalTitulo: { fontSize: 18, fontWeight: '700', color: cores.texto, marginBottom: 14 },
    modalInput: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: cores.texto,
      marginBottom: 16,
    },
    modalBotoes: { flexDirection: 'row', gap: 10 },
    modalBotao: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBotaoCancelar: { backgroundColor: cores.borda },
    modalBotaoSalvar: { backgroundColor: cores.primaria },
    modalBotaoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}