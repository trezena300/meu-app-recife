import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Componente que define as abas de navegação do app
// Cada NativeTabs.Trigger corresponde a um arquivo em src/app/
export default function AppTabs() {
  const scheme = useColorScheme();
  // Aplica o tema claro ou escuro conforme a preferência do sistema
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
         {/* Aba inicial — captura de localização do usuário */}
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    {/* Aba de listagem — consome a API do Dados Recife */}
      <NativeTabs.Trigger name="lista">
        <NativeTabs.Trigger.Label>Unidades</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      {/* Aba de histórico — consome o backend próprio */}
      <NativeTabs.Trigger name="historico">
        <NativeTabs.Trigger.Label>Histórico</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}