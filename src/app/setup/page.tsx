"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import {
  FaDatabase,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
} from "react-icons/fa";
import { createBrowserClient } from "@/app/lib/supabase";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    count?: number;
    error?: string;
  } | null>(null);
  const router = useRouter();

  // Função para inicializar o banco de dados
  const handleInitializeDatabase = async () => {
    try {
      setLoading(true);
      setResult(null);

      try {
        const response = await fetch("/api/init-database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao inicializar o banco de dados");
        }

        setResult({
          success: true,
          message: data.message || "Banco de dados inicializado com sucesso",
          count: data.count,
        });
      } catch (error: any) {
        console.error("Erro ao chamar a API:", error);
        setResult({
          success: false,
          error: error.message || "Erro de conexão com a API de inicialização",
        });

        // Segunda tentativa - inicializar diretamente
        try {
          console.log("Tentando inicializar diretamente via cliente...");
          const supabase = createBrowserClient();

          // Verificar se a tabela existe
          const { data, error: checkError } = await supabase
            .from("exercises")
            .select("id", { count: "exact", head: true });

          if (
            checkError &&
            (checkError.message.includes("does not exist") ||
              checkError.code === "42P01")
          ) {
            // Tabela não existe, mostrar erro mais informativo
            setResult({
              success: false,
              error:
                "Tabela de exercícios não existe no banco de dados. Por favor, contacte o administrador para criar a estrutura do banco.",
            });
          } else if (!data || data.length === 0) {
            setResult({
              success: false,
              error:
                "Não foi possível inicializar o banco de dados automaticamente. A estrutura existe, mas não há dados.",
            });
          }
        } catch (directError: any) {
          console.error("Erro ao tentar abordagem direta:", directError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para recarregar o schema do banco de dados
  const handleReloadSchema = async () => {
    try {
      setReloading(true);
      setResult(null);

      const supabase = createBrowserClient();

      try {
        // Primeiro, verificar a conexão com o banco
        const { data, error } = await supabase
          .from("exercises")
          .select("id", { count: "exact", head: true })
          .limit(1);

        if (error) {
          throw new Error(error.message);
        }

        // Tentar recarregar os dados via API de inicialização
        const response = await fetch("/api/init-database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const apiResult = await response.json();

        // Atualiza o resultado
        setResult({
          success: response.ok,
          message: response.ok
            ? "Dados recarregados com sucesso. Tente criar um treino agora."
            : "Erro ao recarregar os dados via API",
          error: !response.ok ? apiResult.error : undefined,
        });
      } catch (error: any) {
        console.error("Erro ao recarregar schema:", error);
        setResult({
          success: false,
          error: error.message || "Ocorreu um erro ao recarregar os dados",
        });
      }
    } finally {
      setReloading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mobile-container min-h-screen pt-16 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Configuração do Sistema</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaDatabase className="text-primary" /> Inicialização do Banco de
              Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ferramenta permite inicializar o banco de dados com
              exercícios padrão. Útil quando você está começando do zero ou
              quando precisa restaurar os exercícios básicos no sistema.
            </p>

            {result && (
              <Alert
                variant={result.success ? "default" : "destructive"}
                className="my-4"
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <FaCheckCircle className="h-4 w-4" />
                  ) : (
                    <FaExclamationTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {result.success ? "Sucesso!" : "Erro!"}
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  {result.message || result.error}
                  {result.success && result.count && (
                    <p className="mt-1">
                      {result.count} exercícios foram adicionados ao banco de
                      dados.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={handleInitializeDatabase} disabled={loading}>
                {loading ? "Inicializando..." : "Inicializar Banco de Dados"}
              </Button>

              <Button
                variant="outline"
                onClick={handleReloadSchema}
                disabled={reloading}
                className="flex items-center gap-2"
              >
                <FaSync className={reloading ? "animate-spin" : ""} />
                {reloading ? "Recarregando..." : "Recarregar Schema"}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/workouts")}
              >
                Voltar para Treinos
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
