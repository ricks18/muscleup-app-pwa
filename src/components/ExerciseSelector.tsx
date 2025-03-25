"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Exercise, MuscleGroup } from "@/app/types";

// Mapeamento de tradução para os grupos musculares
const muscleGroupTranslations: Record<MuscleGroup, string> = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  legs: "Pernas",
  glutes: "Glúteos",
  abs: "Abdômen",
  cardio: "Cardio",
  full_body: "Corpo Inteiro",
  other: "Outros",
};

// Ícones para cada grupo muscular (representado com emojis para simplicidade)
const muscleGroupIcons: Record<MuscleGroup, string> = {
  chest: "💪",
  back: "🔙",
  shoulders: "🏋️‍♂️",
  biceps: "💪",
  triceps: "💪",
  legs: "🦵",
  glutes: "🍑",
  abs: "🧘‍♂️",
  cardio: "🏃‍♂️",
  full_body: "👤",
  other: "❓",
};

interface ExerciseSelectorProps {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  currentExerciseId?: string;
}

export default function ExerciseSelector({
  exercises,
  onSelect,
  currentExerciseId,
}: ExerciseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Agrupar exercícios por grupo muscular
  const exercisesByMuscleGroup = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group]) {
      acc[exercise.muscle_group] = [];
    }
    acc[exercise.muscle_group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Ordenar grupos musculares por número de exercícios (decrescente)
  const muscleGroups = Object.keys(exercisesByMuscleGroup).sort(
    (a, b) =>
      exercisesByMuscleGroup[b].length - exercisesByMuscleGroup[a].length
  ) as MuscleGroup[];

  // Encontrar o exercício atual se houver um ID
  useEffect(() => {
    if (currentExerciseId) {
      const currentExercise = exercises.find(
        (ex) => ex.id === currentExerciseId
      );
      if (currentExercise) {
        setSelectedExercise(currentExercise);
      }
    } else if (exercises.length > 0) {
      setSelectedExercise(exercises[0]);
    }
  }, [currentExerciseId, exercises]);

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    onSelect(exercise);
    setIsOpen(false);
  };

  // Filtrar exercícios baseado na categoria selecionada e termo de busca
  const filteredExercises = exercises.filter((exercise) => {
    const matchesCategory =
      selectedCategory === "todos" ||
      exercise.muscle_group === selectedCategory;
    const matchesSearch =
      searchTerm === "" ||
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.description &&
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full justify-between"
      >
        {selectedExercise ? selectedExercise.name : "Selecionar Exercício"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full h-[90vh] p-0 max-w-md flex flex-col">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Selecionar Exercício</DialogTitle>
          </DialogHeader>

          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar exercício..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto px-4 py-1">
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  selectedCategory === "todos"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                onClick={() => setSelectedCategory("todos")}
              >
                Todos
              </button>
              {muscleGroups.map((group) => (
                <button
                  key={group}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                    selectedCategory === group
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  onClick={() => setSelectedCategory(group)}
                >
                  {muscleGroupIcons[group]} {muscleGroupTranslations[group]}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 pt-2 pb-4">
            <div className="space-y-2">
              {filteredExercises.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum exercício encontrado
                </p>
              ) : (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelect(exercise)}
                    className={`w-full p-3 text-left rounded-md hover:bg-accent transition-colors ${
                      exercise.id === currentExerciseId
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{exercise.name}</h4>
                        {exercise.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm opacity-70 bg-muted px-2 py-0.5 rounded-full">
                        {
                          muscleGroupTranslations[
                            exercise.muscle_group as MuscleGroup
                          ]
                        }
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const suggestUrl = "/exercises/suggest";
                window.location.href = suggestUrl;
              }}
              className="w-full"
            >
              Sugerir novo exercício
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
