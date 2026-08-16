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
- [x] Service worker registrado — o navegador passa a oferecer "instalar app"
- [x] Política de Privacidade e Termos em **páginas estáticas** (`/privacy` e
      `/terms` abrem direto, sem depender do app carregar)
- [x] **Exclusão de conta dentro do app** (Perfil → Configurações → Segurança)
- [x] Capacitor configurado (`com.grupoestuda.app`, splash screen)
- [x] Eventos de produto gravados em `app_events` (retenção D1/D7)
- [x] Versão 1.0.0

## 🔴 Passo obrigatório antes de qualquer envio — Supabase

O app já tem o código; o backend precisa receber as migrações e a função.
Sem isso a exclusão de conta falha e o Premium continua liberável de graça.

```bash
supabase link --project-ref nwtodahupgqbatxeluat
supabase db push                          # aplica as migrações pendentes
supabase functions deploy delete-account  # função de exclusão de conta
```

O que essas migrações fazem:

| Migração | Efeito |
|---|---|
| `..._fix_user_deletion_cascades` | Faz o `DELETE` do usuário funcionar (sem ela, chave estrangeira barra) |
| `..._protect_plan_column` | Impede o usuário de se conceder Premium pela API |
| `..._add_premium_waitlist` | Lista de interesse no Premium |
| `..._add_app_events` | Eventos de produto + view `retention_by_signup_day` |

Depois de aplicar, confirme numa conta de teste: criar conta → excluir conta →
tentar logar de novo (deve falhar) e o e-mail deve poder se cadastrar de novo.

## 💳 Sobre o Premium

A cobrança **ainda não está integrada** às lojas. A tela de planos mostra o que
o Premium terá e registra interesse (`premium_waitlist`) em vez de vender —
o botão antigo concedia o plano de graça, o que vazava receita e é motivo de
rejeição na App Store (compra digital fora do In-App Purchase).

Para lançar o Premium de verdade depois: integrar Google Play Billing / StoreKit,
validar o recibo numa edge function e gravar `profiles.plan` de lá com
`service_role` — o trigger do banco bloqueia qualquer outro caminho.

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
- [ ] **Política de Privacidade**: colar https://grupoestuda.vercel.app/privacy
- [ ] **Exclusão de conta**: o Play exige o link de um caminho para apagar a
      conta. Informe https://grupoestuda.vercel.app/privacy — a seção 6 explica
      o caminho no app e o e-mail alternativo.
- [ ] **Data safety** (Segurança dos dados): declarar o que o app coleta
      (e-mail/conta, conteúdo gerado pelo usuário como fotos de atividade,
      dados de uso). O backend é Supabase. Marque **"os dados podem ser
      excluídos pelo usuário"** — agora isso é verdade.
- [ ] **Content rating** (questionário): app educacional, tende a "Livre".
      Responda **sim** para "interação entre usuários" — o app tem chat de
      grupo e feed, e omitir isso é causa comum de reclassificação depois.
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
- [ ] **Excluir conta**: apaga mesmo e permite recadastrar o mesmo e-mail
- [ ] **Premium**: confirmar que ninguém consegue virar Premium pelo app
- [ ] Abrir https://grupoestuda.vercel.app/privacy e `/terms` numa aba anônima —
      precisam abrir direto, sem passar pelo app
- [ ] Testar em pelo menos 2 aparelhos reais
- [ ] Aplicar as migrações pendentes (`supabase db push`) — inclui a
      `challenge_ranking` dos desafios de exercícios/páginas

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
