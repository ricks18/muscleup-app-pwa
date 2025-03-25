import { supabase } from '@/app/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET para listar as medidas corporais do usuário
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const user_id = requestUrl.searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false });
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar medidas corporais' }, { status: 500 });
  }
}

// POST para registrar novas medidas corporais
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      date, 
      weight, 
      height, 
      chest, 
      waist, 
      hips, 
      biceps_left, 
      biceps_right, 
      thigh_left, 
      thigh_right, 
      calf_left, 
      calf_right, 
      shoulders,
      notes 
    } = body;
    
    if (!user_id || !date) {
      return NextResponse.json(
        { error: 'user_id e date são obrigatórios' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id,
        date,
        weight,
        height,
        chest,
        waist,
        hips,
        biceps_left,
        biceps_right,
        thigh_left,
        thigh_right,
        calf_left,
        calf_right,
        shoulders,
        notes
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar medidas corporais' }, { status: 500 });
  }
}

// PUT para atualizar medidas corporais
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      weight, 
      height, 
      chest, 
      waist, 
      hips, 
      biceps_left, 
      biceps_right, 
      thigh_left, 
      thigh_right, 
      calf_left, 
      calf_right, 
      shoulders,
      notes 
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('body_measurements')
      .update({
        weight,
        height,
        chest,
        waist,
        hips,
        biceps_left,
        biceps_right,
        thigh_left,
        thigh_right,
        calf_left,
        calf_right,
        shoulders,
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
    return NextResponse.json({ error: 'Erro ao atualizar medidas corporais' }, { status: 500 });
  }
}

// DELETE para remover um registro de medidas corporais
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
      .from('body_measurements')
      .delete()
      .eq('id', id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir registro de medidas corporais' }, { status: 500 });
  }
} 