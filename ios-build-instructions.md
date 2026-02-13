# 🍎 Build iOS - Grupo Estuda

## Instruções Detalhadas para App Store

### 📋 Pré-requisitos
- ✅ macOS com Xcode 14+ instalado
- ✅ Apple Developer Account ($99/ano)
- ✅ Node.js 16+ e npm

### 🔧 Configuração do Projeto

1. **Clone e prepare o projeto:**
```bash
git clone [seu-repo-github]
cd study-group-boost
npm install
```

2. **Adicione a plataforma iOS:**
```bash
npx cap add ios
```

3. **Build do projeto web:**
```bash
npm run build
npx cap sync ios
```

### 🏗️ Configuração no Xcode

4. **Abra no Xcode:**
```bash
npx cap open ios
```

5. **Configurações do Projeto:**
   - **Bundle Identifier**: `com.grupoestuda.app`
   - **Display Name**: `Grupo Estuda`
   - **Version**: `1.0.0`
   - **Build**: `1`
   - **Deployment Target**: iOS 13.0+

### 📱 Configurações Específicas iOS

**Info.plist - Permissões:**
```xml
<key>NSCameraUsageDescription</key>
<string>Para adicionar fotos ao seu perfil</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Para selecionar fotos da galeria</string>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 🎨 Assets Configurados

**App Icons (já incluídos):**
- ✅ 1024x1024 (App Store)
- ✅ Todos os tamanhos necessários gerados automaticamente

**Launch Screen:**
- ✅ Configurado com cores do tema
- ✅ Splash screen de 3 segundos

### 🔐 Certificados e Provisioning

1. **No Apple Developer Portal:**
   - Crie App ID: `com.grupoestuda.app`
   - Configure certificados de desenvolvimento/distribuição
   - Crie provisioning profiles

2. **No Xcode:**
   - Signing & Capabilities > Team: [Sua equipe]
   - Automatically manage signing: ✅

### 🚀 Build para App Store

3. **Archive do projeto:**
   - Product > Archive
   - Aguarde o build completar
   - Window > Organizer para ver archives

4. **Upload via Xcode:**
   - Distribute App > App Store Connect
   - Upload para revisão da Apple

### 📊 App Store Connect

**Informações necessárias:**
- **Nome**: Grupo Estuda
- **Subtítulo**: Estude em grupo
- **Categoria**: Educação
- **Classificação**: 4+ (Adequado para todas as idades)
- **Preço**: Gratuito (com compras no app)

**Descrição:**
```
Grupo Estuda é o aplicativo perfeito para estudantes que querem manter o foco e alcançar suas metas acadêmicas.
...
Junte-se a milhares de estudantes que já usam o Grupo Estuda para organizar seus estudos e manter a motivação sempre alta!
```

### 🖼️ Screenshots Necessários

**iPhone (obrigatório):**
- 📱 6.7" (iPhone 14 Pro Max): 1290x2796
- 📱 6.5" (iPhone 11 Pro Max): 1242x2688
- 📱 5.5" (iPhone 8 Plus): 1242x2208

**iPad (recomendado):**
- 📱 12.9" (iPad Pro): 2048x2732
- 📱 11" (iPad Pro): 1668x2388

### ⚡ Otimizações iOS

**Performance:**
- ✅ Bundle size otimizado
- ✅ Lazy loading implementado
- ✅ Cache inteligente
- ✅ Transições suaves

**Funcionalidades nativas:**
- ✅ Haptic feedback
- ✅ Notificações push
- ✅ Background app refresh
- ✅ Compartilhamento nativo

### 🔍 Checklist Pré-Upload

Antes de enviar para revisão:
- [ ] Testar em iPhone e iPad
- [ ] Verificar todas as transições
- [ ] Validar fluxos de compra in-app
- [ ] Testar notificações
- [ ] Verificar funcionamento offline
- [ ] Testar rotação de tela
- [ ] Validar acessibilidade (VoiceOver)

### 📋 Revisão da Apple

**Tempo estimado:** 7 dias úteis

**Principais critérios:**
- ✅ Funcionalidade completa
- ✅ Design consistente
- ✅ Performance adequada
- ✅ Conformidade com diretrizes

### 📞 Suporte

**Problemas comuns:**
- Build failed: Limpar derived data
- Certificado inválido: Renovar no Developer Portal
- Provisioning error: Verificar bundle ID

---

## ✅ Status: PRONTO PARA APP STORE

O projeto está configurado e otimizado para Apple App Store.