/*
  # Criar tabela de agendamentos

  1. Nova Tabela
    - `agendamentos`
      - `id` (uuid, chave primária)
      - `nome_pet` (text, obrigatório)
      - `data_inicio` (date, obrigatório)
      - `data_fim` (date, obrigatório)
      - `valor_por_dia` (numeric, opcional)
      - `observacoes` (text, opcional)
      - `status` (text, padrão 'Confirmado')
      - `created_at` (timestamp, padrão now())
      - `updated_at` (timestamp, padrão now())

  2. Segurança
    - Habilitar RLS na tabela `agendamentos`
    - Adicionar política para permitir todas as operações (CRUD) para usuários autenticados
    - Para este projeto de demonstração, permitir acesso público
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

-- Inserir dados de exemplo
INSERT INTO agendamentos (nome_pet, data_inicio, data_fim, valor_por_dia, observacoes) VALUES
  ('Bolinha', '2025-07-10', '2025-07-15', 25.0, 'Cachorro muito dócil, gosta de brincar no jardim.'),
  ('Rex', '2025-07-12', '2025-07-18', 30.0, 'Precisa de medicação às 8h e 20h. Muito carinhoso.'),
  ('Luna', '2025-07-12', '2025-07-14', 35.0, 'Gata independente, apenas alimentação e carinho.'),
  ('Max', '2025-07-13', '2025-07-13', 40.0, 'Apenas um dia, cachorro muito ativo.')
ON CONFLICT DO NOTHING;