import { supabase } from '@/app/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET para listar o progresso do usuário
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const user_id = requestUrl.searchParams.get('user_id');
    const exercise_id = requestUrl.searchParams.get('exercise_id');
    
    if (!user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }
    
    let query = supabase
      .from('progress')
      .select('*, exercises(*)')
      .eq('user_id', user_id)
      .order('date', { ascending: false });
      
    if (exercise_id) {
      query = query.eq('exercise_id', exercise_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar progresso' }, { status: 500 });
  }
}

// POST para registrar novo progresso
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, exercise_id, weight, reps, sets, technique_rating, notes, date } = body;
    
    if (!user_id || !exercise_id || !date) {
      return NextResponse.json(
        { error: 'user_id, exercise_id e date são obrigatórios' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('progress')
      .insert({
        user_id,
        exercise_id,
        weight,
        reps,
        sets,
        technique_rating,
        notes,
        date
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar progresso' }, { status: 500 });
  }
}

// PUT para atualizar um registro de progresso
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, weight, reps, sets, technique_rating, notes } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('progress')
      .update({
        weight,
        reps,
        sets,
        technique_rating,
        notes
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar progresso' }, { status: 500 });
  }
}

// DELETE para remover um registro de progresso
export async function DELETE(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const id = requestUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('progress')
      .delete()
      .eq('id', id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir registro de progresso' }, { status: 500 });
  }
} 