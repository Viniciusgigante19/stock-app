import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarLojas, criarLoja, excluirLoja, type Loja } from '@/db/lojas';

export default function LojasScreen() {
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
      <Text style={styles.titulo}>Lojas</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nome da loja (ex: Nagumo 57)"
          placeholderTextColor="#888"
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
  lojaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lojaNomeArea: { flex: 1 },
  lojaNome: { fontSize: 20, fontWeight: '600', color: '#fff' },
  botaoExcluir: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#7f1d1d',
    marginLeft: 12,
  },
  botaoExcluirTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
});