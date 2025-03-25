"use client";

import { useState, useEffect } from "react";
import { FaRuler, FaDumbbell } from "react-icons/fa";
import BottomNavigation from "@/components/BottomNavigation";
import Link from "next/link";
import ProgressChart from "@/components/ProgressChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/app/types";
import { createBrowserClient } from "@/app/lib/supabase";
import { useAuth } from "@/app/lib/auth";

export default function ProgressPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeExerciseTab, setActiveExerciseTab] = useState<string>("");
  const [weightData, setWeightData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [measurementsData, setMeasurementsData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [exerciseData, setExerciseData] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    if (!user) return;

    async function loadUserData() {
      setLoading(true);
      try {
        const supabase = createBrowserClient();

        if (!user || !user.id) {
          throw new Error("Usuário não autenticado");
        }

        const { data: bodyData, error: bodyError } = await supabase
          .from("body_measurements")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });

        if (bodyError) throw bodyError;

        if (bodyData && bodyData.length > 0) {
          const labels = bodyData.map((m) => {
            const date = new Date(m.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          });

          const weights = bodyData.map((m) => m.weight);

          setWeightData({
            labels,
            datasets: [
              {
                label: "Peso (kg)",
                data: weights,
                backgroundColor: "rgba(244, 114, 182, 0.2)",
                borderColor: "rgb(244, 114, 182)",
                borderWidth: 2,
                tension: 0.3,
              },
            ],
          });

          const measurementDatasets = [];

          if (bodyData.some((m) => m.waist)) {
            measurementDatasets.push({
              label: "Cintura (cm)",
              data: bodyData.map((m) => m.waist),
              backgroundColor: "rgba(249, 168, 212, 0.2)",
              borderColor: "rgb(249, 168, 212)",
              borderWidth: 2,
              tension: 0.3,
            });
          }

          if (bodyData.some((m) => m.hips)) {
            measurementDatasets.push({
              label: "Quadril (cm)",
              data: bodyData.map((m) => m.hips),
              backgroundColor: "rgba(244, 114, 182, 0.2)",
              borderColor: "rgb(244, 114, 182)",
              borderWidth: 2,
              tension: 0.3,
            });
          }

          if (bodyData.some((m) => m.left_arm || m.right_arm)) {
            measurementDatasets.push({
              label: "Braço (cm)",
              data: bodyData.map((m) => m.left_arm || m.right_arm),
              backgroundColor: "rgba(236, 72, 153, 0.2)",
              borderColor: "rgb(236, 72, 153)",
              borderWidth: 2,
              tension: 0.3,
            });
          }

          setMeasurementsData({
            labels,
            datasets: measurementDatasets,
          });
        }

        const { data: exercisesList, error: exercisesError } = await supabase
          .from("exercises")
          .select("id, name")
          .order("name");

        if (exercisesError) throw exercisesError;

        if (exercisesList) {
          setExercises(exercisesList);
        }

        if (activeExerciseTab && activeExerciseTab.length > 30) {
          const { data: exerciseProgress, error: exerciseError } =
            await supabase
              .from("progress")
              .select("*")
              .eq("user_id", user?.id)
              .eq("workout_exercise_id", activeExerciseTab)
              .order("date", { ascending: true });

          if (exerciseError) throw exerciseError;

          if (exerciseProgress) {
            setExerciseData(exerciseProgress);
          } else {
            setExerciseData([]);
          }
        } else {
          setExerciseData([]);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados do usuário:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar seus dados de progresso.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user, activeExerciseTab, toast]);

  return (
    <>
      <Header />
      <main className="mobile-container min-h-screen pt-16 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meu Progresso</h1>
          <Button size="sm">Registrar</Button>
        </div>

        <Tabs defaultValue="weight" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weight">Peso</TabsTrigger>
            <TabsTrigger value="measurements">Medidas</TabsTrigger>
            <TabsTrigger value="exercises">Exercícios</TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Evolução do Peso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <p className="text-center py-20 text-muted-foreground">
                      Carregando dados...
                    </p>
                  ) : weightData.datasets.length > 0 &&
                    weightData.datasets[0].data.length > 0 ? (
                    <ProgressChart data={weightData} chartType="line" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-muted-foreground text-center mb-4">
                        Ainda não há registros de peso. Adicione seu primeiro
                        registro para acompanhar sua evolução.
                      </p>
                      <Button className="mt-2">Registrar Peso</Button>
                    </div>
                  )}
                </div>
                {!loading &&
                  weightData.datasets.length > 0 &&
                  weightData.datasets[0].data.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">Inicial</p>
                        <p className="text-lg font-semibold">
                          {weightData.datasets[0].data[0]} kg
                        </p>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">Atual</p>
                        <p className="text-lg font-semibold">
                          {
                            weightData.datasets[0].data[
                              weightData.datasets[0].data.length - 1
                            ]
                          }{" "}
                          kg
                        </p>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">
                          Diferença
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            weightData.datasets[0].data[
                              weightData.datasets[0].data.length - 1
                            ] < weightData.datasets[0].data[0]
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {(
                            weightData.datasets[0].data[
                              weightData.datasets[0].data.length - 1
                            ] - weightData.datasets[0].data[0]
                          ).toFixed(1)}{" "}
                          kg
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements" className="mt-0">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Medidas Corporais</CardTitle>
                  <Select defaultValue="arm">
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arm">Braço</SelectItem>
                      <SelectItem value="chest">Peito</SelectItem>
                      <SelectItem value="waist">Cintura</SelectItem>
                      <SelectItem value="leg">Perna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <p className="text-center py-20 text-muted-foreground">
                      Carregando dados...
                    </p>
                  ) : measurementsData.datasets.length > 0 ? (
                    <ProgressChart data={measurementsData} chartType="line" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-muted-foreground text-center mb-4">
                        Ainda não há registros de medidas. Adicione seu primeiro
                        registro para acompanhar sua evolução.
                      </p>
                      <Button className="mt-2">Registrar Medidas</Button>
                    </div>
                  )}
                </div>
                {!loading &&
                  measurementsData.datasets.length > 0 &&
                  measurementsData.datasets[0].data.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">
                          {measurementsData.datasets[0].label.split(" ")[0]}{" "}
                          Inicial
                        </p>
                        <p className="text-lg font-semibold">
                          {measurementsData.datasets[0].data[0]} cm
                        </p>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">
                          {measurementsData.datasets[0].label.split(" ")[0]}{" "}
                          Atual
                        </p>
                        <p className="text-lg font-semibold">
                          {
                            measurementsData.datasets[0].data[
                              measurementsData.datasets[0].data.length - 1
                            ]
                          }{" "}
                          cm
                        </p>
                      </div>
                      <div className="bg-muted rounded-md p-2">
                        <p className="text-xs text-muted-foreground">
                          Diferença
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            measurementsData.datasets[0].data[
                              measurementsData.datasets[0].data.length - 1
                            ] < measurementsData.datasets[0].data[0]
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {(
                            measurementsData.datasets[0].data[
                              measurementsData.datasets[0].data.length - 1
                            ] - measurementsData.datasets[0].data[0]
                          ).toFixed(1)}{" "}
                          cm
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Progresso nos Exercícios
                  </CardTitle>
                  <Select
                    value={activeExerciseTab}
                    onValueChange={setActiveExerciseTab}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Selecionar Exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.length > 0 ? (
                        exercises.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Nenhum exercício encontrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <p className="text-center py-20 text-muted-foreground">
                      Carregando dados...
                    </p>
                  ) : !activeExerciseTab ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-muted-foreground text-center mb-4">
                        Selecione um exercício para ver seu progresso
                      </p>
                    </div>
                  ) : exerciseData.length > 0 ? (
                    <ProgressChart
                      data={exerciseData}
                      type="weight"
                      chartType="line"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <p className="text-muted-foreground text-center mb-4">
                        Ainda não há registros de progresso para este exercício.
                        Adicione seu primeiro registro.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BottomNavigation />
      </main>
    </>
  );
}
