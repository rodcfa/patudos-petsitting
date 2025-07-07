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

-- Create policy for public access (matching the schema provided) - only if it doesn't exist
DO $$ BEGIN
  CREATE POLICY "Permitir acesso público aos agendamentos"
    ON agendamentos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to update updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at - only if it doesn't exist
DO $$ BEGIN
  CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;