/*
  # Corrigir políticas RLS para permitir registro de usuários

  1. Mudanças
    - Remover políticas existentes que impedem registro
    - Criar política para permitir INSERT público na tabela users
    - Manter políticas de leitura e atualização para usuários autenticados
    - Permitir que usuários anônimos criem contas

  2. Segurança
    - Permitir registro público (INSERT) para novos usuários
    - Manter proteção para leitura e atualização de dados existentes
    - Admins podem ler todos os usuários
    - Usuários podem ler e atualizar apenas seus próprios dados
*/

-- Remover políticas existentes para recriar corretamente
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Public registration access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Política para permitir registro público (INSERT)
CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Política para usuários lerem seus próprios dados
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

-- Política adicional para permitir acesso anônimo durante registro
CREATE POLICY "Allow anonymous registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);