import { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarLojas, criarLoja, excluirLoja, type Loja } from '@/db/lojas';
import { useAppTheme, type Cores } from '@/contexts/theme-context';

const MARGEM_TOPO_EXTRA = 14;

export default function LojasScreen() {
  const { cores, modo, alternarTema } = useAppTheme();
  const styles = useMemo(() => criarEstilos(cores), [cores]);

  const [lojas, setLojas] = useState<Loja[]>([]);
  const [nomeNovaLoja, setNomeNovaLoja] = useState('');

  const carregarLojas = useCallback(async () => {
    const dados = await listarLojas();
    setLojas(dados);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarLojas();
    }, [carregarLojas])
  );

  async function handleAdicionarLoja() {
    const nome = nomeNovaLoja.trim();
    if (!nome) return;
    try {
      await criarLoja(nome);
      setNomeNovaLoja('');
      carregarLojas();
    } catch (err) {
      Alert.alert('Erro', 'Já existe uma loja com esse nome.');
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Lojas</Text>
        <Pressable style={styles.botaoTema} onPress={alternarTema}>
          <Text style={styles.botaoTemaTexto}>{modo === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}</Text>
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome da Loja Cliente"
          placeholderTextColor={cores.placeholder}
          value={nomeNovaLoja}
          onChangeText={setNomeNovaLoja}
          onSubmitEditing={handleAdicionarLoja}
          returnKeyType="done"
        />
        <Pressable style={styles.botaoAdicionar} onPress={handleAdicionarLoja}>
          <Text style={styles.botaoAdicionarTexto}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={lojas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhuma loja cadastrada ainda. Adicione uma acima.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.lojaItem}>
            <Pressable style={styles.lojaNomeArea} onPress={() => router.push(`/loja/${item.id}`)}>
              <Text style={styles.lojaNome}>{item.nome}</Text>
            </Pressable>
            <Pressable style={styles.botaoExcluir} onPress={() => handleExcluirLoja(item)}>
              <Text style={styles.botaoExcluirTexto}>Excluir</Text>
            </Pressable>
          </View>
        )}
      />
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
    lojaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    lojaNomeArea: { flex: 1 },
    lojaNome: { fontSize: 20, fontWeight: '600', color: cores.texto },
    botaoExcluir: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: cores.perigo,
      marginLeft: 12,
    },
    botaoExcluirTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
    vazio: { textAlign: 'center', marginTop: 40, color: cores.textoSecundario, fontSize: 16 },
  });
}