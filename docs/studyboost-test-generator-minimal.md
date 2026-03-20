# StudyBoost: estrutura mínima para o gerador de questões

Este repositório já contém um schema maior, mas para portar o fluxo **Criar Teste / generate-test-questions** para o **StudyBoost** não é necessário copiar as 18 tabelas do projeto completo.

## O mínimo necessário

### Obrigatório
- **Supabase Auth** funcionando
- **`public.profiles`** com:
  - `id uuid` referenciando `auth.users(id)`
  - `name text`
  - `plan text` com valores `free | basic | premium`
- **RLS em `public.profiles`**
  - leitura do próprio perfil
  - inserção do próprio perfil
  - atualização do próprio perfil
- **Trigger de criação automática de perfil** em `auth.users`
- **Edge Function `generate-test-questions`**
  - com `verify_jwt = true`
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

### Opcional
- Bucket **`study-materials`** e respectivas policies em `storage.objects`
  - necessário apenas se o StudyBoost for manter o upload de PDF/TXT antes de gerar as questões

## Arquivo pronto para aplicar

Use o script:

- `supabase/minimal/studyboost_test_generator_minimal.sql`

Ele cria apenas:
- `public.profiles`
- policies mínimas de RLS
- trigger para auto-criação do profile
- bucket opcional `study-materials`

## O que ficou de fora de propósito

As tabelas abaixo **não fazem parte do mínimo necessário** para o gerador funcionar:

- `groups`
- `subjects`
- `group_members`
- `messages`
- `goals`
- `study_sessions`
- `water_intake`
- `user_points`
- `group_files`
- `user_preferences`
- `group_invitations`
- `notifications`
- `achievements`
- `user_achievements`
- `study_activities`
- `study_activity_likes`
- `goal_progress_events`

## Observação importante

O fluxo atual:
- exige usuário autenticado
- verifica se o usuário é premium via `profiles.plan`
- gera e corrige as questões em memória na interface
- **não salva testes, tentativas ou resultados em tabelas**

Por isso, criar tabelas extras para testes/resultados neste momento seria excesso de escopo.
