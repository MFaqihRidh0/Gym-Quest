-- ==============================================================================
-- GYMQUEST SUPABASE DATABASE SCHEMA & RLS POLICIES (OPTIMIZED & PRODUCTION-READY)
-- Skrip ini idempotent (dapat dijalankan ulang dengan aman tanpa menghapus data yang ada).
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
-- INDEKS PERFORMA TINGGI (COMPOSITE & FILTERED INDEXES)
-- ==============================================================================

-- Hapus index lama jika ada untuk diganti dengan composite index
DROP INDEX IF EXISTS public.idx_workout_logs_user_id;
DROP INDEX IF EXISTS public.idx_workout_logs_timestamp;

-- Indeks komposit: Mempercepat query riwayat latihan spesifik pengguna terurut tanggal
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_timestamp 
  ON public.workout_logs(user_id, timestamp DESC);

-- Indeks program kustom per pengguna
CREATE INDEX IF NOT EXISTS idx_custom_programs_user_id 
  ON public.custom_programs(user_id);

-- Indeks pemeringkatan leaderboard global berdasarkan total EXP
CREATE INDEX IF NOT EXISTS idx_profiles_total_exp 
  ON public.profiles(total_exp DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_programs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. Kebijakan Profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- Profil publik (username, avatar, exp, liga) dapat dibaca untuk leaderboard
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- B. Kebijakan Workout Logs (Mendukung UPSERT)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can view their own workout logs" 
  ON public.workout_logs FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can insert their own workout logs" 
  ON public.workout_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
-- UPDATE policy wajib agar operasi .upsert() tidak ditolak RLS
CREATE POLICY "Users can update their own workout logs" 
  ON public.workout_logs FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can delete their own workout logs" 
  ON public.workout_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- C. Kebijakan Custom Programs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own custom programs" ON public.custom_programs;
CREATE POLICY "Users can view their own custom programs" 
  ON public.custom_programs FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom programs" ON public.custom_programs;
CREATE POLICY "Users can insert their own custom programs" 
  ON public.custom_programs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own custom programs" ON public.custom_programs;
CREATE POLICY "Users can update their own custom programs" 
  ON public.custom_programs FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own custom programs" ON public.custom_programs;
CREATE POLICY "Users can delete their own custom programs" 
  ON public.custom_programs FOR DELETE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER OTOMATISASI DATABASE (TRIGGERS & FUNCTIONS)
-- ==============================================================================

-- 1. Otomatisasi pembaruan updated_at di level database
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_custom_programs_updated_at ON public.custom_programs;
CREATE TRIGGER trg_custom_programs_updated_at
  BEFORE UPDATE ON public.custom_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Trigger registrasi user baru (Auto-create profile on auth.users insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    avatar, 
    fitness_level, 
    fitness_goal, 
    target_duration,
    current_league
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'Knight-01'),
    '⚔️',
    'pemula',
    'otot',
    15,
    'iron'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. SISTEM DYNAMIC COHORT / LEAGUE ROOMS (11 PEMAIN PER ROOM)
-- ==============================================================================

-- A. Tabel Room Liga (Bracket kompetisi terbagi per 11 orang)
CREATE TABLE IF NOT EXISTS public.league_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  league_tier TEXT NOT NULL CHECK (league_tier IN ('iron', 'bronze', 'silver', 'gold', 'titan')),
  max_members INTEGER NOT NULL DEFAULT 11,
  member_count INTEGER NOT NULL DEFAULT 0,
  season_start_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  season_end_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days') NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- B. Tabel Anggota Room (Menyimpan EXP mingguan per musim room)
CREATE TABLE IF NOT EXISTS public.league_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.league_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weekly_exp INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);

-- C. Indeks Performa Tinggi untuk Matchmaking & Peringkat
CREATE INDEX IF NOT EXISTS idx_league_rooms_matchmaking 
  ON public.league_rooms(league_tier, is_closed, created_at);

CREATE INDEX IF NOT EXISTS idx_league_room_members_user 
  ON public.league_room_members(user_id);

CREATE INDEX IF NOT EXISTS idx_league_room_members_room_exp 
  ON public.league_room_members(room_id, weekly_exp DESC);

-- D. Row Level Security (RLS)
ALTER TABLE public.league_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view league rooms" ON public.league_rooms;
CREATE POLICY "Public can view league rooms" 
  ON public.league_rooms FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public can view league room members" ON public.league_room_members;
CREATE POLICY "Public can view league room members" 
  ON public.league_room_members FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert membership" ON public.league_room_members;
CREATE POLICY "Users can insert membership" 
  ON public.league_room_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weekly exp" ON public.league_room_members;
CREATE POLICY "Users can update their own weekly exp" 
  ON public.league_room_members FOR UPDATE 
  USING (auth.uid() = user_id);

-- E. Stored Procedure: Matchmaking Otomatis Room Liga (Maksimal 11 Orang)
CREATE OR REPLACE FUNCTION public.get_or_join_league_room(p_league_tier TEXT DEFAULT 'iron')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room RECORD;
  v_room_count INTEGER;
  v_new_code TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- 1. Cek apakah user sudah berada di room aktif di liga ini (season_end_at > NOW())
  SELECT r.id, r.room_code, r.league_tier, r.season_start_at, r.season_end_at, r.member_count, m.weekly_exp
  INTO v_room
  FROM public.league_room_members m
  JOIN public.league_rooms r ON m.room_id = r.id
  WHERE m.user_id = v_user_id
    AND r.league_tier = p_league_tier
    AND r.season_end_at > NOW()
  ORDER BY m.joined_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'existing',
      'room_id', v_room.id,
      'room_code', v_room.room_code,
      'league_tier', v_room.league_tier,
      'season_start_at', v_room.season_start_at,
      'season_end_at', v_room.season_end_at,
      'member_count', v_room.member_count,
      'weekly_exp', v_room.weekly_exp
    );
  END IF;

  -- 2. Cari room terbuka (< 11 orang, dibuat dalam 24 jam terakhir agar waktu persaingan adil)
  SELECT *
  INTO v_room
  FROM public.league_rooms
  WHERE league_tier = p_league_tier
    AND is_closed = false
    AND member_count < 11
    AND season_end_at > NOW()
    AND created_at >= (NOW() - INTERVAL '24 hours')
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 3. Jika tidak ada room terbuka yang cocok, buat room baru!
  IF NOT FOUND THEN
    SELECT COUNT(*) + 1 INTO v_room_count FROM public.league_rooms WHERE league_tier = p_league_tier;
    v_new_code := UPPER(p_league_tier) || '-ROOM-' || LPAD(v_room_count::TEXT, 3, '0');

    INSERT INTO public.league_rooms (
      room_code, league_tier, max_members, member_count, season_start_at, season_end_at, is_closed
    )
    VALUES (
      v_new_code, p_league_tier, 11, 1, NOW(), NOW() + INTERVAL '7 days', false
    )
    RETURNING * INTO v_room;

    INSERT INTO public.league_room_members (room_id, user_id, weekly_exp)
    VALUES (v_room.id, v_user_id, 0);

    RETURN jsonb_build_object(
      'status', 'created_new',
      'room_id', v_room.id,
      'room_code', v_room.room_code,
      'league_tier', v_room.league_tier,
      'season_start_at', v_room.season_start_at,
      'season_end_at', v_room.season_end_at,
      'member_count', 1,
      'weekly_exp', 0
    );
  ELSE
    -- Masukkan user ke room yang tersedia
    INSERT INTO public.league_room_members (room_id, user_id, weekly_exp)
    VALUES (v_room.id, v_user_id, 0)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    UPDATE public.league_rooms
    SET member_count = member_count + 1,
        is_closed = (member_count + 1 >= 11)
    WHERE id = v_room.id
    RETURNING * INTO v_room;

    RETURN jsonb_build_object(
      'status', 'joined',
      'room_id', v_room.id,
      'room_code', v_room.room_code,
      'league_tier', v_room.league_tier,
      'season_start_at', v_room.season_start_at,
      'season_end_at', v_room.season_end_at,
      'member_count', v_room.member_count,
      'weekly_exp', 0
    );
  END IF;
END;
$$;

-- F. Stored Procedure: Penambahan EXP Mingguan Room
CREATE OR REPLACE FUNCTION public.add_room_member_exp(p_exp INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.league_room_members m
  SET weekly_exp = weekly_exp + p_exp,
      updated_at = NOW()
  FROM public.league_rooms r
  WHERE m.room_id = r.id
    AND m.user_id = v_user_id
    AND r.season_end_at > NOW();
END;
$$;

