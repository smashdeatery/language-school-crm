-- ============================================================
-- Language School CRM — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ENUMS
CREATE TYPE course_level AS ENUM (
  'A1.1','A1.2','A2.1','A2.2',
  'B1.1','B1.2','B2.1','B2.2',
  'C1','C2'
);

CREATE TYPE course_type AS ENUM ('extensive','intensive','private');

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent_unexcused',
  'absent_excused',
  'credit',
  'special'
);

CREATE TYPE enrollment_status AS ENUM ('active','paused','dropped','completed');

-- ============================================================
-- TEACHERS
-- ============================================================
CREATE TABLE teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  color       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default teachers
INSERT INTO teachers (name, color) VALUES
  ('Phuong',    '#3B82F6'),
  ('Aurica',    '#10B981'),
  ('Viktoria',  '#F59E0B'),
  ('Trung',     '#EF4444'),
  ('Arturo',    '#8B5CF6'),
  ('Nico',      '#EC4899'),
  ('Oliver',    '#14B8A6'),
  ('Dzhuma',    '#F97316'),
  ('Pietro',    '#6366F1'),
  ('Klara',     '#84CC16'),
  ('Vertretung', '#94A3B8');

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  level           course_level NOT NULL,
  type            course_type NOT NULL DEFAULT 'extensive',
  total_sessions  INTEGER NOT NULL DEFAULT 24,
  duration_weeks  INTEGER,
  schedule_days   TEXT[] NOT NULL DEFAULT '{}',
  schedule_time   TEXT NOT NULL DEFAULT '',
  start_date      DATE NOT NULL,
  materials       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_number  INTEGER NOT NULL,
  session_date    DATE NOT NULL,
  teacher_id      UUID REFERENCES teachers(id) ON DELETE SET NULL,
  topic           TEXT,
  content_notes   TEXT,
  homework        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, session_number)
);

CREATE INDEX idx_sessions_course_id ON sessions(course_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status          enrollment_status NOT NULL DEFAULT 'active',
  ue_balance      INTEGER NOT NULL DEFAULT 0,
  payment_notes   TEXT,
  enrolled_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  left_at         DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status      attendance_status,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- All authenticated users have full access (tighten per role in v2)
-- ============================================================
ALTER TABLE teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON teachers    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON courses     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON sessions    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON students    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON attendance  FOR ALL TO authenticated USING (true) WITH CHECK (true);
