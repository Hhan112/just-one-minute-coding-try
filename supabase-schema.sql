-- ============================================
-- 1. 用户资料表
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 练习会话表
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  topic_id        TEXT NOT NULL,
  topic_category  TEXT NOT NULL,
  topic_title     TEXT NOT NULL,
  topic_description TEXT,
  total_duration  INTEGER NOT NULL,
  completed_at    BIGINT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.sessions(user_id, date DESC);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. 每轮录音数据表
-- ============================================
CREATE TABLE IF NOT EXISTS public.rounds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  round_number      SMALLINT NOT NULL CHECK (round_number BETWEEN 1 AND 3),
  audio_base64      TEXT NOT NULL,
  audio_duration    INTEGER NOT NULL,
  transcript        TEXT NOT NULL DEFAULT '',
  keywords          TEXT,
  keyword_canvas    TEXT,
  timestamp         BIGINT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rounds_session ON public.rounds(session_id);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rounds"
  ON public.rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own rounds"
  ON public.rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = rounds.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. 打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  topic_id    TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  streak_day  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check_ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check_ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
