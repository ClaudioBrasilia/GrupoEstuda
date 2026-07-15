# Grupo Estuda

App de grupos de estudo com competição: crie grupos, defina metas, participe de desafios e ligas, acompanhe seu progresso e mantenha-se motivado.

## Funcionalidades

- 👥 Grupos de estudo colaborativos com arquivos e convites
- 🏆 Desafios, ranking, ligas, temporadas e sistema de XP
- ⏱️ Timer de estudo (Pomodoro) com registro de sessões
- 💧 Controle de hidratação com lembretes
- 📊 Estatísticas de progresso (básicas e avançadas no Premium)
- 📝 Gerador de testes com IA (Premium)
- 🌐 i18n (pt/en), tema claro/escuro, PWA e apps nativos via Capacitor

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, banco com RLS, storage, edge functions)
- Capacitor (Android/iOS)

## Rodando localmente

```sh
git clone https://github.com/ClaudioBrasilia/GrupoEstuda.git
cd GrupoEstuda

# Configure as variáveis de ambiente
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Project Settings > API no Supabase)

npm install
npm run dev
```

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera `dist/`) |
| `npm run lint` | ESLint |
| `npm run preview` | Serve o build localmente |

## Supabase

As migrations estão em `supabase/migrations/` e as edge functions em `supabase/functions/`.

Secrets necessários nas edge functions:

- `OPENAI_API_KEY` — usada por `generate-test-questions` (gerador de testes Premium)
- `CRON_SECRET` — exigida por `water-reminder` e `check-leaderboard-changes`; os jobs de cron devem enviar o mesmo valor no header `x-cron-secret`

A coluna `plan` da tabela `profiles` é protegida por trigger: upgrades só podem ser feitos pelo servidor (service role). Usuários podem apenas voltar ao plano `free`.

## Status do Premium / pagamento

⚠️ A integração de pagamento **ainda não está implementada**. O botão de assinatura Premium exibe um aviso de "em breve". Antes de publicar cobrando, é preciso integrar um provedor de cobrança (billing nativo das lojas para apps móveis e/ou Stripe para web) e conceder o plano via webhook no servidor.

## Builds nativos

Veja `android-build-instructions.md` e `ios-build-instructions.md`. Instruções gerais de publicação em `PRODUCTION_SETUP.md`.
