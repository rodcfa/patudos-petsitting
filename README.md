# Patudos PetSitting - Ambiente de Testes

Este é um ambiente de testes duplicado do projeto principal Patudos PetSitting.

## Configuração

1. **Banco de Dados**: Novo projeto Supabase independente
2. **Código**: Cópia exata do projeto principal
3. **Objetivo**: Ambiente seguro para testes e melhorias

## Como usar

1. Configure as variáveis de ambiente no arquivo `.env`
2. Execute as migrações do Supabase
3. Inicie o servidor de desenvolvimento

## Diferenças do projeto principal

- Banco de dados separado
- Dados de teste independentes
- Configurações de desenvolvimento

## Comandos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Estrutura

- `src/static/` - Frontend da aplicação
- `src/lib/` - Configurações do Supabase
- `src/services/` - Serviços de API
- `supabase/migrations/` - Migrações do banco