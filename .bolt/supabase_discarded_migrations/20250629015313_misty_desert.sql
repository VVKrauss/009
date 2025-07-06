/*
  # Fix Supabase Auth Database Setup

  1. New Tables
    - Ensure `users` table exists for Supabase Auth
    - Update profiles table to properly reference auth.users
  
  2. Security
    - Enable RLS on users table
    - Add proper policies for authentication
    - Fix profiles table foreign key relationship
  
  3. Functions
    - Add trigger to create profile when user signs up
*/

-- Create users table if it doesn't exist (this should match Supabase's auth.users structure)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}',
  raw_user_meta_data jsonb DEFAULT '{}',
  is_super_admin boolean DEFAULT false,
  role text DEFAULT 'authenticated'
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Ensure profiles table has proper foreign key to auth.users
DO $$
BEGIN
  -- Check if the foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    -- Add foreign key constraint to auth.users
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, created_at, email_confirmed_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.email_confirmed_at,
    NEW.last_sign_in_at
  );
  
  -- Insert into profiles table with default values
  INSERT INTO public.profiles (id, name, email, created_at, email_confirmed_at, last_sign_in_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NEW.created_at,
    NEW.email_confirmed_at,
    NEW.last_sign_in_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles to ensure they have proper user references
DO $$
BEGIN
  -- Update profiles that might not have proper auth.users entries
  INSERT INTO auth.users (id, email, created_at, email_confirmed_at, last_sign_in_at)
  SELECT 
    p.id,
    p.email,
    p.created_at,
    p.email_confirmed_at,
    p.last_sign_in_at
  FROM public.profiles p
  WHERE p.id NOT IN (SELECT id FROM auth.users)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Ensure RLS is properly configured on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update profiles policies to work with auth
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'Admin'
    )
  );

-- Service role policies
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);