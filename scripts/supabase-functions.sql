-- Remover a função existente antes de recriá-la
DROP FUNCTION IF EXISTS public.get_table_columns(text);

-- Função para obter colunas de uma tabela (corrigida para evitar ambiguidade)
CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    columns.column_name::text, 
    columns.data_type::text
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public'
    AND columns.table_name = p_table_name;
END;
$$;

-- Remover a função execute_sql se existir
DROP FUNCTION IF EXISTS public.execute_sql(text);

-- Função para executar SQL dinâmico com permissões elevadas
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Adicionar a coluna 'status' na tabela exercises (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exercises'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.exercises 
    ADD COLUMN status TEXT DEFAULT 'approved';
    
    UPDATE public.exercises
    SET status = 'approved'
    WHERE status IS NULL;
  END IF;
END$$;

-- Remover a função suggest_exercise se existir
DROP FUNCTION IF EXISTS public.suggest_exercise(TEXT, TEXT, TEXT, UUID);

-- Atualizar ou criar função para sugerir exercícios
CREATE OR REPLACE FUNCTION public.suggest_exercise(
  p_name TEXT,
  p_description TEXT,
  p_muscle_group TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  result JSON;
BEGIN
  INSERT INTO public.exercises (name, description, muscle_group, status, created_by)
  VALUES (p_name, p_description, p_muscle_group, 'pending', p_user_id)
  RETURNING id INTO new_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Exercício sugerido com sucesso! Aguardando aprovação.',
    'exercise_id', new_id
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Erro ao sugerir exercício: ' || SQLERRM
  );
END;
$$;

-- Adicionar coluna created_by à tabela exercises se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exercises'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.exercises 
    ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns TO anon;
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;
GRANT EXECUTE ON FUNCTION public.suggest_exercise TO authenticated; 