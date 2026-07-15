# Grupo Estuda - Configuração para Produção

## 📱 Preparação para App Stores

O aplicativo está funcional e configurado para builds Android/iOS, **mas há um pré-requisito pendente antes de publicar cobrando: a integração de pagamento** (veja "Pendências" abaixo). Siga os passos abaixo:

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
- ⚠️ Planos Premium — **pagamento ainda não integrado** (botão exibe "em breve")

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

### ⚠️ Pendências antes de publicar

1. **Integração de pagamento (bloqueador para cobrar Premium)**
   - Apps nas lojas: Google Play Billing / Apple In-App Purchase são **obrigatórios** para assinaturas digitais (Stripe puro pode causar rejeição do app)
   - Web: Stripe Checkout + webhook em Edge Function
   - A concessão do plano deve ser feita pelo servidor (service role) — o banco já bloqueia upgrades vindos do cliente
2. **Configurar secrets das Edge Functions**: `OPENAI_API_KEY` e `CRON_SECRET` (os crons de `water-reminder` e `check-leaderboard-changes` devem enviar o header `x-cron-secret`)
3. **Aplicar as migrations pendentes** no projeto Supabase (`supabase db push`), incluindo a proteção da coluna `plan`

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

## ⚡ Status: FUNCIONAL — PENDENTE INTEGRAÇÃO DE PAGAMENTO ⚠️

O aplicativo está completamente funcional. Antes de publicar nas lojas cobrando o plano Premium, conclua a integração de pagamento e as pendências listadas acima.