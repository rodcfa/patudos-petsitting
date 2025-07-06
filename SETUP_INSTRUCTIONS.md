# Instruções de Configuração - Ambiente de Testes

## 📋 Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **Conta no Supabase** (gratuita)
3. **Git** (para controle de versão)

## 🚀 Configuração Passo a Passo

### 1. Criar Novo Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha um nome como "patudos-test" ou "petsitting-dev"
5. Defina uma senha forte para o banco
6. Selecione uma região próxima
7. Clique em "Create new project"

### 2. Obter Credenciais do Supabase

1. No painel do projeto, vá para **Settings** → **API**
2. Copie a **Project URL**
3. Copie a **anon public** key
4. **IMPORTANTE**: Use um projeto DIFERENTE do projeto principal!

### 3. Configurar Variáveis de Ambiente

1. Abra o arquivo `src/static/.env`
2. Substitua as credenciais temporárias pelas suas:

```env
VITE_SUPABASE_URL=https://seu-projeto-teste.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_de_teste_aqui
```

### 4. Executar Migrações do Banco

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie e cole o conteúdo do arquivo `supabase/migrations/create_test_agendamentos.sql`
4. Clique em "Run" para executar a migração
5. Verifique se a tabela `agendamentos` foi criada em **Table Editor**

### 5. Instalar Dependências

```bash
npm install
```

### 6. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## ✅ Verificação da Configuração

Se tudo estiver configurado corretamente, você deve ver:

1. **Console do navegador**: Mensagens de sucesso da conexão
2. **Interface**: Badge "TESTES" no cabeçalho
3. **Dados**: Alguns agendamentos de exemplo no calendário
4. **Funcionalidade**: Capacidade de criar, editar e excluir agendamentos

## 🔧 Solução de Problemas

### Erro de Conexão com Supabase

- Verifique se as credenciais estão corretas no arquivo `.env`
- Confirme que o projeto Supabase está ativo
- Verifique se as migrações foram executadas

### Tabela não encontrada

- Execute novamente a migração SQL no painel do Supabase
- Verifique se a tabela `agendamentos` existe em **Table Editor**

### Erro de permissões

- Confirme que a política RLS está configurada corretamente
- Verifique se a política permite acesso público

## 📝 Próximos Passos

Agora você tem um ambiente de testes completamente separado onde pode:

1. **Testar novas funcionalidades** sem afetar dados reais
2. **Experimentar mudanças** no código
3. **Validar melhorias** antes de aplicar no projeto principal
4. **Treinar usuários** com dados fictícios

## ⚠️ Importante

- **NUNCA** use as credenciais do projeto principal neste ambiente
- **SEMPRE** mantenha os dados de teste separados dos dados reais
- **LEMBRE-SE** de que este é um ambiente de desenvolvimento

## 🆘 Suporte

Se encontrar problemas:

1. Verifique o console do navegador para erros
2. Confirme as configurações do Supabase
3. Revise as instruções passo a passo
4. Teste a conexão com o banco de dados