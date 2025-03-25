import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
import { isValidUUID, sanitizeInput } from "@/app/lib/auth-utils";

const supabase = createClient();

// GET para obter um exercício específico de um treino
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do exercício do treino é obrigatório" },
        { status: 400 }
      );
    }

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "ID do exercício do treino inválido" },
        { status: 400 }
      );
    }

    // Buscar detalhes do exercício no treino
    const { data, error } = await supabase
      .from("workout_exercises")
      .select(
        `
        *,
        exercise:exercises (
          id, name, description, muscle_group
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar exercício do treino:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Exercício do treino não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar exercício do treino:", error);
    return NextResponse.json(
      { error: "Erro ao buscar exercício do treino" },
      { status: 500 }
    );
  }
}

// PUT para atualizar um exercício específico do treino
export async function PUT(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do exercício do treino é obrigatório" },
        { status: 400 }
      );
    }

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "ID do exercício do treino inválido" },
        { status: 400 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();

    // Validar campos obrigatórios
    if (!body.sets || !body.reps || body.rest_time === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios: sets, reps, rest_time" },
        { status: 400 }
      );
    }

    // Validar valores dos campos
    const sets = parseInt(body.sets);
    const reps = parseInt(body.reps);
    const rest_time = parseInt(body.rest_time);

    if (isNaN(sets) || sets <= 0 || sets > 20) {
      return NextResponse.json(
        { error: "Número de séries deve estar entre 1 e 20" },
        { status: 400 }
      );
    }

    if (isNaN(reps) || reps <= 0 || reps > 100) {
      return NextResponse.json(
        { error: "Número de repetições deve estar entre 1 e 100" },
        { status: 400 }
      );
    }

    if (isNaN(rest_time) || rest_time < 0 || rest_time > 600) {
      return NextResponse.json(
        { error: "Tempo de descanso deve estar entre 0 e 600 segundos" },
        { status: 400 }
      );
    }

    // Opcional: exercício
    let exercise_id = body.exercise_id;
    if (exercise_id && !isValidUUID(exercise_id)) {
      return NextResponse.json(
        { error: "ID do exercício inválido" },
        { status: 400 }
      );
    }

    // Opcional: Notas
    let notes = body.notes ? sanitizeInput(body.notes) : null;

    // Atualizar o exercício do treino
    const updateData: any = {
      sets,
      reps,
      rest_time,
    };

    if (exercise_id) updateData.exercise_id = exercise_id;
    if (notes) updateData.notes = notes;

    const { error } = await supabase
      .from("workout_exercises")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar exercício do treino:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Erro ao atualizar exercício do treino:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar exercício do treino" },
      { status: 500 }
    );
  }
}

// DELETE para remover um exercício específico de um treino
export async function DELETE(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do exercício do treino é obrigatório" },
        { status: 400 }
      );
    }

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "ID do exercício do treino inválido" },
        { status: 400 }
      );
    }

    // Primeiro, excluir todos os registros de progresso relacionados a este exercício do treino
    const { error: progressError } = await supabase
      .from("progress")
      .delete()
      .eq("workout_exercise_id", id);

    if (progressError) {
      console.error("Erro ao excluir progresso do exercício:", progressError);
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    // Agora, excluir o exercício do treino
    const { error } = await supabase
      .from("workout_exercises")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir exercício do treino:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir exercício do treino:", error);
    return NextResponse.json(
      { error: "Erro ao excluir exercício do treino" },
      { status: 500 }
    );
  }
}
