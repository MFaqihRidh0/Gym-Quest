-- ==============================================================================
-- GYMQUEST SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Jalankan skrip ini langsung di menu SQL Editor pada Dashboard Supabase Anda.
-- ==============================================================================

-- 1. TABEL PROFIL PENGGUNA (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Knight-01',
  avatar TEXT DEFAULT '⚔️',
  fitness_level TEXT DEFAULT 'pemula' CHECK (fitness_level IN ('pemula', 'menengah', 'mahir')),
  fitness_goal TEXT DEFAULT 'otot' CHECK (fitness_goal IN ('kurus', 'otot', 'stamina')),
  target_duration INTEGER DEFAULT 15,
  streak_days INTEGER DEFAULT 0,
  last_workout_date TEXT,
  completed_sessions_count INTEGER DEFAULT 0,
  total_exp INTEGER DEFAULT 0,
  current_league TEXT DEFAULT 'iron' CHECK (current_league IN ('iron', 'bronze', 'silver', 'gold', 'titan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABEL RIWAYAT LATIHAN (workout_logs)
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  program_id TEXT NOT NULL,
  program_title TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed_exercises_count INTEGER DEFAULT 0,
  total_exercises_count INTEGER DEFAULT 0,
  total_reps_completed INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABEL PROGRAM LATIHAN KUSTOM (custom_programs)
CREATE TABLE IF NOT EXISTS public.custom_programs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  level TEXT DEFAULT 'pemula',
  goal TEXT DEFAULT 'otot',
  description TEXT DEFAULT '',
  estimated_minutes INTEGER DEFAULT 15,
  badge TEXT DEFAULT '🎯',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Menjamin pengguna hanya bisa membaca, mengubah, dan menghapus data miliknya sendiri.
-- ==============================================================================

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_programs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Kebijakan Workout Logs
CREATE POLICY "Users can view their own workout logs" 
  ON public.workout_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" 
  ON public.workout_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
  ON public.workout_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Kebijakan Custom Programs
CREATE POLICY "Users can view their own custom programs" 
  ON public.custom_programs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom programs" 
  ON public.custom_programs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom programs" 
  ON public.custom_programs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom programs" 
  ON public.custom_programs FOR DELETE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER OTOMATIS SAAT USER BARU MENDAFTAR (Auto-create profile on signup)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar, fitness_level, fitness_goal, target_duration)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'Knight-01'),
    '⚔️',
    'pemula',
    'otot',
    15
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index untuk mempercepat query berdasarkan user_id dan timestamp
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_timestamp ON public.workout_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_custom_programs_user_id ON public.custom_programs(user_id);
