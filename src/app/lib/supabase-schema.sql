-- Create tables

-- Profiles table (extends the auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Muscle groups enum
CREATE TYPE muscle_group AS ENUM (
  'chest', 
  'back', 
  'shoulders', 
  'biceps', 
  'triceps', 
  'legs', 
  'glutes',
  'abs',
  'cardio',
  'full_body',
  'other'
);

-- Days of week enum
CREATE TYPE day_of_week AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  muscle_group muscle_group NOT NULL,
  image_url TEXT,
  video_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS exercises_approved_idx ON exercises(is_public);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week day_of_week,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id);
CREATE INDEX IF NOT EXISTS workouts_day_of_week_idx ON workouts(day_of_week);

-- Workout Exercises junction table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rest_time INTEGER NOT NULL, -- seconds
  notes TEXT,
  "order" INTEGER NOT NULL,
  UNIQUE(workout_id, exercise_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_id_idx ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS workout_exercises_order_idx ON workout_exercises("order");

-- Progress tracking table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL NOT NULL, -- kg
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  notes TEXT,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS progress_user_id_idx ON progress(user_id);
CREATE INDEX IF NOT EXISTS progress_workout_exercise_id_idx ON progress(workout_exercise_id);
CREATE INDEX IF NOT EXISTS progress_date_idx ON progress(date);

-- Body measurements table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL, -- kg
  chest DECIMAL, -- cm
  waist DECIMAL, -- cm
  hips DECIMAL, -- cm
  left_arm DECIMAL, -- cm
  right_arm DECIMAL, -- cm
  left_thigh DECIMAL, -- cm
  right_thigh DECIMAL, -- cm
  left_calf DECIMAL, -- cm
  right_calf DECIMAL, -- cm
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS body_measurements_user_id_idx ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS body_measurements_date_idx ON body_measurements(date);

-- Shared workouts table
CREATE TABLE IF NOT EXISTS shared_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS shared_workouts_workout_id_idx ON shared_workouts(workout_id);
CREATE INDEX IF NOT EXISTS shared_workouts_shared_by_idx ON shared_workouts(shared_by);
CREATE INDEX IF NOT EXISTS shared_workouts_shared_with_idx ON shared_workouts(shared_with);
CREATE INDEX IF NOT EXISTS shared_workouts_share_code_idx ON shared_workouts(share_code);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_workouts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Exercises policies
CREATE POLICY "Exercises are viewable by everyone if approved" 
ON exercises FOR SELECT 
USING (is_public = TRUE OR added_by = auth.uid());

CREATE POLICY "Premium users can insert exercises" 
ON exercises FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_premium = TRUE
  )
);

CREATE POLICY "Users can update their own non-approved exercises" 
ON exercises FOR UPDATE 
USING (added_by = auth.uid() AND is_public = FALSE);

-- Workouts policies
CREATE POLICY "Users can view their own workouts" 
ON workouts FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own workouts" 
ON workouts FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workouts" 
ON workouts FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workouts" 
ON workouts FOR DELETE 
USING (user_id = auth.uid());

-- Workout exercises policies
CREATE POLICY "Users can view workout exercises from their workouts" 
ON workout_exercises FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert workout exercises to their workouts" 
ON workout_exercises FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update workout exercises in their workouts" 
ON workout_exercises FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete workout exercises from their workouts" 
ON workout_exercises FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

-- Progress policies
CREATE POLICY "Users can view their own progress" 
ON progress FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress" 
ON progress FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" 
ON progress FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own progress" 
ON progress FOR DELETE 
USING (user_id = auth.uid());

-- Body measurements policies
CREATE POLICY "Users can view their own measurements" 
ON body_measurements FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own measurements" 
ON body_measurements FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own measurements" 
ON body_measurements FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own measurements" 
ON body_measurements FOR DELETE 
USING (user_id = auth.uid());

-- Shared workouts policies
CREATE POLICY "Users can view workouts shared with them" 
ON shared_workouts FOR SELECT 
USING (shared_by = auth.uid() OR shared_with = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can share their own workouts" 
ON shared_workouts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own shared workouts" 
ON shared_workouts FOR UPDATE 
USING (shared_by = auth.uid());

CREATE POLICY "Users can delete their own shared workouts" 
ON shared_workouts FOR DELETE 
USING (shared_by = auth.uid());

-- Create some initial exercises
INSERT INTO exercises (name, description, muscle_group, is_public)
VALUES 
  ('Supino Reto', 'Deite-se em um banco reto e pressione a barra para cima', 'chest', TRUE),
  ('Agachamento', 'Posicione a barra nos ombros e agache até as coxas ficarem paralelas ao chão', 'legs', TRUE),
  ('Levantamento Terra', 'Segure a barra no chão e levante usando as pernas e costas', 'back', TRUE),
  ('Rosca Direta', 'Em pé, segure os halteres e faça a flexão dos cotovelos', 'biceps', TRUE),
  ('Tríceps Corda', 'Puxe a corda para baixo, estendendo os cotovelos', 'triceps', TRUE),
  ('Desenvolvimento', 'Sentado ou em pé, pressione os halteres para cima', 'shoulders', TRUE),
  ('Puxada Frontal', 'Sentado, puxe a barra para baixo até a altura do queixo', 'back', TRUE),
  ('Leg Press', 'Sentado na máquina, empurre a plataforma com os pés', 'legs', TRUE),
  ('Crucifixo', 'Deitado no banco, abra os braços com halteres e junte no centro', 'chest', TRUE),
  ('Abdominal', 'Deitado, flexione o tronco elevando os ombros do chão', 'abs', TRUE)
ON CONFLICT DO NOTHING; 