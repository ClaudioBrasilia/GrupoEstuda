# Integração Supabase - Grupo Estuda

Este documento descreve como o Supabase foi integrado no aplicativo móvel Grupo Estuda.

## Configuração

### Credenciais do Supabase

As credenciais do Supabase já estão configuradas em `lib/supabase.ts`:

```typescript
const SUPABASE_URL = "https://230beb1cfaab22bf115bb6fa18aad3a035c0c571ccdacccbac1e07174ca41c85.supabase.co";
const SUPABASE_ANON_KEY = "1dfc121d1cec7e85141f7ddfa17b93b83103f3bfecc9734777dcaa7391dbee9d";
```

## Funcionalidades Implementadas

### 1. Autenticação com Supabase

O hook `useSupabaseAuth` fornece funcionalidades de autenticação:

```typescript
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export function LoginScreen() {
  const { user, isLoading, signIn, signUp, signOut } = useSupabaseAuth();

  const handleLogin = async () => {
    const { error } = await signIn("user@example.com", "password");
    if (error) {
      Alert.alert("Erro", error);
    }
  };

  return (
    // Seu componente aqui
  );
}
```

### 2. Métodos Disponíveis

#### `signUp(email, password, name)`
Registra um novo usuário no Supabase.

```typescript
const { data, error } = await signUp("novo@example.com", "senha123", "Nome do Usuário");
```

#### `signIn(email, password)`
Faz login com email e senha.

```typescript
const { data, error } = await signIn("user@example.com", "senha123");
```

#### `signOut()`
Faz logout do usuário atual.

```typescript
const { error } = await signOut();
```

#### `resetPassword(email)`
Envia email para resetar senha.

```typescript
const { error } = await resetPassword("user@example.com");
```

### 3. Estado de Autenticação

O hook fornece o estado atual:

```typescript
const { user, isLoading, error } = useSupabaseAuth();

if (isLoading) {
  return <LoadingScreen />;
}

if (user) {
  return <HomeScreen user={user} />;
}

return <LoginScreen />;
```

## Estrutura de Dados

### Tabelas Supabase

O aplicativo está configurado para trabalhar com as seguintes tabelas:

#### `users`
- `id` (UUID, PK)
- `email` (string)
- `name` (string)
- `avatar_url` (string, opcional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `groups`
- `id` (UUID, PK)
- `name` (string)
- `description` (string, opcional)
- `created_by` (UUID, FK para users)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `group_members`
- `id` (UUID, PK)
- `group_id` (UUID, FK para groups)
- `user_id` (UUID, FK para users)
- `joined_at` (timestamp)

## Usando Supabase no Aplicativo

### Exemplo: Buscar Dados

```typescript
import { supabase } from "@/lib/supabase";

async function fetchGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("created_by", userId);

  if (error) {
    console.error("Erro ao buscar grupos:", error);
  } else {
    console.log("Grupos:", data);
  }
}
```

### Exemplo: Inserir Dados

```typescript
async function createGroup(name: string, description: string, userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .insert([
      {
        name,
        description,
        created_by: userId,
      },
    ])
    .select();

  if (error) {
    console.error("Erro ao criar grupo:", error);
  } else {
    console.log("Grupo criado:", data);
  }
}
```

### Exemplo: Atualizar Dados

```typescript
async function updateGroup(groupId: string, name: string) {
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .select();

  if (error) {
    console.error("Erro ao atualizar grupo:", error);
  }
}
```

### Exemplo: Deletar Dados

```typescript
async function deleteGroup(groupId: string) {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) {
    console.error("Erro ao deletar grupo:", error);
  }
}
```

## Real-time Subscriptions

O Supabase permite escutar mudanças em tempo real:

```typescript
import { supabase } from "@/lib/supabase";

useEffect(() => {
  const subscription = supabase
    .from("groups")
    .on("*", (payload) => {
      console.log("Mudança detectada:", payload);
      // Atualizar estado aqui
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Segurança

### Row Level Security (RLS)

Certifique-se de que o RLS está habilitado no Supabase para proteger os dados:

1. Acesse o painel do Supabase
2. Vá para "Authentication" → "Policies"
3. Configure políticas para cada tabela

### Exemplo de Política RLS

```sql
-- Usuários podem ler seus próprios dados
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid() = id);
```

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se a ANON_KEY está correta em `lib/supabase.ts`
- Consulte o painel do Supabase para confirmar

### Erro: "Relation does not exist"
- Certifique-se de que as tabelas foram criadas no Supabase
- Verifique o nome das tabelas (case-sensitive)

### Erro: "Permission denied"
- Verifique as políticas RLS no Supabase
- Certifique-se de que o usuário tem permissão para acessar os dados

### Conexão lenta
- Verifique a latência de rede
- Considere adicionar cache local com AsyncStorage

## Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)

## Próximas Etapas

1. **Criar Tabelas no Supabase**: Acesse o painel do Supabase e crie as tabelas descritas acima
2. **Configurar RLS**: Implemente políticas de segurança para proteger os dados
3. **Implementar Telas de Login**: Crie telas de autenticação usando o hook `useSupabaseAuth`
4. **Sincronizar Dados**: Use as funções do Supabase para sincronizar dados com o backend
5. **Testar em Produção**: Teste a autenticação e sincronização de dados antes de publicar
