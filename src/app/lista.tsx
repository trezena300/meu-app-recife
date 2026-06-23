import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  Alert, Pressable, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

type UnidadeSaude = {
  _id: number;
  nome_oficial: string;
  bairro: string;
  endereço: string;
  fone: string;
  horario: string;
  latitude: string;
  longitude: string;
};

type Coordenada = {
  latitude: number;
  longitude: number;
};

const URL_API =
  'https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=c901459f-f6c7-44dc-bdd5-dd4081e58e69&limit=100';

const URL_BACKEND = 'https://backend-recife.onrender.com/registros';

// Calcula a distância em km entre dois pontos usando a fórmula de Haversine
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Gera o HTML completo do mapa Leaflet com marcadores e rota
function gerarHtmlMapa(
  minhaLoc: Coordenada,
  unidades: UnidadeSaude[],
  maisProximaId: number,
  rotaCoordenadas: [number, number][]
): string {
  const unidadesJson = JSON.stringify(
    unidades
      .filter((u) => Number(u.latitude) && Number(u.longitude))
      .map((u) => ({
        id: u._id,
        nome: u.nome_oficial,
        bairro: u.bairro,
        lat: Number(u.latitude),
        lng: Number(u.longitude),
        maisProxima: u._id === maisProximaId,
      }))
  );

  const rotaJson = JSON.stringify(rotaCoordenadas);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-rotate@0.2.8/dist/leaflet-rotate-src.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Inicializa o mapa com suporte a rotação por dois dedos
    var map = L.map('map', {
      rotate: true,
      touchRotate: true,
      zoomControl: true,
      touchZoom: true,
    }).setView([${minhaLoc.latitude}, ${minhaLoc.longitude}], 13);

    // Carrega os tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marcador azul da localização do usuário
    var iconeUsuario = L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([${minhaLoc.latitude}, ${minhaLoc.longitude}], { icon: iconeUsuario })
      .addTo(map)
      .bindPopup('Você está aqui');

    // Adiciona marcadores para cada unidade de distribuição
    var unidades = ${unidadesJson};
    unidades.forEach(function(u) {
      var cor = u.maisProxima ? '#16a34a' : '#dc2626';
      var icone = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;background:' + cor + ';border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([u.lat, u.lng], { icon: icone })
        .addTo(map)
        .bindPopup('<b>' + u.nome + '</b><br>' + u.bairro)
        .on('click', function() {
          // Envia o id da unidade clicada de volta pro React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'selecionou', id: u.id }));
        });
    });

    // Desenha a rota até a unidade mais próxima
    var rota = ${rotaJson};
    if (rota.length > 0) {
      L.polyline(rota, { color: '#2563eb', weight: 4, opacity: 0.8 }).addTo(map);
    }
  </script>
</body>
</html>
  `;
}

export default function TelaLista() {
  const [minhaLocalizacao, setMinhaLocalizacao] = useState<Coordenada | null>(null);
  const [unidades, setUnidades] = useState<UnidadeSaude[]>([]);
  const [maisProxima, setMaisProxima] = useState<UnidadeSaude | null>(null);
  const [rota, setRota] = useState<[number, number][]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<UnidadeSaude | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [htmlMapa, setHtmlMapa] = useState('');

  useEffect(() => {
    inicializar();
  }, []);

  async function inicializar() {
    setCarregando(true);
    try {
      const [localizacao, dadosAPI] = await Promise.all([
        obterLocalizacao(),
        buscarUnidades(),
      ]);

      if (localizacao && dadosAPI.length > 0) {
        const proxima = encontrarMaisProxima(localizacao, dadosAPI);
        setMaisProxima(proxima);

        let coordenadasRota: [number, number][] = [];
        if (proxima) {
          coordenadasRota = await buscarRota(localizacao, {
            latitude: Number(proxima.latitude),
            longitude: Number(proxima.longitude),
          });
        }

        const html = gerarHtmlMapa(
          localizacao,
          dadosAPI,
          proxima?._id ?? -1,
          coordenadasRota
        );
        setHtmlMapa(html);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function obterLocalizacao(): Promise<Coordenada | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para mostrar o mapa.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coordenada = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMinhaLocalizacao(coordenada);
      return coordenada;
    } catch {
      return null;
    }
  }

  async function buscarUnidades(): Promise<UnidadeSaude[]> {
    try {
      const resposta = await fetch(URL_API);
      const json = await resposta.json();
      const registros = json.result.records;
      setUnidades(registros);
      return registros;
    } catch (e) {
      console.error('Erro ao buscar unidades:', e);
      return [];
    }
  }

  function encontrarMaisProxima(origem: Coordenada, lista: UnidadeSaude[]): UnidadeSaude | null {
    let menorDistancia = Infinity;
    let proxima: UnidadeSaude | null = null;
    for (const unidade of lista) {
      const lat = Number(unidade.latitude);
      const lng = Number(unidade.longitude);
      if (!lat || !lng) continue;
      const dist = calcularDistancia(origem.latitude, origem.longitude, lat, lng);
      if (dist < menorDistancia) {
        menorDistancia = dist;
        proxima = unidade;
      }
    }
    return proxima;
  }

  async function buscarRota(origem: Coordenada, destino: Coordenada): Promise<[number, number][]> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;
      const resposta = await fetch(url);
      const json = await resposta.json();
      if (json.routes && json.routes.length > 0) {
        return json.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );
      }
    } catch (e) {
      console.error('Erro ao buscar rota OSRM:', e);
    }
    return [];
  }

  function aoReceberMensagemDoMapa(event: any) {
    try {
      const dados = JSON.parse(event.nativeEvent.data);
      if (dados.tipo === 'selecionou') {
        const unidade = unidades.find((u) => u._id === dados.id);
        if (unidade) {
          setUnidadeSelecionada(unidade);
          setModalVisivel(true);
        }
      }
    } catch (e) {
      console.error('Erro ao processar mensagem do mapa:', e);
    }
  }

  async function salvarRegistro(item: UnidadeSaude) {
    setSalvandoId(item._id);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para salvar.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const corpo = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        nomeUnidade: item.nome_oficial,
        bairroUnidade: item.bairro,
        dadoConsumido: `Consultou: ${item.nome_oficial} (${item.bairro})`,
      };
      const resposta = await fetch(URL_BACKEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) throw new Error('Erro no backend: ' + resposta.status);
      Alert.alert('Salvo!', 'Registro salvo com sucesso no histórico.');
      setModalVisivel(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSalvandoId(null);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" />
          <Text style={styles.textoCarregando}>Carregando mapa e unidades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // SafeAreaView garante espaço pra barra de status do celular no topo
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* WebView renderizando o mapa Leaflet com OpenStreetMap */}
        {htmlMapa ? (
          <WebView
            style={styles.mapa}
            source={{ html: htmlMapa }}
            onMessage={aoReceberMensagemDoMapa}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
          />
        ) : (
          <View style={styles.centro}>
            <Text>Não foi possível carregar o mapa.</Text>
          </View>
        )}

        {/* Legenda da unidade mais próxima */}
        {maisProxima && (
          <View style={styles.legenda}>
            <Text style={styles.legendaTitulo}>🟢 Mais próxima:</Text>
            <Text style={styles.legendaNome}>{maisProxima.nome_oficial}</Text>
            <Text style={styles.legendaBairro}>{maisProxima.bairro}</Text>
          </View>
        )}

        {/* Modal com detalhes ao clicar no marcador */}
        <Modal
          visible={modalVisivel}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisivel(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView>
                {unidadeSelecionada && (
                  <>
                    <Text style={styles.modalTitulo}>{unidadeSelecionada.nome_oficial}</Text>
                    <Text>Bairro: {unidadeSelecionada.bairro}</Text>
                    <Text>Endereço: {unidadeSelecionada.endereço}</Text>
                    {unidadeSelecionada.horario ? (
                      <Text>Horário: {unidadeSelecionada.horario}</Text>
                    ) : null}
                    {unidadeSelecionada.fone ? (
                      <Text>Telefone: {unidadeSelecionada.fone}</Text>
                    ) : null}
                    <Pressable
                      onPress={() => salvarRegistro(unidadeSelecionada)}
                      disabled={salvandoId === unidadeSelecionada._id}
                      style={({ pressed }) => [styles.botaoSalvar, pressed && { opacity: 0.7 }]}
                    >
                      {salvandoId === unidadeSelecionada._id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.textoBotao}>Salvar minha localização aqui</Text>
                      )}
                    </Pressable>
                  </>
                )}
              </ScrollView>
              <Pressable onPress={() => setModalVisivel(false)} style={styles.botaoFechar}>
                <Text style={styles.textoBotao}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SafeAreaView garante espaço pra barra de status no topo
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { flex: 1 },
  mapa: { flex: 1 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  textoCarregando: { color: '#666', fontSize: 14 },
  legenda: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  legendaTitulo: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  legendaNome: { fontSize: 14, fontWeight: '600' },
  legendaBairro: { fontSize: 12, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitulo: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  botaoSalvar: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  botaoFechar: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  textoBotao: { color: '#fff', fontWeight: '600' },
});