# Guia de Build e Publicação - Grupo Estuda

Este documento fornece instruções passo a passo para preparar, fazer build e publicar o aplicativo Grupo Estuda nas lojas de aplicativos.

## Pré-requisitos

### Ferramentas Necessárias

1. **Node.js e npm/pnpm** - Já instalados
2. **Expo CLI** - Instale com: `npm install -g expo-cli`
3. **EAS CLI** - Instale com: `npm install -g eas-cli`

### Contas Necessárias

- **Expo Account** - Crie em https://expo.dev
- **Apple Developer Account** ($99/ano) - Para publicação em iOS
- **Google Play Developer Account** ($25 uma vez) - Para publicação em Android

## Passo 1: Configurar Expo Account

```bash
# Fazer login na Expo
eas login

# Verificar login
eas whoami
```

## Passo 2: Configurar o Projeto para Publicação

### 2.1 Atualizar versão do app

Edite `app.config.ts`:

```typescript
const config: ExpoConfig = {
  version: "1.0.0",  // Atualize conforme necessário
  // ... resto da configuração
};
```

### 2.2 Configurar eas.json

O arquivo `eas.json` já está configurado com os perfis básicos:
- **development**: Para testes locais
- **preview**: Para testes antes da publicação
- **production**: Para publicação nas lojas

## Passo 3: Fazer Build para iOS

### 3.1 Preparar para iOS

```bash
# Instalar dependências
pnpm install

# Limpar cache
eas build --platform ios --clear-cache
```

### 3.2 Gerar Build para App Store

```bash
# Build para produção (App Store)
eas build --platform ios --type app-store

# Ou build para teste (TestFlight)
eas build --platform ios --type preview
```

O processo levará alguns minutos. Você pode acompanhar o progresso no dashboard do Expo.

### 3.3 Fazer Download do Build

Após a conclusão, você receberá um link para fazer download do `.ipa` (para TestFlight) ou será enviado diretamente para o App Store Connect.

## Passo 4: Fazer Build para Android

### 4.1 Gerar Keystore (primeira vez apenas)

```bash
# Gerar keystore para assinatura
keytool -genkey -v -keystore grupo-estuda.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias grupo-estuda

# Salve a senha em local seguro!
```

### 4.2 Gerar Build para Google Play

```bash
# Build para produção (Google Play)
eas build --platform android --type app-bundle

# Ou build para teste (APK)
eas build --platform android --type apk
```

### 4.3 Fazer Download do Build

Após a conclusão, você receberá um link para fazer download do `.aab` (Android App Bundle) ou `.apk`.

## Passo 5: Publicar no App Store (iOS)

### 5.1 Preparar no App Store Connect

1. Acesse https://appstoreconnect.apple.com
2. Clique em "My Apps"
3. Clique em "+"
4. Selecione "New App"
5. Preencha os detalhes:
   - **Platform**: iOS
   - **Name**: Grupo Estuda
   - **Primary Language**: Portuguese (Brazil)
   - **Bundle ID**: space.manus.grupo_estuda_app.t20260108135320
   - **SKU**: grupo-estuda-001
   - **User Access**: Full Access

### 5.2 Preencher Informações do App

1. **App Information**
   - Category: Education
   - Subcategory: (deixe em branco ou selecione apropriado)

2. **Pricing and Availability**
   - Price Tier: Free
   - Availability: Selecione todos os países

3. **App Preview and Screenshots**
   - Adicione screenshots (mínimo 2, máximo 5 por dispositivo)
   - Tamanho recomendado: 1170 x 2532 px (iPhone)
   - Adicione preview video (opcional)

4. **Description**
   - **Description**: "Plataforma colaborativa de estudos em grupo para melhorar seu aprendizado."
   - **Keywords**: estudos, educação, grupo, aprendizado, colaboração
   - **Support URL**: https://study-group-boost.lovable.app
   - **Privacy Policy URL**: (adicione se disponível)

5. **General App Information**
   - **App Icon**: 1024 x 1024 px
   - **Rating**: Selecione "None" para todas as categorias

### 5.3 Enviar Build

1. Vá para "Builds"
2. Selecione o build que você fez com EAS
3. Clique em "Select Build"
4. Preencha "Build Number"
5. Clique em "Submit for Review"

## Passo 6: Publicar no Google Play (Android)

### 6.1 Preparar no Google Play Console

1. Acesse https://play.google.com/console
2. Clique em "Create app"
3. Preencha os detalhes:
   - **App name**: Grupo Estuda
   - **Default language**: Portuguese (Brazil)
   - **App or game**: App
   - **Free or paid**: Free

### 6.2 Preencher Informações do App

1. **App details**
   - **Short description**: Plataforma colaborativa de estudos em grupo
   - **Full description**: "Grupo Estuda é uma plataforma inovadora que conecta estudantes para aprender juntos. Com ferramentas colaborativas e recursos educacionais, facilitamos a formação de grupos de estudo eficazes e produtivos."
   - **App icon**: 512 x 512 px
   - **Feature graphic**: 1024 x 500 px

2. **Screenshots**
   - Adicione mínimo 2 screenshots
   - Tamanho: 1080 x 1920 px (portrait)

3. **Content rating**
   - Preencha o questionário de classificação de conteúdo
   - Selecione "Everyone" se apropriado

4. **Target audience**
   - Selecione a faixa etária apropriada

### 6.3 Enviar Build

1. Vá para "Release" > "Production"
2. Clique em "Create new release"
3. Faça upload do `.aab` (Android App Bundle)
4. Revise as permissões solicitadas
5. Clique em "Review release"
6. Clique em "Start rollout to Production"

## Passo 7: Monitorar Publicação

### Para iOS
- A revisão geralmente leva 24-48 horas
- Você receberá notificações por email
- Após aprovação, o app estará disponível na App Store em poucas horas

### Para Android
- A revisão geralmente é mais rápida (algumas horas)
- Você pode acompanhar o status no Google Play Console
- Após aprovação, o app estará disponível no Google Play em poucas horas

## Passo 8: Atualizações Futuras

### Para atualizar o app:

1. Atualize a versão em `app.config.ts`:
   ```typescript
   version: "1.0.1",
   ```

2. Faça commit das mudanças:
   ```bash
   git add .
   git commit -m "Versão 1.0.1"
   ```

3. Faça novo build:
   ```bash
   eas build --platform ios --type app-store
   eas build --platform android --type app-bundle
   ```

4. Siga os passos 5 e 6 novamente com o novo build

## Troubleshooting

### Erro: "Bundle ID já existe"
- Verifique se o Bundle ID é único
- Consulte o App Store Connect para confirmar

### Erro: "Certificado expirado"
- Renove os certificados na Apple Developer
- Reconfigure no Expo EAS

### Erro: "Keystore não encontrado"
- Certifique-se de que o arquivo keystore está no diretório correto
- Verifique a senha do keystore

### Build falha com erro de dependências
```bash
# Limpe o cache e reinstale
rm -rf node_modules
pnpm install
eas build --platform [ios|android] --clear-cache
```

## Recursos Adicionais

- [Documentação Expo EAS Build](https://docs.expo.dev/eas-update/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Google Material Design Guidelines](https://material.io/design/)

## Checklist de Publicação

- [ ] Versão atualizada em `app.config.ts`
- [ ] Ícones e screenshots preparados
- [ ] Descrição do app revisada
- [ ] Política de privacidade preparada (se necessário)
- [ ] Build iOS gerado com sucesso
- [ ] Build Android gerado com sucesso
- [ ] App Store Connect configurado
- [ ] Google Play Console configurado
- [ ] Build iOS enviado para revisão
- [ ] Build Android enviado para revisão
- [ ] Aprovação recebida (iOS)
- [ ] Aprovação recebida (Android)
- [ ] App disponível nas lojas

## Suporte

Para dúvidas sobre o processo de publicação:
- Consulte a documentação oficial do Expo
- Visite o fórum da comunidade Expo
- Contate o suporte Apple Developer
- Contate o suporte Google Play Console
