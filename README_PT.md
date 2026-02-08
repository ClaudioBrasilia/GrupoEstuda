# Grupo Estuda - Aplicativo Móvel

Um aplicativo móvel moderno para a plataforma Grupo Estuda, desenvolvido com React Native e Expo. O aplicativo oferece uma experiência perfeita em iOS, Android e Web, permitindo que os usuários acessem a plataforma de estudos em grupo de qualquer dispositivo.

## Características

- **Cross-Platform**: Funciona perfeitamente em iOS, Android e Web
- **WebView Integrado**: Carrega a plataforma web https://study-group-boost.lovable.app
- **Interface Intuitiva**: Design seguindo os padrões Apple Human Interface Guidelines
- **Menu Lateral**: Acesso rápido a configurações e informações
- **Compartilhamento**: Compartilhe o aplicativo facilmente com amigos
- **Performance**: Otimizado para rápido carregamento e responsividade
- **Dark Mode**: Suporte automático a modo escuro

## Requisitos

- Node.js 16+ e npm/pnpm
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (macOS) ou Expo Go (iOS)
- Para Android: Android Studio ou Expo Go (Android)

## Instalação e Desenvolvimento

### 1. Instalar Dependências

```bash
cd grupo_estuda_app
pnpm install
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

Isso iniciará:
- Metro bundler (React Native)
- Servidor API (porta 3000)
- Servidor web (porta 8081)

### 3. Testar no Navegador (Web)

Acesse `http://localhost:8081` no seu navegador.

### 4. Testar em Dispositivo Móvel

#### Opção A: Expo Go (Recomendado para Desenvolvimento)

1. Instale o app Expo Go:
   - iOS: App Store
   - Android: Google Play

2. Execute o comando QR:
   ```bash
   pnpm qr
   ```

3. Escaneie o código QR com seu dispositivo

#### Opção B: Build Local

```bash
# Para iOS
pnpm ios

# Para Android
pnpm android
```

## Estrutura do Projeto

```
grupo_estuda_app/
├── app/                          # Rotas e telas (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx            # Tela inicial com WebView
│   │   └── _layout.tsx          # Configuração de abas
│   └── _layout.tsx              # Layout raiz
├── components/                   # Componentes reutilizáveis
│   ├── web-view-container.tsx   # Componente WebView
│   ├── screen-container.tsx     # Wrapper de tela
│   └── ui/                      # Componentes UI
├── hooks/                        # Custom hooks
│   ├── use-colors.ts            # Hook de cores do tema
│   └── use-color-scheme.ts      # Hook de modo escuro
├── lib/                          # Utilitários e configuração
│   ├── utils.ts                 # Funções auxiliares
│   └── theme-provider.tsx       # Provedor de tema
├── constants/                    # Constantes
│   └── theme.ts                 # Configuração de cores
├── assets/                       # Imagens e ícones
│   └── images/
│       ├── icon.png             # Ícone do app
│       ├── splash-icon.png      # Ícone de splash
│       └── favicon.png          # Favicon web
├── app.config.ts                # Configuração do Expo
├── tailwind.config.js           # Configuração Tailwind
├── theme.config.js              # Paleta de cores
└── package.json                 # Dependências

```

## Configuração

### Cores do Tema

Edite `theme.config.js` para personalizar as cores:

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  // ... mais cores
};
```

### Informações do App

Edite `app.config.ts` para atualizar:
- Nome do app
- Versão
- Ícones
- Bundle IDs

## Desenvolvimento

### Adicionar Nova Tela

1. Crie um arquivo em `app/(tabs)/nova-tela.tsx`:

```tsx
import { ScreenContainer } from "@/components/screen-container";
import { Text } from "react-native";

export default function NovaTelaScreen() {
  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl font-bold text-foreground">
        Nova Tela
      </Text>
    </ScreenContainer>
  );
}
```

2. Adicione a rota em `app/(tabs)/_layout.tsx`:

```tsx
<Tabs.Screen
  name="nova-tela"
  options={{
    title: "Nova Tela",
    tabBarIcon: ({ color }) => (
      <IconSymbol size={28} name="icon-name" color={color} />
    ),
  }}
/>
```

### Adicionar Ícone de Aba

1. Mapeie o ícone em `components/ui/icon-symbol.tsx`:

```tsx
const MAPPING = {
  "nova-tela": "icon-name",
  // ... outros ícones
};
```

### Estilização com Tailwind

Use classes Tailwind CSS diretamente:

```tsx
<View className="flex-1 items-center justify-center p-4 bg-background">
  <Text className="text-2xl font-bold text-foreground">
    Texto Estilizado
  </Text>
</View>
```

## Testes

### Executar Testes

```bash
pnpm test
```

### Escrever Testes

Crie arquivos `.test.tsx` em `__tests__`:

```tsx
import { describe, it, expect } from "vitest";

describe("Meu Componente", () => {
  it("deve renderizar", () => {
    expect(true).toBe(true);
  });
});
```

## Build e Publicação

Consulte [BUILD_AND_PUBLISH.md](./BUILD_AND_PUBLISH.md) para instruções detalhadas sobre:
- Fazer build para iOS e Android
- Publicar no App Store
- Publicar no Google Play
- Atualizar o app

## Troubleshooting

### Erro: "Metro bundler crashed"
```bash
# Limpe o cache
rm -rf node_modules/.cache
pnpm dev
```

### Erro: "Cannot find module"
```bash
# Reinstale dependências
rm -rf node_modules
pnpm install
```

### Erro: "WebView não funciona na web"
- O WebView usa iframe na web, que funciona normalmente
- Certifique-se de que a URL é acessível

### Aplicativo lento
- Verifique o console para erros
- Limpe o cache do Metro: `pnpm dev --reset-cache`
- Verifique a conexão de internet

## Recursos

- [Documentação Expo](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [NativeWind (Tailwind CSS)](https://www.nativewind.dev)
- [Expo Router](https://docs.expo.dev/routing/introduction/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## Contribuindo

Para contribuir com melhorias:

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Faça suas mudanças
3. Teste localmente: `pnpm dev`
4. Execute testes: `pnpm test`
5. Faça commit: `git commit -m "Adiciona minha feature"`
6. Push: `git push origin feature/minha-feature`

## Licença

Este projeto é proprietário da Grupo Estuda.

## Suporte

Para dúvidas ou problemas:
- Consulte a documentação em [BUILD_AND_PUBLISH.md](./BUILD_AND_PUBLISH.md)
- Visite https://study-group-boost.lovable.app
- Contate o suporte técnico

## Changelog

### Versão 1.0.0 (2026-01-08)
- Lançamento inicial
- Integração com WebView
- Suporte cross-platform (iOS, Android, Web)
- Menu lateral e compartilhamento
- Testes unitários
- Documentação completa
