"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUser,
  FaDatabase,
  FaCog,
  FaDumbbell,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { createBrowserClient } from "@/app/lib/supabase";
import { useAuth } from "@/app/lib/auth";
import { toast, useToast } from "@/components/ui/use-toast";
import LastProgressDisplay from "@/components/LastProgressDisplay";
import RegisterProgress from "@/components/RegisterProgress";

// Tipos de dados para o banco de dados
interface DatabaseWorkoutExercise {
  id: string;
  sets: number;
  reps: number;
  rest_time: number;
  order_number: number;
  exercise: {
    id: string;
    name: string;
    description: string;
    muscle_group: string;
  };
}

interface DatabaseWorkout {
  id: string;
  name: string;
  description: string;
  day_of_week: string;
  workout_exercises: DatabaseWorkoutExercise[];
}

// Tipos de dados para a UI
type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

type Workout = {
  id: string;
  name: string;
  dayOfWeek: string;
  exercises: Exercise[];
};

// Dias da semana com tradução para português para exibição
const weekdays = [
  { value: "sunday", label: "Domingo" },
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
];

export default function WorkoutsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if (!user) {
      router.push("/auth");
    }
  }, [user, router]);

  // Verificar se o usuário é admin
  useEffect(() => {
    async function checkIfUserIsAdmin() {
      if (!user) return;

      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erro ao verificar status de admin:", error);
          return;
        }

        setIsAdmin(data?.is_admin === true);
      } catch (error) {
        console.error("Erro ao verificar status de admin:", error);
      }
    }

    checkIfUserIsAdmin();
  }, [user]);

  // Inicializa o cliente Supabase e configura o banco
  useEffect(() => {
    if (!user) return;

    const supabase = createBrowserClient();

    async function fetchWorkouts() {
      try {
        setLoading(true);

        // Certifica-se de que user não é null
        if (!user || !user.id) {
          toast({
            title: "Usuário não autenticado",
            description: "Por favor, faça login para ver seus treinos.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Buscar treinos do usuário
        const { data, error } = await supabase
          .from("workouts")
          .select(
            `
            id, 
            name, 
            description, 
            day_of_week,
            workout_exercises (
              id,
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
            )
          `
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("day_of_week");

        if (error) {
          console.error("Erro ao buscar treinos:", error);

          // Se não existem treinos, vamos criar alguns exemplos
          if (error.code === "PGRST116") {
            // Criar alguns treinos de exemplo para o usuário
            const sampleWorkouts: Workout[] = [
              {
                id: "1",
                name: "Treino A - Peito e Tríceps",
                dayOfWeek: "Segunda",
                exercises: [
                  {
                    id: "1",
                    name: "Supino Reto",
                    sets: 4,
                    reps: 12,
                    weight: 60,
                  },
                  {
                    id: "2",
                    name: "Tríceps Corda",
                    sets: 3,
                    reps: 15,
                    weight: 25,
                  },
                ],
              },
              {
                id: "2",
                name: "Treino B - Costas e Bíceps",
                dayOfWeek: "Quarta",
                exercises: [
                  {
                    id: "3",
                    name: "Puxada Frontal",
                    sets: 4,
                    reps: 10,
                    weight: 70,
                  },
                  {
                    id: "4",
                    name: "Rosca Direta",
                    sets: 3,
                    reps: 12,
                    weight: 30,
                  },
                ],
              },
            ];

            setUserWorkouts(sampleWorkouts);
            setLoading(false);

            toast({
              title: "Treinos de exemplo",
              description:
                "Mostrando treinos de exemplo pois ainda não há treinos cadastrados.",
            });

            return;
          }

          toast({
            title: "Erro ao buscar treinos",
            description: error.message,
            variant: "destructive",
          });

          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Transformar os dados para o formato necessário usando tipagem segura
          const formattedWorkouts = data.map((workout: any) => {
            const workoutExercises: Exercise[] = (
              workout.workout_exercises || []
            ).map((we: any) => ({
              id: we.exercise.id,
              name: we.exercise.name,
              sets: we.sets,
              reps: we.reps,
              weight: 0, // Peso não é armazenado no workout_exercises, apenas no progresso
            }));

            return {
              id: workout.id,
              name: workout.name,
              dayOfWeek: workout.day_of_week,
              exercises: workoutExercises,
            };
          }) as Workout[];

          setUserWorkouts(formattedWorkouts);
        } else {
          toast({
            title: "Nenhum treino encontrado",
            description:
              "Você ainda não tem treinos cadastrados. Crie seu primeiro treino!",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar treinos:", error);
        toast({
          title: "Erro ao buscar treinos",
          description:
            "Ocorreu um erro ao buscar seus treinos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, [toast, user]);

  const handleAddWorkout = () => {
    router.push("/workouts/create");
  };

  return (
    <>
      <Header />
      <main className="mobile-container min-h-screen pt-16 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meus Treinos</h1>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/exercises/manage")}
              >
                <FaDumbbell className="mr-1" /> Gerenciar Exercícios
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/setup")}
            >
              <FaCog className="mr-1" /> Config
            </Button>
          </div>
        </div>

        <Tabs defaultValue={weekdays[new Date().getDay() % 7].value}>
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide mb-4 p-0.5">
            {weekdays.map((day) => (
              <TabsTrigger
                key={day.value}
                value={day.value}
                className="flex-1 min-w-[80px] max-w-[100px] text-sm whitespace-nowrap px-2"
              >
                {day.label.substring(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <div className="flex justify-center py-10">
              <p className="text-muted-foreground">Carregando treinos...</p>
            </div>
          ) : (
            weekdays.map((day) => {
              const dayWorkouts = userWorkouts.filter(
                (workout) => workout.dayOfWeek === day.value
              );

              return (
                <TabsContent key={day.value} value={day.value} className="mt-0">
                  {dayWorkouts.length > 0 ? (
                    dayWorkouts.map((workout) => (
                      <Card key={workout.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {workout.name}
                            </CardTitle>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <FaEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                              >
                                <FaTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="divide-y divide-border">
                            {workout.exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="py-2 flex flex-col"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">
                                      {exercise.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {exercise.sets} séries x {exercise.reps}{" "}
                                      reps
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">
                                      {exercise.weight} kg
                                    </p>
                                  </div>
                                </div>

                                {/* Mostrar último progresso */}
                                <LastProgressDisplay
                                  workoutExerciseId={exercise.id}
                                />

                                {/* Botão para registrar novo progresso */}
                                <div className="mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() =>
                                      router.push(
                                        `/workouts/${workout.id}/exercises/${exercise.id}/progress`
                                      )
                                    }
                                  >
                                    Registrar Progresso
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <p className="text-muted-foreground text-center mb-4">
                        Nenhum treino para {day.label}
                      </p>
                      <Button onClick={handleAddWorkout}>
                        <FaPlus className="mr-2 h-4 w-4" /> Adicionar Treino
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })
          )}
        </Tabs>

        <BottomNavigation />

        <div className="fixed bottom-24 right-4">
          <Button
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => router.push("/workouts/create")}
          >
            <FaPlus size={20} />
          </Button>
        </div>
      </main>
    </>
  );
}
