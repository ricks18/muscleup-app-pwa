"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkoutExercise, Progress } from "@/app/types";
import { useAuth } from "@/app/lib/auth";
import { createBrowserClient } from "@/app/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import ProgressSuggestion from "./ProgressSuggestion";
import { Plus, Minus } from "lucide-react";
import { getUserId } from "@/app/lib/auth-utils";

type RegisterProgressProps = {
  workoutExercise: WorkoutExercise;
  lastProgress?: Progress;
  onProgressRegistered: () => void;
};

type TechniqueRating = "Ruim" | "Regular" | "Boa";

export default function RegisterProgress({
  workoutExercise,
  lastProgress,
  onProgressRegistered,
}: RegisterProgressProps) {
  const { user } = useAuth();
  const [weight, setWeight] = useState(lastProgress?.weight || 0);
  const [reps, setReps] = useState(lastProgress?.reps || workoutExercise.reps);
  const [sets, setSets] = useState(lastProgress?.sets || workoutExercise.sets);
  const [technique, setTechnique] = useState<TechniqueRating>("Regular");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Mapeamento de técnica para valor numérico (para compatibilidade com o banco)
  const techniqueMap: Record<TechniqueRating, number> = {
    Ruim: 3,
    Regular: 6,
    Boa: 9,
  };

  const handleWeightChange = (value: number) => {
    setWeight(Math.max(0, value));
  };

  const handleRepsChange = (value: number) => {
    setReps(Math.max(1, value));
  };

  const handleSaveProgress = async () => {
    // Verificar autenticação usando o utilitário
    const userId = getUserId(user, "/auth");
    if (!userId) return;

    // Validar dados
    if (weight <= 0) {
      toast({
        title: "Peso inválido",
        description: "Por favor, insira um valor válido para o peso.",
        variant: "destructive",
      });
      return;
    }

    if (reps <= 0 || reps > 100) {
      toast({
        title: "Repetições inválidas",
        description: "As repetições devem estar entre 1 e 100.",
        variant: "destructive",
      });
      return;
    }

    if (sets <= 0 || sets > 20) {
      toast({
        title: "Séries inválidas",
        description: "As séries devem estar entre 1 e 20.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();

      const newProgress = {
        user_id: userId,
        workout_exercise_id: workoutExercise.id,
        date: new Date().toISOString().split("T")[0],
        weight,
        reps,
        sets,
        rpe: techniqueMap[technique], // Convertendo a técnica para RPE
      };

      const { error } = await supabase.from("progress").insert(newProgress);

      if (error) {
        throw error;
      }

      toast({
        title: "Progresso registrado",
        description: "Seu progresso foi registrado com sucesso!",
      });

      onProgressRegistered();
      setShowForm(false);
    } catch (error: any) {
      console.error("Erro ao registrar progresso:", error);
      toast({
        title: "Erro ao registrar progresso",
        description:
          error.message || "Ocorreu um erro ao registrar o progresso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAccepted = (suggestion: {
    weight: number;
    reps: number;
  }) => {
    setWeight(suggestion.weight);
    setReps(suggestion.reps);
    setShowForm(true);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Registrar Progresso"}
        </Button>

        {lastProgress && !showForm && (
          <ProgressSuggestion
            lastProgress={lastProgress}
            onAcceptSuggestion={handleSuggestionAccepted}
          />
        )}
      </div>

      {showForm && (
        <div className="mt-4 space-y-4 p-4 bg-card rounded-lg border">
          <h3 className="text-md font-medium">
            {workoutExercise.exercise.name}
          </h3>

          {/* Peso (kg) com botões de incremento/decremento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Peso (kg)</label>
            <div className="flex items-center">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e) =>
                  handleWeightChange(parseFloat(e.target.value) || 0)
                }
                className="flex-1"
              />
              <div className="flex ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeightChange(weight - 2.5)}
                  className="rounded-r-none"
                >
                  -2.5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeightChange(weight + 2.5)}
                  className="rounded-l-none"
                >
                  +2.5
                </Button>
              </div>
            </div>
          </div>

          {/* Repetições com botões de incremento/decremento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Repetições</label>
            <div className="flex items-center">
              <Input
                type="number"
                min="1"
                value={reps}
                onChange={(e) =>
                  handleRepsChange(parseInt(e.target.value) || 1)
                }
                className="flex-1"
              />
              <div className="flex ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRepsChange(reps - 1)}
                  className="rounded-r-none"
                >
                  -1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRepsChange(reps + 1)}
                  className="rounded-l-none"
                >
                  +1
                </Button>
              </div>
            </div>
          </div>

          {/* Técnica de Execução - Botões de seleção */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Técnica</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={technique === "Ruim" ? "default" : "outline"}
                size="sm"
                onClick={() => setTechnique("Ruim")}
                className={
                  technique === "Ruim" ? "bg-red-500 hover:bg-red-600" : ""
                }
              >
                Ruim
              </Button>
              <Button
                variant={technique === "Regular" ? "default" : "outline"}
                size="sm"
                onClick={() => setTechnique("Regular")}
                className={
                  technique === "Regular"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : ""
                }
              >
                Regular
              </Button>
              <Button
                variant={technique === "Boa" ? "default" : "outline"}
                size="sm"
                onClick={() => setTechnique("Boa")}
                className={
                  technique === "Boa" ? "bg-green-500 hover:bg-green-600" : ""
                }
              >
                Boa
              </Button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSaveProgress}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Série"}
          </Button>
        </div>
      )}
    </div>
  );
}
