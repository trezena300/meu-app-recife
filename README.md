# App - Unidades de Distribuição de Preservativos (Recife)

Aplicativo mobile desenvolvido em React Native (Expo) que consome dados
abertos da Prefeitura do Recife sobre Unidades de Distribuição de
Preservativos, captura a localização do usuário e persiste esse histórico
em um backend próprio.

## Sobre a atividade

Trabalho individual da disciplina [nome da disciplina/Senac], com o
objetivo de demonstrar habilidades de desenvolvimento em React Native,
integração com APIs de dados abertos e uso de geolocalização.

## Por que essa API?

A API de **Unidades de Distribuição de Preservativos** foi escolhida por
ser um dado de saúde pública relevante, já vir com latitude/longitude
prontas (permitindo cruzamento direto com geolocalização) e por ter
estrutura de dados simples, ideal para exibição em lista mobile.

Fonte: [Portal de Dados Abertos do Recife](https://dados.recife.pe.gov.br/dataset/unidades-de-distribuicao-de-preservativos)

## Funcionalidades

- Captura da localização atual do usuário (`expo-location`)
- Listagem das unidades de distribuição, consumindo a API do Dados Recife
- Botão para salvar a localização do usuário junto com a unidade consultada
- Histórico dos registros salvos, consultado a partir do backend próprio

## Estrutura do projeto
src/

app/

_layout.tsx       # Configura a navegação por abas (NativeTabs)

index.tsx         # Tela inicial - captura de localização

lista.tsx         # Tela de listagem - consome API do Dados Recife

historico.tsx     # Tela de histórico - consome o backend próprio

components/

app-tabs.tsx       # Componente de configuração das abas

...                # Componentes visuais (Themed*, etc.) do template Expo

constants/

hooks/

## Tecnologias

- React Native + Expo
- Expo Router (navegação por arquivo, com abas nativas)
- expo-location (geolocalização)
- TypeScript

## API consumida

- **Dados Recife**: `https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=c901459f-f6c7-44dc-bdd5-dd4081e58e69`
- **Backend próprio**: ver repositório [backend-recife](LINK_DO_OUTRO_REPO_AQUI)

## Como rodar localmente

### Pré-requisitos
- Node.js instalado
- App **Expo Go** instalado no celular (Android/iOS)
- Celular e computador na mesma rede Wi-Fi

### Passos

```bash
npm install
npx expo start
```

Escaneie o QR code exibido no terminal com o app Expo Go.

### Configuração da URL do backend

Antes de testar a tela de Histórico e o botão "Salvar", configure a URL
do backend nos arquivos `src/app/lista.tsx` e `src/app/historico.tsx`,
substituindo:

```ts
const URL_BACKEND = 'http://SEU_IP_OU_URL_AQUI:8081/registros';
```

- Para teste local: use o IP da sua máquina na rede (`ipconfig` no Windows)
- Para produção: use a URL pública do backend hospedado no Render

> O backend precisa estar rodando para que as telas de "Lista" (salvar)
> e "Histórico" (listar) funcionem corretamente.

## Autor

[Seu nome aqui] — Projeto individual, Senac
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
