/*
  # Corrigir políticas RLS para permitir registro de usuários

  1. Mudanças
    - Remove todas as políticas existentes da tabela users
    - Cria nova política que permite registro público
    - Permite que usuários leiam e atualizem seus próprios dados
    - Permite que admins leiam todos os usuários

  2. Segurança
    - Mantém RLS habilitado
    - Permite INSERT público para registro
    - Restringe SELECT e UPDATE aos próprios dados do usuário
    - Permite acesso completo para administradores
*/

-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Allow public user registration" ON users;
DROP POLICY IF EXISTS "Allow anonymous access for registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Política para permitir registro público (INSERT)
CREATE POLICY "Enable public user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para usuários autenticados lerem seus próprios dados
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

-- Política adicional para permitir acesso anônimo durante o registro
CREATE POLICY "Allow anonymous user registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);