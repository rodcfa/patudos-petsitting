/*
  # Add INSERT policy for users table

  1. Security
    - Add policy to allow authenticated users to insert their own profile data
    - Ensures users can only create profiles with their own auth.uid()
    
  This fixes the RLS violation error that occurs during user registration
  when trying to create a user profile after successful authentication.
*/

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);