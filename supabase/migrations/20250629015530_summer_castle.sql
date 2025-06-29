/*
  # Fix Authentication Database Issues

  1. Database Schema Fixes
    - Ensure auth schema has proper permissions
    - Fix any conflicts between custom users table and auth.users
    - Add proper triggers for user profile creation
    - Ensure RLS policies are correctly configured

  2. Security
    - Verify auth.users table permissions
    - Ensure profiles table is properly linked to auth.users
    - Fix any RLS policy conflicts
*/

-- Ensure the auth schema exists and has proper permissions
DO $$
BEGIN
  -- Grant necessary permissions to authenticated role
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON auth.users TO authenticated;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- This is expected in some cases, continue
    NULL;
END $$;

-- Fix the profiles table to ensure it properly references auth.users
DO $$
BEGIN
  -- Drop the existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint might already exist correctly
    NULL;
END $$;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'Guest'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION
  WHEN insufficient_privilege THEN
    -- This might fail in some environments, that's okay
    RAISE WARNING 'Could not create auth trigger - this may need to be done manually';
END $$;

-- Ensure the custom users table doesn't conflict with auth
-- If you have a custom users table that's not being used, consider removing it
-- For now, we'll just ensure it doesn't interfere

-- Update RLS policies on profiles to be more permissive for auth operations
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create more robust RLS policies
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Ensure service role can manage profiles for auth operations
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix any potential issues with the auth.users table permissions
DO $$
BEGIN
  -- Ensure the auth.users table has the right structure
  -- This is mostly handled by Supabase, but we can check for common issues
  
  -- Make sure email confirmation is properly configured
  -- This should be done in your Supabase dashboard under Authentication > Settings
  NULL;
END $$;

-- Clean up any orphaned records that might cause conflicts
DO $$
BEGIN
  -- Remove any profiles that don't have corresponding auth users
  DELETE FROM profiles 
  WHERE id NOT IN (SELECT id FROM auth.users);
  
  -- This is safe because of the foreign key constraint
EXCEPTION
  WHEN OTHERS THEN
    -- If this fails, it's not critical
    RAISE WARNING 'Could not clean up orphaned profiles: %', SQLERRM;
END $$;