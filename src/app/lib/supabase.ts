import { createClient } from "@supabase/supabase-js";
import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
import { Database } from "@/types/supabase";

// Credenciais fixas do Supabase
const supabaseUrl = "https://mrljgoonuzenvhtcxnjz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybGpnb29udXplbnZodGN4bmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzgwODQsImV4cCI6MjA1NTg1NDA4NH0.5tswYPOWxJTXCWwI0GFEEAoXOGX6g53dEppjfEcpA7s";

// Cliente para uso no servidor com chave de API
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Singleton para garantir apenas uma instância do cliente no navegador
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

// Cliente para uso no cliente com cookies para autenticação
export const createBrowserClient = () => {
  if (typeof window === "undefined") {
    // No lado do servidor, crie um cliente regular
    return createClient<Database>(supabaseUrl, supabaseKey);
  }

  // No lado do cliente, crie apenas uma instância
  if (!browserClient) {
    browserClient = createBrowserClientSSR<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          const cookies = document.cookie.split(";").map((c) => c.trim());
          const cookie = cookies.find((c) => c.startsWith(`${name}=`));
          return cookie ? cookie.split("=")[1] : undefined;
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; ${
            options.secure ? "secure; " : ""
          }${options.sameSite ? `samesite=${options.sameSite}; ` : ""}${
            options.domain ? `domain=${options.domain}; ` : ""
          }${options.maxAge ? `max-age=${options.maxAge}; ` : ""}${
            options.expires ? `expires=${options.expires.toUTCString()}; ` : ""
          }`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${
            options.secure ? "secure; " : ""
          }${options.sameSite ? `samesite=${options.sameSite}; ` : ""}${
            options.domain ? `domain=${options.domain}; ` : ""
          }`;
        },
      },
    });
  }

  return browserClient;
};
