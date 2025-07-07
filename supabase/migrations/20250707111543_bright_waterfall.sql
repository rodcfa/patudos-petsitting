/*
  # Create agendamentos table

  1. New Tables
    - `agendamentos`
      - `id` (uuid, primary key)
      - `nome_pet` (text, pet name)
      - `data_inicio` (date, start date)
      - `data_fim` (date, end date)
      - `valor_por_dia` (numeric, daily rate)
      - `observacoes` (text, observations)
      - `status` (text, booking status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `agendamentos` table
    - Add policy for public access (as indicated in schema)

  3. Triggers
    - Add trigger to automatically update `updated_at` column
*/

-- Create the agendamentos table
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_pet text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  valor_por_dia numeric(10,2) DEFAULT 0.00,
  observacoes text,
  status text DEFAULT 'Confirmado',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (matching the schema provided)
CREATE POLICY "Permitir acesso público aos agendamentos"
  ON agendamentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_agendamentos_updated_at
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();