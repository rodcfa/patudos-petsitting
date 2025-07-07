/*
  # Sistema completo de usuários e reservas

  1. New Tables
    - `users` - Usuários do sistema (clientes e administradores)
    - `pets` - Informações dos pets dos clientes
    - `bookings` - Reservas de hospedagem
    - `booking_pets` - Relacionamento entre reservas e pets

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Separate permissions for clients and admins

  3. Sample Data
    - Default admin user (RC-adm)
    - Example client with pets and booking
*/

-- Criar enum para tipos de usuário
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar enum para status de reserva
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role DEFAULT 'client',
  name text NOT NULL,
  phone text,
  emergency_contact text,
  veterinarian text,
  authorize_emergency_care boolean DEFAULT false,
  additional_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pets
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text NOT NULL,
  age integer NOT NULL,
  sex text NOT NULL CHECK (sex IN ('male', 'female')),
  weight numeric(5,2),
  vaccinations_up_to_date boolean DEFAULT false,
  last_vaccination_date date,
  has_vaccination_certificate boolean DEFAULT false,
  current_medications text,
  allergies text,
  medical_conditions text,
  sociable_with_dogs text CHECK (sociable_with_dogs IN ('yes', 'no', 'depends')),
  friendly_with_strangers text CHECK (friendly_with_strangers IN ('yes', 'no', 'depends')),
  aggressive_behavior boolean DEFAULT false,
  feeding_instructions text,
  favorite_treats text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL,
  checkout_date date NOT NULL,
  pickup_time time,
  status booking_status DEFAULT 'pending',
  total_amount numeric(10,2) DEFAULT 0.00,
  daily_rate numeric(10,2) DEFAULT 0.00,
  observations text,
  admin_notes text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (checkout_date > checkin_date)
);

-- Tabela de relacionamento entre reservas e pets
CREATE TABLE IF NOT EXISTS booking_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, pet_id)
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pets ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DO $$ BEGIN
  CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
        LIMIT 1
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Políticas para pets
DO $$ BEGIN
  CREATE POLICY "Pet owners can manage their pets"
    ON pets
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all pets"
    ON pets
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
        LIMIT 1
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Políticas para bookings
DO $$ BEGIN
  CREATE POLICY "Clients can manage their bookings"
    ON bookings
    FOR ALL
    TO authenticated
    USING (client_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all bookings"
    ON bookings
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
        LIMIT 1
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Políticas para booking_pets
DO $$ BEGIN
  CREATE POLICY "Booking pets access through bookings"
    ON booking_pets
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id 
        AND (b.client_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' LIMIT 1))
        LIMIT 1
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Inserir usuário administrador padrão
INSERT INTO users (email, password_hash, role, name, phone) VALUES
  ('admin@patudos.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'RC-adm', '+351 912 345 678')
ON CONFLICT (email) DO NOTHING;

-- Inserir dados de exemplo para demonstração
DO $$
DECLARE
  admin_id uuid;
  client_id uuid;
  pet1_id uuid;
  pet2_id uuid;
  booking_id uuid;
BEGIN
  -- Buscar ID do admin
  SELECT id INTO admin_id FROM users WHERE email = 'admin@patudos.com' LIMIT 1;
  
  -- Inserir cliente de exemplo
  INSERT INTO users (email, password_hash, role, name, phone, emergency_contact, veterinarian, authorize_emergency_care)
  VALUES ('cliente@exemplo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'Maria Silva', '+351 923 456 789', 'João Silva - +351 912 345 678', 'Dr. Santos - Clínica VetCare - +351 213 456 789', true)
  ON CONFLICT (email) DO NOTHING;
  
  -- Buscar ID do cliente
  SELECT id INTO client_id FROM users WHERE email = 'cliente@exemplo.com' LIMIT 1;
  
  -- Inserir pets de exemplo apenas se o cliente existe
  IF client_id IS NOT NULL THEN
    -- Inserir primeiro pet
    INSERT INTO pets (owner_id, name, breed, age, sex, weight, vaccinations_up_to_date, sociable_with_dogs, friendly_with_strangers, feeding_instructions)
    VALUES (client_id, 'Rex', 'Golden Retriever', 3, 'male', 30.5, true, 'yes', 'yes', 'Ração premium 2x ao dia, 200g cada refeição')
    ON CONFLICT DO NOTHING;
    
    -- Inserir segundo pet
    INSERT INTO pets (owner_id, name, breed, age, sex, weight, vaccinations_up_to_date, sociable_with_dogs, friendly_with_strangers, feeding_instructions)
    VALUES (client_id, 'Luna', 'Border Collie', 2, 'female', 22.0, true, 'yes', 'depends', 'Ração para cães ativos 2x ao dia, 150g cada refeição')
    ON CONFLICT DO NOTHING;
    
    -- Buscar IDs dos pets
    SELECT id INTO pet1_id FROM pets WHERE owner_id = client_id AND name = 'Rex' LIMIT 1;
    SELECT id INTO pet2_id FROM pets WHERE owner_id = client_id AND name = 'Luna' LIMIT 1;
    
    -- Inserir reserva de exemplo
    INSERT INTO bookings (client_id, checkin_date, checkout_date, status, daily_rate, observations)
    VALUES (client_id, '2025-07-15', '2025-07-18', 'pending', 25.00, 'Rex precisa de medicação para artrite às 8h e 20h')
    ON CONFLICT DO NOTHING;
    
    -- Buscar ID da reserva
    SELECT id INTO booking_id FROM bookings WHERE client_id = client_id AND checkin_date = '2025-07-15' LIMIT 1;
    
    -- Associar pet à reserva
    IF booking_id IS NOT NULL AND pet1_id IS NOT NULL THEN
      INSERT INTO booking_pets (booking_id, pet_id)
      VALUES (booking_id, pet1_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;