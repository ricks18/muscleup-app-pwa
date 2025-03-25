"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import { useAuth } from "@/app/lib/auth";
import { createBrowserClient } from "@/app/lib/supabase";
import ExerciseSelector from "@/components/ExerciseSelector";
import { Exercise } from "@/app/types";

// Tipo para exercício do treino (com séries e repetições)
interface WorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  rest_time: number;
}

// Tipo para exercício do treino no banco de dados
interface WorkoutExerciseData {
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  rest_time: number;
  order_number: number;
}

// Dias da semana
const weekdayOptions = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

export default function CreateWorkoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Estado para o formulário
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [fetchingExercises, setFetchingExercises] = useState(true);

  // Redirecionar para página de autenticação se não estiver logado
  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  // Buscar exercícios disponíveis
  useEffect(() => {
    async function fetchExercises() {
      try {
        console.log("Iniciando busca de exercícios...");
        setFetchingExercises(true);

        const supabase = createBrowserClient();

        // Tentativa de inicializar o banco antes de qualquer consulta
        try {
          console.log(
            "Tentando inicializar o banco de dados através da API..."
          );
          const initResponse = await fetch("/api/init-database", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const initResult = await initResponse.json();
          console.log("Resultado da inicialização:", initResult);

          // Se houve erro, mostrar, mas continuar a execução
          if (!initResponse.ok) {
            console.warn("Aviso ao inicializar banco:", initResult.error);
          }
        } catch (initError) {
          console.warn("Erro ao tentar inicializar banco:", initError);
          // Continua a execução mesmo com erro
        }

        // Verificar conexão com Supabase
        let connectionTest = null;
        let connectionError = null;

        try {
          const result = await supabase
            .from("exercises")
            .select("id", { count: "exact", head: true });

          connectionTest = result.data;
          connectionError = result.error;
        } catch (err) {
          console.error("Erro ao verificar conexão:", err);
          connectionError = {
            message: err instanceof Error ? err.message : "Erro desconhecido",
          };
        }

        console.log("Teste de conexão:", connectionTest, connectionError);

        if (connectionError) {
          console.error("Erro na conexão com Supabase:", connectionError);
          toast({
            title: "Erro na conexão com o banco de dados",
            description:
              connectionError.message ||
              "Verifique a conexão e inicialize o banco de dados",
            variant: "destructive",
          });
          setFetchingExercises(false);
          return;
        }

        // Buscar exercícios com filtro para is_public=true
        let data = null;
        let error = null;

        try {
          const result = await supabase
            .from("exercises")
            .select(
              "id, name, muscle_group, description, is_public, created_at"
            )
            .eq("is_public", true)
            .order("name");

          data = result.data;
          error = result.error;
        } catch (err) {
          console.error("Erro na busca de exercícios:", err);
          error = {
            message: err instanceof Error ? err.message : "Erro desconhecido",
          };
        }

        console.log("Resultado da busca:", data, error);

        if (error) {
          console.error("Erro ao buscar exercícios:", error);
          toast({
            title: "Erro ao carregar exercícios",
            description: `${
              error.message || "Erro desconhecido"
            }. Tente inicializar o banco de dados através da página de configuração.`,
            variant: "destructive",
          });
          setFetchingExercises(false);
          return;
        }

        if (data && data.length > 0) {
          console.log(`Encontrados ${data.length} exercícios`);
          setExercises(data);
        } else {
          console.log("Nenhum exercício encontrado");
          toast({
            title: "Nenhum exercício encontrado",
            description:
              "Acesse a página de configuração para inicializar o banco de dados com exercícios padrão.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Erro ao buscar exercícios:", error);
        toast({
          title: "Erro ao buscar exercícios",
          description:
            error.message || "Erro desconhecido ao buscar exercícios",
          variant: "destructive",
        });
      } finally {
        setFetchingExercises(false);
      }
    }

    fetchExercises();
  }, [toast]);

  // Adicionar exercício ao treino
  const handleAddExercise = () => {
    if (exercises.length === 0) return;

    const newExercise: WorkoutExercise = {
      exercise_id: exercises[0].id,
      exercise_name: exercises[0].name,
      sets: 3,
      reps: 12,
      rest_time: 60,
    };

    setWorkoutExercises([...workoutExercises, newExercise]);
  };

  // Selecionar exercício no modal
  const handleExerciseSelect = (index: number, selectedExercise: Exercise) => {
    const updated = [...workoutExercises];
    updated[index] = {
      ...updated[index],
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
    };
    setWorkoutExercises(updated);
  };

  // Remover exercício do treino
  const handleRemoveExercise = (index: number) => {
    const updated = [...workoutExercises];
    updated.splice(index, 1);
    setWorkoutExercises(updated);
  };

  // Atualizar detalhes do exercício
  const handleExerciseChange = (
    index: number,
    field: keyof WorkoutExercise,
    value: string | number
  ) => {
    const updated = [...workoutExercises];

    if (field === "exercise_id") {
      const exercise = exercises.find((ex) => ex.id === value);
      if (exercise) {
        updated[index].exercise_name = exercise.name;
      }
    }

    updated[index][field] = value as never;
    setWorkoutExercises(updated);
  };

  // Salvar treino
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "É necessário estar logado para criar um treino.",
        variant: "destructive",
      });
      return;
    }

    if (!name || !dayOfWeek) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do treino e dia da semana são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (workoutExercises.length === 0) {
      toast({
        title: "Sem exercícios",
        description: "Adicione pelo menos um exercício ao treino.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();

      // Criar o treino
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          name,
          day_of_week: dayOfWeek,
          description,
          is_active: true,
        })
        .select()
        .single();

      if (workoutError) {
        toast({
          title: "Erro ao criar treino",
          description: workoutError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Preparar exercícios do treino
      const workout_exercises: WorkoutExerciseData[] = workoutExercises.map(
        (ex, index) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_time: ex.rest_time,
          order_number: index + 1,
        })
      );

      // Adicionar exercícios ao treino
      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(workout_exercises);

      if (exercisesError) {
        toast({
          title: "Erro ao adicionar exercícios",
          description: exercisesError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Treino criado",
        description: "Seu treino foi criado com sucesso!",
      });

      // Redirecionar para a página de treinos
      router.push("/workouts");
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o treino. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Criar Novo Treino</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do Treino
              </label>
              <Input
                placeholder="Ex: Treino A - Peitoral e Tríceps"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Dia da Semana
              </label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia da semana" />
                </SelectTrigger>
                <SelectContent>
                  {weekdayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descrição (opcional)
              </label>
              <Textarea
                placeholder="Descrição do treino..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercícios</CardTitle>
            <Button
              size="sm"
              onClick={handleAddExercise}
              disabled={fetchingExercises || exercises.length === 0}
            >
              Adicionar Exercício
            </Button>
          </CardHeader>
          <CardContent>
            {fetchingExercises ? (
              <p className="text-center py-4 text-muted-foreground">
                Carregando exercícios...
              </p>
            ) : workoutExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-center text-muted-foreground mb-4">
                  {exercises.length === 0
                    ? "Não foram encontrados exercícios no banco de dados."
                    : "Nenhum exercício adicionado. Clique no botão acima para adicionar."}
                </p>

                {exercises.length === 0 && (
                  <Button onClick={() => router.push("/setup")}>
                    Ir para Configuração do Sistema
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {workoutExercises.map((ex, index) => (
                  <Card key={index} className="border border-border">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Exercício
                          </label>
                          <ExerciseSelector
                            exercises={exercises}
                            currentExerciseId={ex.exercise_id}
                            onSelect={(exercise) =>
                              handleExerciseSelect(index, exercise)
                            }
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Séries
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={ex.sets}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                handleExerciseChange(
                                  index,
                                  "sets",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Repetições
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={ex.reps}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                handleExerciseChange(
                                  index,
                                  "reps",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Descanso (s)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={ex.rest_time}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                handleExerciseChange(
                                  index,
                                  "rest_time",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveExercise(index)}
                        >
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <FaSave className="mr-2" /> Salvar Treino
              </>
            )}
          </Button>
        </div>
      </main>
    </>
  );
}
