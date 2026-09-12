/*
  # Create Storage Bucket for Issue Images

  ## Overview
  Creates a public storage bucket for storing issue images uploaded by users.

  ## Changes
  1. Create a public storage bucket named 'images'
  2. Set up storage policies to allow public access for reading
  3. Allow public uploads to the bucket
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'images');