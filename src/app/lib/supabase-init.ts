import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Credenciais fixas do Supabase
const supabaseUrl = "https://mrljgoonuzenvhtcxnjz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybGpnb29udXplbnZodGN4bmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzgwODQsImV4cCI6MjA1NTg1NDA4NH0.5tswYPOWxJTXCWwI0GFEEAoXOGX6g53dEppjfEcpA7s";

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Inicializa o banco de dados com exercícios padrão
 * Esta função deve ser executada apenas uma vez, quando a aplicação é instalada
 */
export async function initializeDatabase() {
  try {
    // Verificar se as tabelas já existem
    // Como não podemos criar tabelas via API diretamente, vamos verificar se elas existem
    // e retornar informações úteis para o usuário

    // Checar tabela exercises
    const { data: exercisesCheck, error: exercisesError } = await supabaseAdmin
      .from("exercises")
      .select("id")
      .limit(1);

    // Checar tabela workouts
    const { data: workoutsCheck, error: workoutsError } = await supabaseAdmin
      .from("workouts")
      .select("id")
      .limit(1);

    // Determinar quais tabelas precisam ser criadas
    const tablesMissing = [];
    if (exercisesError && exercisesError.code === "42P01") {
      tablesMissing.push("exercises");
    }

    if (workoutsError && workoutsError.code === "42P01") {
      tablesMissing.push("workouts");
    }

    // Se há tabelas faltando, retornar essa informação
    if (tablesMissing.length > 0) {
      return {
        success: false,
        tablesRequired: tablesMissing,
        message: `As seguintes tabelas precisam ser criadas no Supabase: ${tablesMissing.join(
          ", "
        )}`,
      };
    }

    // Se já existirem exercícios, não faça nada
    if (exercisesCheck && exercisesCheck.length > 0) {
      console.log("Banco de dados já inicializado");
      return { success: true, message: "Banco de dados já inicializado" };
    }

    // Exercícios padrão para inserir no banco
    const defaultExercises = [
      // Peito
      {
        name: "Supino Reto",
        description: "Exercício para peitoral com barra",
        muscle_group: "chest",
        is_public: true,
      },
      {
        name: "Supino Inclinado",
        description: "Exercício para peitoral superior",
        muscle_group: "chest",
        is_public: true,
      },
      {
        name: "Crucifixo",
        description: "Exercício de isolamento para peitoral",
        muscle_group: "chest",
        is_public: true,
      },
      {
        name: "Crossover",
        description: "Exercício de isolamento para peitoral com cabos",
        muscle_group: "chest",
        is_public: true,
      },

      // Costas
      {
        name: "Puxada Frontal",
        description: "Exercício para costas em máquina",
        muscle_group: "back",
        is_public: true,
      },
      {
        name: "Remada Curvada",
        description: "Exercício para costas com barra",
        muscle_group: "back",
        is_public: true,
      },
      {
        name: "Remada Unilateral",
        description: "Exercício para costas com halteres",
        muscle_group: "back",
        is_public: true,
      },
      {
        name: "Pull Down",
        description: "Exercício para costas com cabos",
        muscle_group: "back",
        is_public: true,
      },

      // Pernas
      {
        name: "Agachamento",
        description: "Exercício para quadríceps com barra",
        muscle_group: "legs",
        is_public: true,
      },
      {
        name: "Leg Press",
        description: "Exercício para quadríceps em máquina",
        muscle_group: "legs",
        is_public: true,
      },
      {
        name: "Cadeira Extensora",
        description: "Exercício de isolamento para quadríceps",
        muscle_group: "legs",
        is_public: true,
      },
      {
        name: "Cadeira Flexora",
        description: "Exercício para posteriores de coxa",
        muscle_group: "legs",
        is_public: true,
      },
      {
        name: "Panturrilha em Pé",
        description: "Exercício para panturrilha",
        muscle_group: "legs",
        is_public: true,
      },

      // Ombros
      {
        name: "Desenvolvimento",
        description: "Exercício para ombros com barra",
        muscle_group: "shoulders",
        is_public: true,
      },
      {
        name: "Elevação Lateral",
        description: "Exercício de isolamento para ombros",
        muscle_group: "shoulders",
        is_public: true,
      },
      {
        name: "Elevação Frontal",
        description: "Exercício para deltóide anterior",
        muscle_group: "shoulders",
        is_public: true,
      },
      {
        name: "Remada Alta",
        description: "Exercício para trapézio",
        muscle_group: "shoulders",
        is_public: true,
      },

      // Braços
      {
        name: "Rosca Direta",
        description: "Exercício para bíceps com barra",
        muscle_group: "biceps",
        is_public: true,
      },
      {
        name: "Rosca Alternada",
        description: "Exercício para bíceps com halteres",
        muscle_group: "biceps",
        is_public: true,
      },
      {
        name: "Tríceps Corda",
        description: "Exercício para tríceps com cabo",
        muscle_group: "triceps",
        is_public: true,
      },
      {
        name: "Tríceps Testa",
        description: "Exercício para tríceps com barra",
        muscle_group: "triceps",
        is_public: true,
      },

      // Abdômen
      {
        name: "Abdominal Reto",
        description: "Exercício para abdômen",
        muscle_group: "abs",
        is_public: true,
      },
      {
        name: "Abdominal Oblíquo",
        description: "Exercício para oblíquos",
        muscle_group: "abs",
        is_public: true,
      },
      {
        name: "Prancha",
        description: "Exercício isométrico para abdômen",
        muscle_group: "abs",
        is_public: true,
      },
    ];

    // Inserir exercícios
    const { error: insertError } = await supabaseAdmin
      .from("exercises")
      .insert(defaultExercises);

    if (insertError) {
      console.error("Erro ao inserir exercícios padrão:", insertError);
      return { success: false, error: insertError };
    }

    console.log("Banco de dados inicializado com sucesso!");
    return {
      success: true,
      message: "Banco de dados inicializado com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    return { success: false, error };
  }
}
