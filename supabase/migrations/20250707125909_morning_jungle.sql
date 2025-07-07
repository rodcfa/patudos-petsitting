/*
  # Fix User Registration RLS Policies

  1. Security Updates
    - Add policy to allow user registration (INSERT)
    - Update existing policies to work correctly
    - Ensure proper authentication flow

  2. Changes
    - Allow anonymous users to register (INSERT into users table)
    - Maintain existing security for other operations
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow user registration (INSERT) for anonymous users
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read all users
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

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow public access to users table for registration
CREATE POLICY "Public registration access"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);