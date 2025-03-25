import { supabase } from '@/app/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET para listar todos os treinos do usuário
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const user_id = requestUrl.searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercises(*))')
      .eq('user_id', user_id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar treinos' }, { status: 500 });
  }
}

// POST para criar um novo treino
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, day, description, workout_exercises } = body;
    
    if (!user_id || !name || !day) {
      return NextResponse.json(
        { error: 'user_id, name e day são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Inserir o treino
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({ user_id, name, day, description })
      .select()
      .single();
      
    if (workoutError) {
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }
    
    if (workout_exercises && workout_exercises.length > 0) {
      // Preparar os exercícios do treino com o ID do treino criado
      const workoutExercisesData = workout_exercises.map((exercise: any) => ({
        workout_id: workout.id,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_time: exercise.rest_time,
        notes: exercise.notes,
      }));
      
      // Inserir os exercícios do treino
      const { error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercisesData);
        
      if (exerciseError) {
        return NextResponse.json({ error: exerciseError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar treino' }, { status: 500 });
  }
}

// PUT para atualizar um treino existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, day, description, workout_exercises } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do treino é obrigatório' },
        { status: 400 }
      );
    }
    
    // Atualizar o treino
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .update({ name, day, description })
      .eq('id', id)
      .select()
      .single();
      
    if (workoutError) {
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }
    
    if (workout_exercises) {
      // Primeiro exclui todos os exercícios existentes
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', id);
        
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      
      if (workout_exercises.length > 0) {
        // Preparar os novos exercícios do treino
        const workoutExercisesData = workout_exercises.map((exercise: any) => ({
          workout_id: id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_time: exercise.rest_time,
          notes: exercise.notes,
        }));
        
        // Inserir os novos exercícios do treino
        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(workoutExercisesData);
          
        if (exerciseError) {
          return NextResponse.json({ error: exerciseError.message }, { status: 500 });
        }
      }
    }
    
    return NextResponse.json(workout);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar treino' }, { status: 500 });
  }
}

// DELETE para remover um treino
export async function DELETE(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do treino é obrigatório' },
        { status: 400 }
      );
    }
    
    // Primeiro exclui todos os exercícios do treino
    const { error: exerciseError } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', id);
      
    if (exerciseError) {
      return NextResponse.json({ error: exerciseError.message }, { status: 500 });
    }
    
    // Agora exclui o treino
    const { error: workoutError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
      
    if (workoutError) {
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir treino' }, { status: 500 });
  }
} 