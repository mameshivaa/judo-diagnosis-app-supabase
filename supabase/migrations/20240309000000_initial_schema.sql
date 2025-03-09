-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('user-content', 'user-content', true);

-- Create RLS policies for storage
CREATE POLICY "Anyone can view user content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-content');

CREATE POLICY "Authenticated users can upload user content"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-content'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own user content"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-content'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete their own user content"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-content'
    AND owner = auth.uid()
  );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();