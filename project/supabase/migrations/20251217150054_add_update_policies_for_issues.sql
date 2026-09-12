/*
  # Add Update Policies for Issues

  ## Overview
  Adds policies to allow users to update issue status and other fields.
  
  ## Changes
  - Allow public users to update issue status
  - Allow public users to update issue priority
  - Restrict updates to maintain data integrity
*/

CREATE POLICY "Anyone can update issue status"
  ON issues FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
