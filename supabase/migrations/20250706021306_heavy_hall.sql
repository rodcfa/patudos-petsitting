/*
  # Criar tabela de agendamentos para ambiente de testes

  1. Nova Tabela
    - `agendamentos`
      - `id` (uuid, primary key)
      - `nome_pet` (text, required)
      - `data_inicio` (date, required)
      - `data_fim` (date, required)
      - `valor_por_dia` (numeric, default 0.00)
      - `observacoes` (text, optional)
      - `status` (text, default 'Confirmado')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `agendamentos`
    - Política para permitir acesso público (para demonstração)

  3. Funcionalidades
    - Trigger para atualizar `updated_at` automaticamente
    - Dados de exemplo para testes
*/

-- Criar tabela de agendamentos
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

-- Habilitar RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público (para demonstração)
-- Em produção, você deve restringir isso baseado em autenticação
CREATE POLICY "Permitir acesso público aos agendamentos"
  ON agendamentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo para testes
INSERT INTO agendamentos (nome_pet, data_inicio, data_fim, valor_por_dia, observacoes) VALUES
  ('Spike', '2025-01-01', '2025-01-09', 25.0, 'Cachorro de teste para ambiente de desenvolvimento.'),
  ('Bella', '2025-01-05', '2025-01-12', 30.0, 'Gata muito carinhosa, ambiente de testes.'),
  ('Max', '2025-01-10', '2025-01-15', 35.0, 'Cachorro ativo, dados de teste.'),
  ('Luna', '2025-01-20', '2025-01-25', 40.0, 'Pet de exemplo para demonstração.')
ON CONFLICT DO NOTHING;