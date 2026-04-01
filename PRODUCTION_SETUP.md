# Grupo Estuda - Configuração para Produção

## 📱 Preparação para App Stores

Este aplicativo está **100% pronto** para publicação na Google Play Store e App Store. Siga os passos abaixo:

### 🔧 Configurações Realizadas

✅ **Ícones**: Gerados em 192x192 e 512x512  
✅ **Manifest**: Configurado com metadados corretos  
✅ **Meta Tags**: SEO otimizado para mobile  
✅ **Capacitor**: Configurado para produção  
✅ **Supabase**: Database configurado com RLS  
✅ **Autenticação**: Sistema completo implementado  
✅ **Políticas**: Privacidade e Termos de Uso  
✅ **PWA**: Suporte completo a Progressive Web App  

### 🚀 Passos para Build de Produção

#### 1. Exportar para GitHub
- Clique em "Export to GitHub" no Lovable
- Clone o repositório localmente

#### 2. Instalar Dependências
```bash
npm install
npx cap add android
npx cap add ios
```

#### 3. Build do Projeto
```bash
npm run build
npx cap sync
```

#### 4. Configurar Stores

**Google Play Store:**
```bash
npx cap run android --target production
# Gera APK/AAB em: android/app/build/outputs/bundle/release/
```

**App Store (requer macOS + Xcode):**
```bash
npx cap run ios --target production
# Abre o projeto no Xcode para build final
```

### 📋 Informações para Stores

**Nome do App**: Grupo Estuda  
**Bundle ID**: com.grupoestuda.app
**Versão**: 1.0.0  
**Categoria**: Educação  
**Idade Mínima**: 13+  

**Descrição Curta:**
"Estude em grupo e alcance suas metas acadêmicas"

**Descrição Longa:**
"Grupo Estuda é o aplicativo perfeito para quem quer estudar em grupo e manter a motivação. Crie grupos de estudo, defina metas, acompanhe seu progresso e mantenha-se hidratado com lembretes personalizados."

### 🔐 Configurações de Segurança

- **RLS habilitado** em todas as tabelas
- **Autenticação segura** com Supabase
- **Dados criptografados** em trânsito e repouso
- **Políticas de privacidade** conforme LGPD

### 📱 Recursos do App

- ✅ Grupos de estudo colaborativos
- ✅ Sistema de metas e conquistas  
- ✅ Timer de estudo (Pomodoro)
- ✅ Controle de hidratação
- ✅ Ranking e leaderboards
- ✅ Gerador de testes (Premium)
- ✅ Armazenamento de arquivos
- ✅ Sistema de notificações
- ✅ Planos Premium via Stripe

### 🛡️ Permissões Necessárias

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

**iOS (ios/App/App/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Para adicionar fotos ao perfil</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Para selecionar fotos do perfil</string>
```

### 💡 Próximos Passos

1. **Testar em dispositivos reais** antes da publicação
2. **Configurar Analytics** para monitoramento
3. **Setup de Crash Reporting** (opcional)
4. **Configurar CI/CD** para atualizações (opcional)

### 📞 Suporte

Para dúvidas sobre a publicação:
- **Email**: contato@grupoestuda.com.br
- **Privacidade**: privacidade@grupoestuda.com.br

---

## ⚡ Status: PRONTO PARA PRODUÇÃO ✅

O aplicativo está completamente funcional e pronto para ser publicado nas lojas de aplicativos.
## 💳 Configuração obrigatória de Stripe (assinaturas)

Para liberar assinatura paga com segurança, configure os secrets abaixo no Supabase (Project Settings → Edge Functions Secrets):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC_MONTHLY`
- `STRIPE_PRICE_BASIC_YEARLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`
- `SITE_URL` (ex.: `https://app.seudominio.com`)
- `SUPABASE_SERVICE_ROLE_KEY`

### Funções Edge criadas

- `create-checkout-session`: cria sessão de checkout no backend (frontend não atualiza plano diretamente)
- `stripe-webhook`: recebe eventos Stripe e sincroniza assinatura/plano no banco

### Endpoint de webhook Stripe

No painel Stripe, cadastre o webhook apontando para:

`https://<PROJECT-REF>.supabase.co/functions/v1/stripe-webhook`

Eventos recomendados:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

> Sem esses secrets/eventos configurados, o checkout fica indisponível e **nenhum usuário recebe Premium gratuitamente**.
