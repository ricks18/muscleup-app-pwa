-- Script de configuração completo do Supabase
-- Este script deve ser executado no console SQL do Supabase para configurar o banco de dados

-- Criar enumerações
DO $$
BEGIN
  -- Verificar se o tipo muscle_group existe e dropar se for diferente do que precisamos
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'muscle_group'
  ) THEN
    -- Verificar se contém 'arms', o que indica que está no formato antigo
    IF EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'muscle_group')
      AND enumlabel = 'arms'
    ) THEN
      -- Dropar tabelas que dependem deste tipo primeiro
      DROP TABLE IF EXISTS public.exercises CASCADE;
      -- Dropar o tipo para recriar
      DROP TYPE public.muscle_group;
    END IF;
  END IF;

  -- Criar o tipo muscle_group se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'muscle_group'
  ) THEN
    CREATE TYPE public.muscle_group AS ENUM (
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio', 'full_body', 'other'
    );
  END IF;

  -- Verificar se o tipo day_of_week existe e tem o formato correto
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'day_of_week'
  ) THEN
    -- Verificar se contém 'Domingo', o que indica que está no formato PT-BR
    IF EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'day_of_week')
      AND enumlabel = 'Domingo'
    ) THEN
      -- Dropar tabelas que dependem deste tipo primeiro
      DROP TABLE IF EXISTS public.workouts CASCADE;
      -- Dropar o tipo para recriar
      DROP TYPE public.day_of_week;
    END IF;
  END IF;

  -- Criar o tipo day_of_week se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'day_of_week'
  ) THEN
    CREATE TYPE public.day_of_week AS ENUM (
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    );
  END IF;
END $$;

-- Tabela de profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  is_premium BOOLEAN DEFAULT false
);

-- Tabela de exercícios
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  muscle_group muscle_group NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela de treinos
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week day_of_week,
  is_active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela de exercícios do treino
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rest_time INTEGER NOT NULL, -- segundos
  notes TEXT,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(workout_id, exercise_id)
);

-- Tabela de progresso
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL NOT NULL, -- kg
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  notes TEXT,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela de medidas corporais
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Tabela de compartilhamento de treinos
CREATE TABLE IF NOT EXISTS public.shared_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Configurar segurança Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_workouts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se necessário
DROP POLICY IF EXISTS "Exercícios públicos são visíveis para todos" ON public.exercises;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios exercícios" ON public.exercises;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios exercícios" ON public.exercises;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios exercícios" ON public.exercises;

DROP POLICY IF EXISTS "Usuários podem ver seus próprios treinos" ON public.workouts;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios treinos" ON public.workouts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios treinos" ON public.workouts;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios treinos" ON public.workouts;

-- Criar políticas para exercícios
CREATE POLICY "Exercícios públicos são visíveis para todos" 
ON public.exercises FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios exercícios" 
ON public.exercises FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios exercícios" 
ON public.exercises FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios exercícios" 
ON public.exercises FOR DELETE 
USING (auth.uid() = user_id);

-- Criar políticas para treinos
CREATE POLICY "Usuários podem ver seus próprios treinos" 
ON public.workouts FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem inserir seus próprios treinos" 
ON public.workouts FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus próprios treinos" 
ON public.workouts FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios treinos" 
ON public.workouts FOR DELETE 
USING (user_id = auth.uid());

-- Políticas para exercícios do treino
CREATE POLICY "Usuários podem ver exercícios dos seus treinos" 
ON public.workout_exercises FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir exercícios nos seus treinos" 
ON public.workout_exercises FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar exercícios dos seus treinos" 
ON public.workout_exercises FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem excluir exercícios dos seus treinos" 
ON public.workout_exercises FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_id AND user_id = auth.uid()
  )
);

-- Função para inserir exercícios padrão
CREATE OR REPLACE FUNCTION public.insert_default_exercises()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Execute com os privilégios do criador
AS $$
BEGIN
  -- Desativar temporariamente o RLS
  ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
  
  -- Limpar exercícios públicos existentes para evitar duplicação
  DELETE FROM public.exercises WHERE is_public = true;
  
  -- Inserir exercícios padrão
  INSERT INTO public.exercises (name, description, muscle_group, is_public) VALUES
  -- Peito
  ('Supino Reto', 'Exercício para peitoral com barra', 'chest', true),
  ('Supino Inclinado', 'Exercício para peitoral superior', 'chest', true),
  ('Crucifixo', 'Exercício de isolamento para peitoral', 'chest', true),
  ('Crossover', 'Exercício de isolamento para peitoral com cabos', 'chest', true),
  -- Costas
  ('Puxada Frontal', 'Exercício para costas em máquina', 'back', true),
  ('Remada Curvada', 'Exercício para costas com barra', 'back', true),
  ('Remada Unilateral', 'Exercício para costas com halteres', 'back', true),
  ('Pull Down', 'Exercício para costas com cabos', 'back', true),
  -- Pernas
  ('Agachamento', 'Exercício para quadríceps com barra', 'legs', true),
  ('Leg Press', 'Exercício para quadríceps em máquina', 'legs', true),
  ('Cadeira Extensora', 'Exercício de isolamento para quadríceps', 'legs', true),
  ('Cadeira Flexora', 'Exercício para posteriores de coxa', 'legs', true),
  ('Panturrilha em Pé', 'Exercício para panturrilha', 'legs', true),
  -- Ombros
  ('Desenvolvimento', 'Exercício para ombros com barra', 'shoulders', true),
  ('Elevação Lateral', 'Exercício de isolamento para ombros', 'shoulders', true),
  ('Elevação Frontal', 'Exercício para deltóide anterior', 'shoulders', true),
  ('Remada Alta', 'Exercício para trapézio', 'shoulders', true),
  -- Biceps
  ('Rosca Direta', 'Exercício para bíceps com barra', 'biceps', true),
  ('Rosca Alternada', 'Exercício para bíceps com halteres', 'biceps', true),
  -- Triceps
  ('Tríceps Corda', 'Exercício para tríceps com cabo', 'triceps', true),
  ('Tríceps Testa', 'Exercício para tríceps com barra', 'triceps', true),
  -- Abdômen
  ('Abdominal Reto', 'Exercício para abdômen', 'abs', true),
  ('Abdominal Oblíquo', 'Exercício para oblíquos', 'abs', true),
  ('Prancha', 'Exercício isométrico para abdômen', 'abs', true);
  
  -- Reativar o RLS
  ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
  
  RETURN TRUE;
END;
$$;

-- Função para recarregar schema
CREATE OR REPLACE FUNCTION public.reload_schema()
RETURNS void AS $$
BEGIN
  -- Use RAISE INFO em vez de NOTICE
  RAISE INFO 'Schema reloaded successfully';
END;
$$ LANGUAGE plpgsql;

-- Chama a função para inserir exercícios padrão
SELECT insert_default_exercises();

-- Criar trigger para inserir perfil automático quando o usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Adicionar políticas para a tabela profiles
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;

CREATE POLICY "Usuários podem ver seus próprios perfis" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id); 