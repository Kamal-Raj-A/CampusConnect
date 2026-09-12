/*
  # Fix Issues Table Update Access

  ## Overview
  Ensures that public users can update all fields in the issues table directly via the database.
  This allows you to modify issue status, priority, and other fields through the database interface.

  ## Changes
  - Enable unrestricted UPDATE access on issues table
  - Allow any field to be updated by public users
*/

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Anyone can update issue status" ON issues;

-- Create a new permissive UPDATE policy that allows any updates
CREATE POLICY "Public can update all issue fields"
  ON issues FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);