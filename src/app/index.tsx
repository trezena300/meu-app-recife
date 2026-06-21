import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function HomeScreen() {
  const [carregando, setCarregando] = useState(false);
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);

  // Pede permissão e captura a localização atual do usuário
  async function pegarLocalizacao() {
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para continuar.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacao({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Unidades de Distribuição{'\n'}de Preservativos - Recife
        </ThemedText>

        <Pressable onPress={pegarLocalizacao} style={({ pressed }) => [styles.botao, pressed && styles.pressed]}>
          <ThemedText type="link">Capturar minha localização</ThemedText>
        </Pressable>

        {carregando && <ActivityIndicator style={{ marginTop: 10 }} />}

        {localizacao && (
          <ThemedText type="small" style={styles.texto}>
            Lat: {localizacao.latitude.toFixed(5)} | Lng: {localizacao.longitude.toFixed(5)}
          </ThemedText>
        )}

        <ThemedText type="small" style={styles.dica}>
          Use as abas abaixo para ver as unidades e o histórico salvo.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: { textAlign: 'center', marginBottom: Spacing.three },
  botao: { padding: Spacing.three },
  pressed: { opacity: 0.6 },
  texto: { marginTop: Spacing.two },
  dica: { marginTop: Spacing.five, textAlign: 'center' },
});