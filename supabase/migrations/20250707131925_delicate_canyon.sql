/*
  # Fix user registration RLS policy

  1. Security Updates
    - Add INSERT policy for users table to allow authenticated users to create their own profile
    - Ensure users can only insert records where the ID matches their auth.uid()

  2. Changes
    - Create policy "Users can insert own profile" for INSERT operations on users table
    - Policy allows authenticated users to insert only when auth.uid() = id
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);