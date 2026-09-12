/*
  # CampusConnect Database Schema

  ## Overview
  Creates the database structure for campus issue reporting and tracking system.

  ## New Tables
  
  ### `issue_categories`
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text, not null) - Category name (e.g., "Maintenance", "Safety", "Cleanliness")
  - `color` (text) - Color code for map markers
  - `icon` (text) - Icon identifier for the category
  - `created_at` (timestamptz) - Timestamp of category creation
  
  ### `issues`
  - `id` (uuid, primary key) - Unique identifier for each issue
  - `title` (text, not null) - Brief title of the issue
  - `description` (text, not null) - Detailed description of the issue
  - `category_id` (uuid, foreign key) - References issue_categories
  - `status` (text, not null) - Current status: 'pending', 'in_progress', 'resolved', 'closed'
  - `priority` (text) - Priority level: 'low', 'medium', 'high', 'critical'
  - `location_lat` (decimal) - Latitude coordinate of issue location
  - `location_lng` (decimal) - Longitude coordinate of issue location
  - `location_name` (text) - Human-readable location name
  - `image_url` (text) - URL to uploaded issue image
  - `reporter_name` (text) - Name of person reporting the issue
  - `reporter_contact` (text) - Contact information
  - `created_at` (timestamptz) - Timestamp of issue creation
  - `updated_at` (timestamptz) - Timestamp of last update
  - `resolved_at` (timestamptz) - Timestamp when issue was resolved

  ## Security
  - Enable RLS on all tables
  - Allow public read access (anyone can view issues and categories)
  - Allow public insert access for issues (anyone can report issues)
  - Restrict updates and deletes (admin-only operations in future)
*/

-- Create issue_categories table
CREATE TABLE IF NOT EXISTS issue_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'alert-circle',
  created_at timestamptz DEFAULT now()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES issue_categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text DEFAULT 'medium',
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  location_name text,
  image_url text,
  reporter_name text,
  reporter_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);

-- Enable Row Level Security
ALTER TABLE issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_categories
-- Allow anyone to view categories
CREATE POLICY "Anyone can view issue categories"
  ON issue_categories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for issues
-- Allow anyone to view issues
CREATE POLICY "Anyone can view issues"
  ON issues FOR SELECT
  TO public
  USING (true);

-- Allow anyone to report issues
CREATE POLICY "Anyone can report issues"
  ON issues FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert default categories
INSERT INTO issue_categories (name, color, icon) VALUES
  ('Maintenance', '#EF4444', 'wrench'),
  ('Safety', '#F59E0B', 'alert-triangle'),
  ('Cleanliness', '#10B981', 'trash-2'),
  ('Infrastructure', '#3B82F6', 'building'),
  ('Technology', '#8B5CF6', 'laptop'),
  ('Lighting', '#F97316', 'lightbulb'),
  ('Other', '#6B7280', 'help-circle')
ON CONFLICT (name) DO NOTHING;