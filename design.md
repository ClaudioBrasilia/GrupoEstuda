# Design do Aplicativo Grupo Estuda

## Visão Geral

O Grupo Estuda é um aplicativo móvel que funciona como um wrapper para a plataforma web de estudos em grupo. O design segue os princípios do Apple Human Interface Guidelines (HIG), otimizado para uso com uma mão em orientação retrato (9:16).

## Paleta de Cores

- **Primária:** #0a7ea4 (Azul Teal) - Ações principais, botões
- **Fundo:** #ffffff (Branco) - Fundo padrão
- **Superfície:** #f5f5f5 (Cinza Claro) - Cards, seções
- **Texto Principal:** #11181C (Cinza Escuro) - Títulos, textos
- **Texto Secundário:** #687076 (Cinza Médio) - Subtítulos, descrições
- **Sucesso:** #22C55E (Verde) - Confirmações
- **Aviso:** #F59E0B (Âmbar) - Alertas
- **Erro:** #EF4444 (Vermelho) - Erros

## Telas Principais

### 1. Tela de Carregamento (Splash Screen)
- Exibe logo do Grupo Estuda
- Animação de carregamento suave
- Transição automática para tela inicial

### 2. Tela Inicial (Home)
- **Conteúdo Principal:** WebView carregando https://study-group-boost.lovable.app
- **Barra de Navegação:** Tab bar com ícone de casa (home)
- **Barra Superior:** Título "Grupo Estuda" com ícone de menu
- **Funcionalidades:**
  - Botão de atualizar (refresh) para recarregar a página
  - Botão de compartilhamento (share)
  - Botão de menu (sobre, configurações)

### 3. Menu Lateral
- Opção "Sobre" - Exibe informações do aplicativo
- Opção "Configurações" - Acesso a preferências
- Opção "Sair" - Fecha o aplicativo

### 4. Tela de Sobre
- Nome e versão do aplicativo
- Descrição breve
- Link para o site
- Botão de fechar

## Fluxos de Usuário Principais

### Fluxo 1: Inicializar Aplicativo
1. Usuário abre o aplicativo
2. Splash screen exibida por 2-3 segundos
3. Tela inicial carrega automaticamente
4. WebView carrega o conteúdo de https://study-group-boost.lovable.app

### Fluxo 2: Atualizar Conteúdo
1. Usuário toca no botão de atualizar
2. WebView recarrega a página
3. Indicador de carregamento exibido
4. Conteúdo atualizado

### Fluxo 3: Compartilhar Aplicativo
1. Usuário toca no botão de compartilhamento
2. Menu de compartilhamento do sistema abre
3. Usuário seleciona aplicativo ou rede social
4. Conteúdo compartilhado

### Fluxo 4: Acessar Menu
1. Usuário toca no ícone de menu
2. Menu lateral desliza da esquerda
3. Usuário seleciona opção (Sobre, Configurações, Sair)
4. Ação correspondente executada

## Componentes de Interface

### Barra de Navegação (Tab Bar)
- Ícone de casa (home) - Tela inicial
- Posição: Inferior
- Cor: Branco com borda sutil
- Ícone ativo: Azul teal (#0a7ea4)
- Ícone inativo: Cinza médio (#687076)

### Barra Superior (Header)
- Título: "Grupo Estuda"
- Botões de ação: Atualizar, Compartilhar, Menu
- Cor de fundo: Branco
- Borda inferior: Cinza claro

### WebView
- Ocupa toda a área disponível entre header e tab bar
- Carrega https://study-group-boost.lovable.app
- Suporta navegação de volta/frente
- Indicador de carregamento visível

## Considerações de Implementação

### Segurança
- Validar URL antes de carregar no WebView
- Desabilitar acesso a arquivos locais não autorizados
- Implementar Content Security Policy

### Performance
- Cache de página habilitado
- Lazy loading de imagens
- Compressão de dados

### Acessibilidade
- Labels de acessibilidade em todos os botões
- Suporte a dark mode (automático)
- Tamanhos de toque mínimos de 44x44 pt

### Responsividade
- Tela cheia em portrait
- Suporte a notch/safe area
- Adaptação para diferentes tamanhos de tela

## Branding

- **Nome do App:** Grupo Estuda
- **Slug:** grupo_estuda_app
- **Ícone:** Será gerado com logo customizado
- **Versão Inicial:** 1.0.0
