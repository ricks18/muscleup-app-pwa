import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Credenciais fixas do Supabase
const supabaseUrl = "https://mrljgoonuzenvhtcxnjz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybGpnb29udXplbnZodGN4bmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzgwODQsImV4cCI6MjA1NTg1NDA4NH0.5tswYPOWxJTXCWwI0GFEEAoXOGX6g53dEppjfEcpA7s";

// Rotas que não precisam de autenticação
const publicRoutes = ["/auth", "/"];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // Criar o cliente servidor com as credenciais explícitas
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: any) {
        res.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // URL atual
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Verificar se é uma rota pública ou se tentando acessar /auth já estando logado
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = pathname.startsWith("/auth");

  // Se é rota de autenticação e já está logado, redirecionar para a home
  if (isAuthRoute && session) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Se não é rota pública e não está logado, redirecionar para login
  if (!isPublicRoute && !session) {
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return res;
}

// Configuração para rodar o middleware em todas as rotas exceto _next e API
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|api).*)"],
};
