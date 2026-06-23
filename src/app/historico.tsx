import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

// Nomes batendo com o RegistroResponse.java (camelCase)
type Registro = {
  id: number;
  latitude: number;
  longitude: number;
  nomeUnidade: string;
  bairroUnidade: string;
  dadoConsumido: string;
  criadoEm: string;
  
};

const URL_BACKEND = 'https://backend-recife.onrender.com/registros';

export default function TelaHistorico() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function buscarHistorico() {
    setCarregando(true);
    try {
      const resposta = await fetch(URL_BACKEND);
      const json = await resposta.json();
      setRegistros(json);
    } catch (e) {
      console.error('Erro ao buscar histórico:', e);
    } finally {
      setCarregando(false);
    }
  }

  // Recarrega os dados toda vez que essa aba ganha foco
  // (ao entrar nela pela primeira vez OU ao voltar depois de sair)
  useFocusEffect(
    useCallback(() => {
      buscarHistorico();
    }, [])
  );

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={registros}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={buscarHistorico} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.nome}>{item.nomeUnidade}</Text>
          <Text>Bairro: {item.bairroUnidade}</Text>
          <Text>Lat: {item.latitude.toFixed(5)} | Lng: {item.longitude.toFixed(5)}</Text>
          <Text style={styles.data}>{new Date(item.criadoEm).toLocaleString('pt-BR')}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.centro}>Nenhum registro salvo ainda.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#eef6ff', padding: 12, borderRadius: 8, marginBottom: 10 },
  nome: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  data: { fontSize: 12, color: '#666', marginTop: 4 },
});