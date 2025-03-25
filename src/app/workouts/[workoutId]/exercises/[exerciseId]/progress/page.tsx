"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaTrash, FaEdit } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import { useAuth } from "@/app/lib/auth";
import { createBrowserClient } from "@/app/lib/supabase";
import { WorkoutExercise, Progress } from "@/app/types";
import { toast } from "@/components/ui/use-toast";
import RegisterProgress from "@/components/RegisterProgress";
import ProgressSuggestion from "@/components/ProgressSuggestion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type PageParams = {
  params: {
    workoutId: string;
    exerciseId: string;
  };
};

export default function WorkoutExerciseProgressPage({ params }: PageParams) {
  const { workoutId, exerciseId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [workoutExercise, setWorkoutExercise] =
    useState<WorkoutExercise | null>(null);
  const [lastProgress, setLastProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    sets: 0,
    reps: 0,
    rest_time: 0,
  });

  // Redirecionar para página de autenticação se não estiver logado
  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  // Inicializar o formulário de edição quando o exercício for carregado
  useEffect(() => {
    if (workoutExercise) {
      setEditFormData({
        sets: workoutExercise.sets,
        reps: workoutExercise.reps,
        rest_time: workoutExercise.rest_time,
      });
    }
  }, [workoutExercise]);

  // Buscar dados do exercício e último progresso
  useEffect(() => {
    async function fetchData() {
      if (!user || !workoutId || !exerciseId) return;

      try {
        setLoading(true);
        const supabase = createBrowserClient();

        // Buscar o exercício do treino - Modificado para não usar .single()
        const { data: exercisesData, error: exerciseError } = await supabase
          .from("workout_exercises")
          .select(
            `
            id, 
            workout_id, 
            exercise_id, 
            sets, 
            reps, 
            rest_time,
            order_number,
            exercise:exercises (
              id, 
              name, 
              description, 
              muscle_group
            )
          `
          )
          .eq("id", exerciseId)
          .eq("workout_id", workoutId);

        if (exerciseError) {
          console.error("Erro ao buscar exercício:", exerciseError);
          toast({
            title: "Erro ao carregar exercício",
            description: exerciseError.message,
            variant: "destructive",
          });
          router.back();
          return;
        }

        // Verificar se temos resultados
        if (!exercisesData || exercisesData.length === 0) {
          toast({
            title: "Exercício não encontrado",
            description: "O exercício solicitado não foi encontrado.",
            variant: "destructive",
          });
          router.back();
          return;
        }

        // Usar o primeiro resultado
        setWorkoutExercise(exercisesData[0] as unknown as WorkoutExercise);

        // Buscar último progresso para este exercício
        const { data: progressData, error: progressError } = await supabase
          .from("progress")
          .select("*")
          .eq("workout_exercise_id", exerciseId)
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1);

        if (progressError) {
          console.error("Erro ao buscar progresso:", progressError);
        } else if (progressData && progressData.length > 0) {
          setLastProgress(progressData[0] as Progress);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao buscar os dados do exercício.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, workoutId, exerciseId, router]);

  // Callback quando o progresso for registrado
  const handleProgressRegistered = async () => {
    // Atualizar último progresso
    if (!user || !exerciseId) return;

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("workout_exercise_id", exerciseId)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setLastProgress(data[0] as Progress);
      }
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
    }
  };

  // Remover exercício do treino
  const handleRemoveExercise = async () => {
    if (!exerciseId || !user) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workout-exercises?id=${exerciseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir exercício");
      }

      toast({
        title: "Exercício removido",
        description: "O exercício foi removido do treino com sucesso.",
      });

      // Navegar de volta para a página do treino
      router.push(`/workouts`);
    } catch (error: any) {
      console.error("Erro ao excluir exercício:", error);
      toast({
        title: "Erro ao excluir exercício",
        description: error.message || "Ocorreu um erro ao excluir o exercício.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Editar exercício do treino
  const handleEditExercise = async () => {
    if (!exerciseId || !user || !workoutExercise) return;

    setIsEditing(true);

    try {
      const response = await fetch(`/api/workout-exercises`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: exerciseId,
          exercise_id: workoutExercise.exercise_id,
          sets: editFormData.sets,
          reps: editFormData.reps,
          rest_time: editFormData.rest_time,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao editar exercício");
      }

      const updatedExercise = await response.json();

      // Atualizar o estado local
      if (workoutExercise) {
        setWorkoutExercise({
          ...workoutExercise,
          sets: editFormData.sets,
          reps: editFormData.reps,
          rest_time: editFormData.rest_time,
        });
      }

      toast({
        title: "Exercício atualizado",
        description: "O exercício foi atualizado com sucesso.",
      });

      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao editar exercício:", error);
      toast({
        title: "Erro ao editar exercício",
        description: error.message || "Ocorreu um erro ao editar o exercício.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mobile-container min-h-screen pt-16 pb-24">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            <FaArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Registrar Progresso</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : workoutExercise ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{workoutExercise.exercise.name}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <FaEdit className="mr-1" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <FaTrash className="mr-1" />
                  Remover
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Detalhes do Exercício:
                </p>
                <p>
                  <span className="font-medium">Séries:</span>{" "}
                  {workoutExercise.sets}
                </p>
                <p>
                  <span className="font-medium">Repetições:</span>{" "}
                  {workoutExercise.reps}
                </p>
                <p>
                  <span className="font-medium">Descanso:</span>{" "}
                  {workoutExercise.rest_time}s
                </p>
              </div>

              {lastProgress && (
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Último Progresso:</p>
                  <p>
                    <span className="font-medium">Data:</span>{" "}
                    {new Date(lastProgress.date).toLocaleDateString("pt-BR")}
                  </p>
                  <p>
                    <span className="font-medium">Carga:</span>{" "}
                    {lastProgress.weight}kg
                  </p>
                  <p>
                    <span className="font-medium">Repetições:</span>{" "}
                    {lastProgress.reps}
                  </p>
                  <p>
                    <span className="font-medium">Séries:</span>{" "}
                    {lastProgress.sets}
                  </p>
                  <p>
                    <span className="font-medium">Técnica (RPE):</span>{" "}
                    {lastProgress.rpe || "N/A"}
                  </p>
                </div>
              )}

              <RegisterProgress
                workoutExercise={workoutExercise}
                lastProgress={lastProgress || undefined}
                onProgressRegistered={handleProgressRegistered}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground text-center mb-4">
              Exercício não encontrado.
            </p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        )}
      </main>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover exercício do treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente
              este exercício do treino atual e todo o histórico de progresso
              associado a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveExercise}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de edição de exercício */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Exercício</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Séries</label>
              <Input
                type="number"
                min="1"
                value={editFormData.sets}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    sets: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Repetições</label>
              <Input
                type="number"
                min="1"
                value={editFormData.reps}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    reps: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descanso (segundos)</label>
              <Input
                type="number"
                min="0"
                value={editFormData.rest_time}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    rest_time: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditExercise} disabled={isEditing}>
              {isEditing ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
