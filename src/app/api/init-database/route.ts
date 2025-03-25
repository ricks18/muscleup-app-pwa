import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Credenciais fixas do Supabase
const supabaseUrl = "https://mrljgoonuzenvhtcxnjz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybGpnb29udXplbnZodGN4bmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzgwODQsImV4cCI6MjA1NTg1NDA4NH0.5tswYPOWxJTXCWwI0GFEEAoXOGX6g53dEppjfEcpA7s";

// Usar o cliente regular para verificações
const regularClient = createClient(supabaseUrl, supabaseKey);

// Rota POST para inicializar o banco de dados
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    console.log("Iniciando inicialização do banco de dados...");

    // Verificar se a tabela de exercises já tem dados
    const { count, error: countError } = await supabase
      .from("exercises")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Erro ao verificar tabela:", countError);
      return NextResponse.json(
        { error: "Erro ao verificar banco de dados" },
        { status: 500 }
      );
    }

    // Verificar se o campo status existe na tabela exercises
    const { data: exercisesColumns, error: columnsError } = await supabase.rpc(
      "get_table_columns",
      { table_name: "exercises" }
    );

    if (columnsError) {
      console.log(
        "Erro ao verificar colunas da tabela exercises:",
        columnsError
      );
      // Continuar mesmo com erro, já que a função RPC pode não existir ainda
    } else {
      // Verificar se a coluna status existe
      const hasStatusColumn = exercisesColumns?.some(
        (column: any) => column.column_name === "status"
      );

      if (!hasStatusColumn) {
        // Adicionar coluna status à tabela exercises
        const { error: alterTableError } = await supabase.rpc("execute_sql", {
          sql_query:
            "ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'",
        });

        if (alterTableError) {
          console.error("Erro ao adicionar coluna status:", alterTableError);
        } else {
          console.log("Coluna status adicionada com sucesso");
        }
      }
    }

    // Verificar se o campo is_admin existe na tabela profiles
    const { data: profilesColumns, error: profilesColumnsError } =
      await supabase.rpc("get_table_columns", { table_name: "profiles" });

    if (profilesColumnsError) {
      console.log(
        "Erro ao verificar colunas da tabela profiles:",
        profilesColumnsError
      );
      // Continuar mesmo com erro
    } else {
      // Verificar se a coluna is_admin existe
      const hasAdminColumn = profilesColumns?.some(
        (column: any) => column.column_name === "is_admin"
      );

      if (!hasAdminColumn) {
        // Adicionar coluna is_admin à tabela profiles
        const { error: alterProfilesError } = await supabase.rpc(
          "execute_sql",
          {
            sql_query:
              "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false",
          }
        );

        if (alterProfilesError) {
          console.error(
            "Erro ao adicionar coluna is_admin:",
            alterProfilesError
          );
        } else {
          console.log("Coluna is_admin adicionada com sucesso");
        }
      }
    }

    // Criar função RPC para verificar e obter colunas da tabela (se não existir)
    const { error: createRpcError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
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
            AND table_name = get_table_columns.table_name;
        END;
        $$;
        `,
    });

    if (createRpcError) {
      console.log("Erro ao criar função get_table_columns:", createRpcError);
      // Continuar mesmo com erro
    }

    // Criar função RPC para executar SQL (se não existir)
    const { error: createExecSqlError } = await supabase.rpc("execute_sql", {
      sql_query: `
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
        `,
    });

    if (createExecSqlError) {
      console.log("Erro ao criar função execute_sql:", createExecSqlError);
      // Continuar mesmo com erro
    }

    // Se já tem exercícios, não precisa inicializar novamente
    if (count && count > 0) {
      console.log("Banco de dados já está inicializado com exercícios padrão.");
      return NextResponse.json({ message: "Banco já inicializado" });
    }

    // Chamar a função RPC para inserir exercícios padrão
    console.log("Chamando RPC para inserir exercícios padrão...");
    const { data, error } = await supabase.rpc("insert_default_exercises");

    if (error) {
      console.error("Erro ao chamar RPC:", error);
      return NextResponse.json(
        { error: "Erro ao inicializar banco de dados" },
        { status: 500 }
      );
    }

    console.log("Banco de dados inicializado com sucesso!", data);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro na rota de inicialização:", e);
    return NextResponse.json(
      { error: "Erro ao inicializar banco de dados" },
      { status: 500 }
    );
  }
}
