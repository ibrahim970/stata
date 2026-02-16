/*
  # Add People Management System

  1. Changes to profiles table
    - Add `committee_position` field to track current committee members
    - Possible values: 'president', 'general_secretary', 'treasurer', 'vice_president', etc.
  
  2. New Tables
    - `former_leaders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `position` (text) - 'president' or 'general_secretary'
      - `term_start` (text) - year or period
      - `term_end` (text) - year or period
      - `batch` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  3. Security
    - Enable RLS on `former_leaders` table
    - Public can read former leaders
    - Only admins can create/update/delete former leaders
*/

-- Add committee_position to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'committee_position'
  ) THEN
    ALTER TABLE profiles ADD COLUMN committee_position text;
  END IF;
END $$;

-- Create former_leaders table
CREATE TABLE IF NOT EXISTS former_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  term_start text NOT NULL,
  term_end text NOT NULL,
  batch text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on former_leaders
ALTER TABLE former_leaders ENABLE ROW LEVEL SECURITY;

-- Public can read former leaders
CREATE POLICY "Anyone can view former leaders"
  ON former_leaders FOR SELECT
  USING (true);

-- Only admins can insert former leaders
CREATE POLICY "Admins can insert former leaders"
  ON former_leaders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update former leaders
CREATE POLICY "Admins can update former leaders"
  ON former_leaders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete former leaders
CREATE POLICY "Admins can delete former leaders"
  ON former_leaders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );