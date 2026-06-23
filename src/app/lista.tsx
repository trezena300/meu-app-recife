import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
// Estrutura dos campos retornados pela API do Dados Recife

type UnidadeSaude = {
  _id: number;
  nome_oficial: string;
  bairro: string;
  endereço: string;
  fone: string;
  horario: string;
  como_usar: string;
  latitude: string;
  longitude: string;
};
// URL da API pública do Portal de Dados Abertos do Recife
// Dataset: Unidades de Distribuição de Preservativos
const URL_API =
  'https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=c901459f-f6c7-44dc-bdd5-dd4081e58e69';

// URL do backend próprio hospedado no Render
const URL_BACKEND = 'https://backend-recife.onrender.com/registros';

export default function TelaLista() {
  const [dados, setDados] = useState<UnidadeSaude[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Controla qual item está sendo salvo (para mostrar loading no botão correto)
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
 // Busca os dados da API do Recife ao montar o componente
  useEffect(() => {
    buscarDados();
  }, []);
// Faz a requisição GET para a API do Dados Recife e atualiza o estado
  async function buscarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch(URL_API);
      const json = await resposta.json();
      // Os registros ficam dentro de json.result.records (padrão CKAN)
      setDados(json.result.records);
    } catch (e) {
      setErro('Erro ao buscar dados da API do Recife.');
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }

  // Captura a localização atual do usuário e envia um POST para o backend
  // salvando o relacionamento entre a localização e a unidade consultada
  async function salvarRegistro(item: UnidadeSaude) {
    setSalvandoId(item._id);
    try {
       // Solicita permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para salvar.');
        return;
      }
      // Obtém as coordenadas GPS atuais

      const loc = await Location.getCurrentPositionAsync({});
// Monta o corpo da requisição POST com localização + dado consumido
      const corpo = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        nomeUnidade: item.nome_oficial,
        bairroUnidade: item.bairro,
        dadoConsumido: `Consultou: ${item.nome_oficial} (${item.bairro})`,
      };
      // Envia o POST para o backend próprio persistir o registro
      const resposta = await fetch(URL_BACKEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });

      if (!resposta.ok) {
        throw new Error('Backend retornou erro: ' + resposta.status);
      }

      Alert.alert('Salvo!', 'Registro salvo com sucesso no histórico.');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar. Verifique se o backend está rodando.');
    } finally {
      setSalvandoId(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text>{erro}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dados}
      keyExtractor={(item) => String(item._id)}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.nome}>{item.nome_oficial}</Text>
          <Text>Bairro: {item.bairro}</Text>
          <Text>Endereço: {item.endereço}</Text>
          {item.horario ? <Text>Horário: {item.horario}</Text> : null}
          {item.fone ? <Text>Telefone: {item.fone}</Text> : null}
        {/* Botão que salva a localização atual + unidade no backend */}
          <Pressable
            onPress={() => salvarRegistro(item)}
            disabled={salvandoId === item._id}
            style={({ pressed }) => [
              styles.botaoSalvar,
              pressed && styles.pressed,
            ]}
          >
            {salvandoId === item._id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.textoBotao}>Salvar minha localização aqui</Text>
            )}
          </Pressable>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.centro}>Nenhuma unidade encontrada.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#f2f2f2', padding: 12, borderRadius: 8, marginBottom: 10 },
  nome: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  botaoSalvar: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  textoBotao: { color: '#fff', fontWeight: '600' },
});