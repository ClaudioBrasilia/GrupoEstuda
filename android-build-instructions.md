# 🤖 Build Android - Grupo Estuda

## Instruções Detalhadas para Google Play Store

### 📋 Pré-requisitos
- ✅ Android Studio instalado
- ✅ Java JDK 8 ou superior  
- ✅ Node.js 16+ e npm

### 🔧 Configuração do Projeto

1. **Clone e prepare o projeto:**
```bash
git clone [seu-repo-github]
cd study-group-boost
npm install
```

2. **Adicione a plataforma Android:**
```bash
npx cap add android
```

3. **Build do projeto web:**
```bash
npm run build
npx cap sync android
```

### 🏗️ Geração do APK/AAB

4. **Abra no Android Studio:**
```bash
npx cap open android
```

5. **Configure o Build:**
   - Vá em `Build > Generate Signed Bundle / APK`
   - Escolha `Android App Bundle (AAB)` para Google Play
   - Ou escolha `APK` para instalação direta

6. **Configurações de Release:**
   - **Application ID**: `com.grupoestuda.app`
   - **Version Name**: `1.0.0`
   - **Version Code**: `1`
   - **Target SDK**: 34 (Android 14)
   - **Min SDK**: 21 (Android 5.0)

### 🔐 Configurações de Segurança

**Permissões no AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 📱 Recursos Configurados

- ✅ **Splash Screen**: 3 segundos com spinner
- ✅ **Ícones**: Adaptáveis e mascaráveis  
- ✅ **Tema**: Cores consistentes com o app
- ✅ **Orientação**: Portrait (recomendado)
- ✅ **Hardware Acceleration**: Habilitado

### 🚀 Upload para Google Play Console

1. **Crie uma conta no Google Play Console**
2. **Upload do AAB:**
   - Arquivo gerado em: `android/app/build/outputs/bundle/release/`
3. **Preencha as informações:**
   - **Título**: Grupo Estuda
   - **Descrição curta**: "Estude em grupo e alcance suas metas"
   - **Categoria**: Educação
   - **Classificação**: Livre para todos (com supervisão parental para <13)

### 🖼️ Assets Necessários

**Ícones (já gerados):**
- ✅ 192x192px
- ✅ 512x512px

**Screenshots necessários:**
- 📱 Pelo menos 2 screenshots em português
- 📱 Tamanhos: 320x480 até 3840x2160
- 📱 Mostrar principais funcionalidades

### ⚡ Performance

**Otimizações implementadas:**
- ✅ Lazy loading de componentes
- ✅ Compressão de assets
- ✅ Cache eficiente com Vite
- ✅ Bundle size otimizado

### 🔍 Testes Recomendados

Antes do upload:
- [ ] Testar em pelo menos 2 dispositivos Android
- [ ] Verificar funcionamento offline básico
- [ ] Testar fluxo completo de autenticação
- [ ] Validar upload/download de arquivos
- [ ] Confirmar notificações funcionando

### 📞 Suporte Técnico

**Em caso de problemas:**
1. Verifique logs: `adb logcat`
2. Build limpo: `npx cap clean android`
3. Reconstruir: `npm run build && npx cap sync android`

---

## ✅ Status: PRONTO PARA UPLOAD

O projeto está configurado e otimizado para Google Play Store.