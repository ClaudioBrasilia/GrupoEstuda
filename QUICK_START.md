# Quick Start - Grupo Estuda

## 1. Instalação

```bash
# Extrair o arquivo ZIP
unzip grupo_estuda_app.zip
cd grupo_estuda_app

# Instalar dependências (pnpm recomendado)
pnpm install
```

## 2. Configurar Supabase

As credenciais do Supabase já estão configuradas em `lib/supabase.ts`.

Se precisar atualizar, edite o arquivo:

```typescript
const SUPABASE_URL = "sua-url-aqui";
const SUPABASE_ANON_KEY = "sua-chave-aqui";
```

## 3. Iniciar Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm start

# Opcional: iniciar API + Expo
pnpm dev
```

Acesse http://localhost:8081 no navegador.

## 4. Testar em Dispositivo Móvel

### Com Expo Go (Recomendado)

```bash
# Gerar QR code
pnpm qr

# Escaneie com Expo Go no seu dispositivo
```

### Build Local

```bash
# iOS
pnpm ios

# Android
pnpm android
```

## 5. Build de teste (APK via EAS preview)

Gere um APK instalável para testes rápidos (fora da Play Store):

```bash
eas login
eas build -p android --profile preview
```

Quando o build terminar, o EAS fornece um link. Envie esse link para os testadores baixarem e instalarem o APK no Android.

## 6. Estrutura de Arquivos Importante

- `app/(tabs)/index.tsx` - Tela inicial com WebView
- `lib/supabase.ts` - Configuração do Supabase
- `hooks/use-supabase-auth.ts` - Hook de autenticação
- `app.config.ts` - Configuração do app
- `BUILD_AND_PUBLISH.md` - Guia de publicação
- `SUPABASE_INTEGRATION.md` - Documentação Supabase

## 7. Próximos Passos

1. Criar tabelas no Supabase (users, groups, group_members)
2. Implementar telas de login/registro
3. Conectar dados do Supabase
4. Testar em dispositivos reais
5. Fazer build e publicar

## 8. Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules
pnpm install
```

### Erro: "Metro bundler crashed"
```bash
pnpm dev --reset-cache
```

### Erro: "Supabase connection failed"
- Verifique as credenciais em `lib/supabase.ts`
- Certifique-se de que o projeto Supabase está ativo

## Documentação Completa

- [README_PT.md](./README_PT.md) - Documentação em português
- [BUILD_AND_PUBLISH.md](./BUILD_AND_PUBLISH.md) - Guia de publicação
- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Integração Supabase
- [design.md](./design.md) - Design do app

## Suporte

Para dúvidas:
- Consulte a documentação do Expo: https://docs.expo.dev
- Documentação Supabase: https://supabase.com/docs
- React Native: https://reactnative.dev
