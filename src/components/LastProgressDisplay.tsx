"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/app/lib/supabase";
import { Progress } from "@/app/types";
import { useAuth } from "@/app/lib/auth";
import { Button } from "@/components/ui/button";

type LastProgressDisplayProps = {
  workoutExerciseId: string;
};

export default function LastProgressDisplay({
  workoutExerciseId,
}: LastProgressDisplayProps) {
  const [lastProgress, setLastProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchLastProgress() {
      if (!user || !workoutExerciseId) return;

      try {
        setLoading(true);
        const supabase = createBrowserClient();

        // Buscar a última progressão registrada para este exercício específico
        const { data, error } = await supabase
          .from("progress")
          .select("*")
          .eq("workout_exercise_id", workoutExerciseId)
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Erro ao buscar último progresso:", error);
          return;
        }

        if (data && data.length > 0) {
          setLastProgress(data[0] as Progress);
        }
      } catch (error) {
        console.error("Erro ao buscar último progresso:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLastProgress();
  }, [user, workoutExerciseId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Carregando...</p>;
  }

  if (!lastProgress) {
    return (
      <div className="mt-2 pt-2 border-t border-dashed border-border">
        <p className="text-xs text-muted-foreground">
          Nenhum progresso registrado ainda
        </p>
        <Button variant="ghost" size="sm" className="w-full mt-1 text-xs">
          Registrar primeiro progresso
        </Button>
      </div>
    );
  }

  // Função para classificar o RPE
  const getRpeLabel = (rpe: number | undefined) => {
    if (!rpe) return "N/A";
    if (rpe >= 8) return "Boa";
    if (rpe >= 4) return "Média";
    return "Ruim";
  };

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-border">
      <p className="text-xs text-muted-foreground">Último treino:</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">
            <span className="font-medium">{lastProgress.weight}kg</span> x{" "}
            {lastProgress.reps} reps
          </p>
        </div>
        <div className="text-xs">
          <span
            className={`px-2 py-0.5 rounded-full ${
              lastProgress.rpe && lastProgress.rpe >= 8
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : lastProgress.rpe && lastProgress.rpe >= 4
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            Técnica: {getRpeLabel(lastProgress.rpe)}
          </span>
        </div>
      </div>
    </div>
  );
}
