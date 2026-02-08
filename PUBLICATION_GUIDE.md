# Guia de Publicação - Grupo Estuda

Este documento fornece instruções detalhadas para preparar e publicar o aplicativo Grupo Estuda nas lojas de aplicativos (App Store e Google Play).

## Visão Geral

O Grupo Estuda é um aplicativo móvel que funciona como um wrapper para a plataforma web de estudos em grupo. Ele foi desenvolvido com React Native e Expo, permitindo fácil publicação em múltiplas plataformas.

## Pré-requisitos

### Para iOS (App Store)
- Conta Apple Developer ($99/ano)
- Mac com Xcode instalado
- Certificados de desenvolvimento e distribuição
- Provisioning profiles
- App ID registrado na Apple

### Para Android (Google Play)
- Conta Google Play Developer ($25 única vez)
- Java Development Kit (JDK) instalado
- Android SDK
- Keystore para assinatura de APK

## Configuração Inicial

### 1. Atualizar Informações do App

O arquivo `app.config.ts` contém as informações principais do aplicativo:

```typescript
const env = {
  appName: "Grupo Estuda",
  appSlug: "grupo_estuda_app",
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028670003/QubgUOQdJrVVnbxG.png",
  scheme: schemeFromBundleId,
  iosBundleId: "space.manus.grupo_estuda_app.t20260108135320",
  androidPackage: "space.manus.grupo_estuda_app.t20260108135320",
};
```

**Importante:** O `appSlug` e `iosBundleId`/`androidPackage` devem ser únicos e não podem ser alterados após a primeira publicação.

### 2. Configurar Ícones

Os ícones já foram configurados nos seguintes locais:
- `assets/images/icon.png` - Ícone principal
- `assets/images/splash-icon.png` - Ícone de splash screen
- `assets/images/favicon.png` - Favicon web
- `assets/images/android-icon-foreground.png` - Ícone adaptativo Android

## Publicação no Google Play (Android)

### Passo 1: Criar Keystore para Assinatura

```bash
keytool -genkey -v -keystore grupo-estuda.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias grupo-estuda
```

Salve a senha e as informações do keystore em um local seguro.

### Passo 2: Configurar Expo para Assinatura

Adicione as informações do keystore ao `app.config.ts`:

```typescript
android: {
  adaptiveIcon: {
    backgroundColor: "#E6F4FE",
    foregroundImage: "./assets/images/android-icon-foreground.png",
  },
  signingConfig: "release",
}
```

### Passo 3: Gerar Build

```bash
eas build --platform android --type apk
```

Ou para gerar um AAB (Android App Bundle) para publicação:

```bash
eas build --platform android --type app-bundle
```

### Passo 4: Publicar no Google Play

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo aplicativo
3. Preencha as informações:
   - Nome do aplicativo: "Grupo Estuda"
   - Descrição breve
   - Descrição completa
   - Screenshots (mínimo 2, máximo 8)
   - Ícone do aplicativo (512x512 px)
   - Imagem de recurso (1024x500 px)
4. Configure a classificação de conteúdo
5. Defina preço (gratuito)
6. Envie o AAB gerado
7. Revise e publique

## Publicação na App Store (iOS)

### Passo 1: Criar App ID

1. Acesse [Apple Developer](https://developer.apple.com)
2. Vá para "Certificates, Identifiers & Profiles"
3. Crie um novo App ID com o identificador: `space.manus.grupo_estuda_app.t20260108135320`

### Passo 2: Gerar Build

```bash
eas build --platform ios --type app-store
```

### Passo 3: Publicar na App Store

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie um novo aplicativo
3. Preencha as informações:
   - Nome: "Grupo Estuda"
   - Descrição
   - Palavras-chave
   - Categoria: "Educação"
   - Screenshots (mínimo 2, máximo 5 por dispositivo)
   - Ícone do aplicativo (1024x1024 px)
4. Configure a classificação de conteúdo
5. Defina preço (gratuito)
6. Envie o build gerado
7. Revise e submeta para aprovação

## Informações de Publicação

### Descrição do Aplicativo

**Título:** Grupo Estuda

**Descrição Breve:**
Plataforma colaborativa de estudos em grupo para melhorar seu aprendizado.

**Descrição Completa:**
Grupo Estuda é uma plataforma inovadora que conecta estudantes para aprender juntos. Com ferramentas colaborativas e recursos educacionais, facilitamos a formação de grupos de estudo eficazes e produtivos. Junte-se a milhares de estudantes que já estão transformando sua forma de aprender.

### Palavras-chave
- Estudos em grupo
- Educação
- Colaboração
- Aprendizado
- Plataforma educacional

### Categoria
- Educação

### Classificação de Conteúdo
- Apropriado para todas as idades

## Atualizações Futuras

Para publicar atualizações:

1. Atualize a versão em `app.config.ts`:
   ```typescript
   version: "1.0.1",
   ```

2. Gere novo build:
   ```bash
   eas build --platform android --type app-bundle
   eas build --platform ios --type app-store
   ```

3. Envie os novos builds para as respectivas lojas

## Troubleshooting

### Erro: "Bundle ID já existe"
- Verifique se o `iosBundleId` é único
- Consulte a documentação do Expo EAS Build

### Erro: "Certificado expirado"
- Renove os certificados na Apple Developer
- Configure novamente no Expo

### Erro: "Keystore não encontrado"
- Verifique o caminho do arquivo keystore
- Certifique-se de que a senha está correta

## Recursos Adicionais

- [Documentação Expo EAS Build](https://docs.expo.dev/eas-update/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## Suporte

Para dúvidas sobre o processo de publicação, consulte:
- Documentação oficial do Expo
- Comunidade Expo no Discord
- Suporte Apple Developer
- Suporte Google Play Console
