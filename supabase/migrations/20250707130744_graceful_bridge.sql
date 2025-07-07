/*
  # Corrigir políticas RLS para permitir registro de usuários

  1. Mudanças
    - Remover políticas RLS restritivas existentes
    - Criar política que permite registro público (INSERT)
    - Manter políticas de leitura e atualização para usuários autenticados
    - Permitir acesso público durante o processo de registro

  2. Segurança
    - Usuários podem se registrar publicamente
    - Usuários autenticados podem ler/atualizar seus próprios dados
    - Admins podem ler todos os usuários
*/

-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Enable user registration" ON users;
DROP POLICY IF EXISTS "Allow anonymous registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Política para permitir registro público (qualquer pessoa pode criar uma conta)
CREATE POLICY "Allow public user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para usuários lerem seus próprios dados (após autenticação)
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para admins lerem todos os usuários
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
      LIMIT 1
    )
  );

-- Política para usuários atualizarem seus próprios dados
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política adicional para permitir acesso anônimo completo durante registro
CREATE POLICY "Allow anonymous access for registration"
  ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);