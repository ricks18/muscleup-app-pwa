"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/app/types";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

type ProgressSuggestionProps = {
  lastProgress?: Progress;
  onAcceptSuggestion: (suggestion: { weight: number; reps: number }) => void;
};

export default function ProgressSuggestion({
  lastProgress,
  onAcceptSuggestion,
}: ProgressSuggestionProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  if (!lastProgress) {
    return null;
  }

  // Calcular sugestão baseada na última progressão
  const calculateSuggestion = () => {
    const { weight, reps, rpe } = lastProgress;

    // Se não tiver um RPE (Rate of Perceived Exertion), não podemos sugerir
    if (rpe === undefined) {
      return { weight, reps };
    }

    // RPE alto (8-10) significa técnica boa
    // RPE médio (4-7) significa técnica média
    // RPE baixo (1-3) significa técnica ruim

    let suggestedWeight = weight;
    let suggestedReps = reps;

    if (rpe >= 8 && reps >= 8) {
      // Técnica boa e mais de 8 repetições: aumentar 2,5kg
      suggestedWeight = weight + 2.5;
    } else if (rpe >= 4 && rpe <= 7 && reps < 7) {
      // Técnica média e menos de 7 repetições: aumentar 1 repetição
      suggestedReps = reps + 1;
    }

    return { weight: suggestedWeight, reps: suggestedReps };
  };

  const suggestion = calculateSuggestion();
  const hasSuggestion =
    suggestion.weight !== lastProgress.weight ||
    suggestion.reps !== lastProgress.reps;

  const handleApplySuggestion = () => {
    onAcceptSuggestion(suggestion);
    toast({
      title: "Sugestão aplicada",
      description: "Os valores sugeridos foram aplicados ao seu treino",
    });
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSuggestion(!showSuggestion)}
        disabled={!hasSuggestion}
      >
        {hasSuggestion
          ? "Ver Sugestão de Progressão"
          : "Sem Sugestão Disponível"}
      </Button>

      {showSuggestion && hasSuggestion && (
        <div className="mt-2 p-3 bg-muted rounded-md">
          <p className="text-sm mb-2">Sugestão para seu próximo treino:</p>

          {suggestion.weight !== lastProgress.weight && (
            <p className="text-sm">
              <span className="font-medium">Carga:</span> {lastProgress.weight}
              kg → {suggestion.weight}kg
            </p>
          )}

          {suggestion.reps !== lastProgress.reps && (
            <p className="text-sm">
              <span className="font-medium">Repetições:</span>{" "}
              {lastProgress.reps} → {suggestion.reps}
            </p>
          )}

          <Button
            variant="default"
            size="sm"
            className="mt-2"
            onClick={handleApplySuggestion}
          >
            Aplicar Sugestão
          </Button>
        </div>
      )}
    </div>
  );
}
