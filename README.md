# Welcome to your Lovable project

## Project info 

**URL**: https://lovable.dev/projects/ef41847b-ab77-4d5d-a37f-0e39334293cb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ef41847b-ab77-4d5d-a37f-0e39334293cb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Passo 1: Clone o repositório
git clone https://github.com/ClaudioBrasilia/GrupoEstuda.git

# Passo 2: Entre no diretório do projeto
cd GrupoEstuda

# Passo 3: Configure as variáveis de ambiente
# Copie o arquivo de exemplo e preencha com suas chaves do Supabase
cp .env.example .env

# Passo 4: Instale as dependências
npm i

# Passo 5: Inicie o servidor de desenvolvimento
npm run dev
```

### ⚠️ Configuração Importante: Supabase

Para que a autenticação e o banco de dados funcionem, você deve configurar as variáveis de ambiente no arquivo `.env`:

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Vá em **Project Settings > API**.
3. Copie a **Project URL** e a **anon public API key**.
4. Cole-as no seu arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ef41847b-ab77-4d5d-a37f-0e39334293cb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
