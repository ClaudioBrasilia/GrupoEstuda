# 🚀 Guia de Publicação — Grupo Estuda

Checklist único e priorizado para publicar o app. Os passos de build detalhados
por plataforma continuam em `android-build-instructions.md` e
`ios-build-instructions.md`; este arquivo é o **roteiro geral** do que fazer,
em que ordem, e traz os **textos prontos** da ficha da loja.

**Dados do app**
- Nome: **Grupo Estuda**
- Package / Bundle ID: `com.grupoestuda.app`
- Versão: `1.0.0` (versionCode `1`)
- Categoria: **Educação**
- Site: https://grupoestuda.vercel.app
- Política de Privacidade: https://grupoestuda.vercel.app/privacy
- Termos de Uso: https://grupoestuda.vercel.app/terms

---

## ✅ O que já está pronto

- [x] App web/PWA no ar (Vercel)
- [x] Ícones nos tamanhos corretos (192, 512, 1024, apple-touch, favicon)
- [x] Manifest PWA completo (instalável, maskable, portrait)
- [x] Páginas de Política de Privacidade e Termos com URL pública
- [x] Capacitor configurado (`com.grupoestuda.app`, splash screen)
- [x] Versão 1.0.0

## ⏳ O que ainda depende de você (fora do código)

Precisa de um computador e de contas nas lojas — não dá pra fazer só pelo celular.

---

## 🤖 Caminho 1 — Google Play (recomendado começar por aqui)

Mais barato e simples: **US$ 25 (pagamento único)**.

### Contas e pré-requisitos
- [ ] Criar conta no [Google Play Console](https://play.google.com/console) (US$ 25)
- [ ] Computador com **Android Studio** + JDK
- [ ] Criar a **keystore de assinatura** e guardá-la em local seguro
      (se perder, não dá para atualizar o app depois)

### Gerar o AAB
Passos resumidos (detalhe em `android-build-instructions.md`):
```bash
npm install
npm run build
npx cap add android      # só na primeira vez
npx cap sync android
npx cap open android     # abre o Android Studio
# No Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle
```
- Application ID: `com.grupoestuda.app`
- Version Name: `1.0.0` · Version Code: `1`
- Target SDK: 34+ · Min SDK: 23+

### Assets que você precisa criar
- [ ] **Ícone da loja** 512×512 — já existe em `public/icon-512.png` ✅
- [ ] **Feature graphic** 1024×500 (banner do topo da ficha) — falta criar
- [ ] **Screenshots** do celular: mínimo 2, recomendado 4–8
      (telas: grupos, cronômetro, desafios/ranking, perfil)
- [ ] (Opcional) Screenshots de tablet

### Ficha da loja (textos prontos — ver seção no fim)

### Formulários obrigatórios no Console
- [ ] **Política de Privacidade**: colar a URL acima
- [ ] **Data safety** (Segurança dos dados): declarar o que o app coleta
      (e-mail/conta, conteúdo gerado pelo usuário como fotos de atividade,
      dados de uso). O backend é Supabase.
- [ ] **Content rating** (questionário): app educacional, tende a "Livre"
- [ ] **Público-alvo**: definir faixa etária (atenção a regras para <13 anos)
- [ ] **Permissões**: o app usa Câmera (foto de atividade) e Internet —
      justificar no formulário se pedir

### Publicação
- [ ] Subir o `.aab` (fica em `android/app/build/outputs/bundle/release/`)
- [ ] Preencher a ficha + assets
- [ ] Lançar em **teste interno** primeiro, validar, depois produção

---

## 🍎 Caminho 2 — App Store (iOS)

Requer **Mac + conta Apple Developer (US$ 99/ano)**. Detalhes em
`ios-build-instructions.md`.

- [ ] Conta Apple Developer
- [ ] Mac com **Xcode**
- [ ] `npx cap add ios && npx cap sync ios && npx cap open ios`
- [ ] Configurar signing (time/certificados) no Xcode
- [ ] Assets: ícone 1024×1024 (`public/icon-1024.png` ✅), screenshots por
      tamanho de tela exigido pela Apple
- [ ] Ficha na App Store Connect (nome, subtítulo, descrição, keywords)
- [ ] Preencher **App Privacy** (equivalente ao Data Safety)
- [ ] Enviar para revisão (a Apple costuma ser mais rigorosa)

---

## 🌐 Caminho 3 — Web / PWA (praticamente pronto)

- [x] Já instalável pelo navegador ("Adicionar à tela inicial")
- [ ] (Opcional) Domínio próprio (ex.: `grupoestuda.com.br`) apontando para a Vercel
- [ ] (Opcional) `sitemap.xml` para SEO
- [ ] Divulgação (o link já gera preview bonito no WhatsApp)

---

## 🔍 QA antes de enviar (qualquer loja)

- [ ] Fluxo completo de cadastro e login
- [ ] Criar grupo, entrar em grupo, adicionar matéria
- [ ] Cronômetro salva sessão e pontua
- [ ] Desafio: entrar, registrar progresso, ver ranking atualizar
- [ ] Upload de foto de atividade + feed
- [ ] Notificações
- [ ] Testar em pelo menos 2 aparelhos reais
- [ ] Rodar a migração `challenge_ranking` no Supabase (desafios de
      exercícios/páginas) — ver histórico de commits

---

## 📝 Textos prontos da ficha da loja

### Nome
```
Grupo Estuda
```

### Descrição curta (máx. 80 caracteres — Google Play)
```
Estude em grupo, dispute rankings e desafios e alcance suas metas de estudo.
```

### Subtítulo (máx. 30 — App Store)
```
Estude, compita e evolua
```

### Descrição completa (máx. 4000)
```
Grupo Estuda é o app perfeito para quem quer estudar em grupo, manter a
motivação e alcançar suas metas — com uma boa dose de competição saudável.

📚 ESTUDE EM GRUPO
Crie ou entre em grupos de estudo, organize matérias e acompanhe o progresso
de todo mundo em um só lugar.

⏱️ CRONÔMETRO DE ESTUDO
Registre suas sessões de estudo, some pontos por minuto estudado e informe
também páginas lidas e exercícios resolvidos.

🎯 METAS
Defina metas de tempo, páginas ou exercícios e acompanhe o quanto falta para
concluir cada uma.

🏆 MODO COMPETITIVO
Dispute desafios dentro dos grupos, suba nos rankings, avance de liga (do
Bronze ao Mestre) e conquiste medalhas. Cada estudo conta pontos — e quem
estuda mais, sobe.

🔥 SEQUÊNCIAS E CONQUISTAS
Mantenha sua sequência diária de estudos, ganhe XP, suba de nível e
desbloqueie itens para o seu avatar.

👥 FEED E INTERAÇÃO
Compartilhe suas atividades com foto, curta as dos colegas e mantenha o grupo
engajado.

Estude com seus amigos, transforme a rotina em um jogo e alcance seus
objetivos acadêmicos. Baixe agora e comece a estudar em grupo!
```

### Palavras-chave (App Store, máx. 100 caracteres, separadas por vírgula)
```
estudo,grupo de estudo,cronometro,metas,vestibular,concurso,ranking,foco,produtividade
```
