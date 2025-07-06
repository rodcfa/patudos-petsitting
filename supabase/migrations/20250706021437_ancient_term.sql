/*
  # Create agendamentos table for testing environment

  1. New Tables
    - `agendamentos`
      - `id` (uuid, primary key)
      - `nome_pet` (text, not null)
      - `data_inicio` (date, not null)
      - `data_fim` (date, not null)
      - `valor_por_dia` (numeric, default 0.00)
      - `observacoes` (text, nullable)
      - `status` (text, default 'Confirmado')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `agendamentos` table
    - Add policy for public access (testing environment only)

  3. Functions & Triggers
    - Create update_updated_at_column function
    - Add trigger to automatically update updated_at field

  4. Sample Data
    - Insert test data for development environment
*/

-- Create agendamentos table if it doesn't exist
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_pet text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  valor_por_dia numeric(10, 2) DEFAULT 0.00,
  observacoes text,
  status text DEFAULT 'Confirmado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'agendamentos' 
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists, then create new one
DO $$
BEGIN
  -- Drop policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agendamentos' 
    AND policyname = 'Permitir acesso público aos agendamentos'
  ) THEN
    DROP POLICY "Permitir acesso público aos agendamentos" ON agendamentos;
  END IF;
  
  -- Create the policy
  CREATE POLICY "Permitir acesso público aos agendamentos"
    ON agendamentos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
END $$;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DO $$
BEGIN
  -- Drop trigger if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agendamentos_updated_at'
  ) THEN
    DROP TRIGGER update_agendamentos_updated_at ON agendamentos;
  END IF;
  
  -- Create the trigger
  CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Insert sample data for testing (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM agendamentos LIMIT 1) THEN
    INSERT INTO agendamentos (nome_pet, data_inicio, data_fim, valor_por_dia, observacoes) VALUES
      ('Spike', '2025-01-01', '2025-01-09', 25.0, 'Cachorro de teste para ambiente de desenvolvimento.'),
      ('Bella', '2025-01-05', '2025-01-12', 30.0, 'Gata muito carinhosa, ambiente de testes.'),
      ('Max', '2025-01-10', '2025-01-15', 35.0, 'Cachorro ativo, dados de teste.'),
      ('Luna', '2025-01-20', '2025-01-25', 40.0, 'Pet de exemplo para demonstração.');
  END IF;
END $$;