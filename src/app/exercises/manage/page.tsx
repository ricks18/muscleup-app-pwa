"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import { useAuth } from "@/app/lib/auth";
import { createBrowserClient } from "@/app/lib/supabase";

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  is_public: boolean;
  created_at: string;
}

// Tradução dos grupos musculares
const muscleGroupTranslations: Record<string, string> = {
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

export default function ManageExercisesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [pendingExercises, setPendingExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [suggestedExercises, setSuggestedExercises] = useState<Exercise[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Verificar se o usuário é admin e buscar exercícios pendentes
  useEffect(() => {
    async function checkAdminAndLoadExercises() {
      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        const supabase = createBrowserClient();

        // Verificar se o usuário é admin (você pode adaptar isso para seu modelo de dados)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (profileError || !profile || !profile.is_admin) {
          // Redirecionar se não for admin
          router.push("/workouts");
          return;
        }

        setIsAdmin(true);

        // Buscar exercícios pendentes
        const { data: exercises, error } = await supabase
          .from("exercises")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setPendingExercises(exercises || []);
      } catch (error: any) {
        console.error("Erro ao verificar admin ou carregar exercícios:", error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoadExercises();
  }, [user, router, toast]);

  useEffect(() => {
    async function fetchSuggestedExercises() {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("exercises")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setSuggestedExercises(data || []);
        setLoading(false);
      } catch (error: any) {
        console.error("Erro ao buscar exercícios sugeridos:", error);
        toast({
          title: "Erro ao carregar exercícios",
          description: error.message || "Ocorreu um erro inesperado",
          variant: "destructive",
        });
        setLoading(false);
      }
    }

    if (user) {
      fetchSuggestedExercises();
    }
  }, [user, toast]);

  // Aprovar exercício
  const handleApprove = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setActionType("approve");
    setIsDialogOpen(true);
  };

  // Rejeitar exercício
  const handleReject = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setActionType("reject");
    setIsDialogOpen(true);
  };

  // Confirmar ação
  const confirmAction = async () => {
    if (!selectedExercise) return;

    try {
      setIsDialogOpen(false);
      const supabase = createBrowserClient();

      // Atualizar status do exercício
      const { error } = await supabase
        .from("exercises")
        .update({
          status: actionType === "approve" ? "approved" : "rejected",
          is_public: actionType === "approve", // Só torna público se aprovado
        })
        .eq("id", selectedExercise.id);

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setPendingExercises((prev) =>
        prev.filter((ex) => ex.id !== selectedExercise.id)
      );

      toast({
        title:
          actionType === "approve"
            ? "Exercício aprovado"
            : "Exercício rejeitado",
        description:
          actionType === "approve"
            ? "O exercício agora está disponível para todos os usuários."
            : "O exercício foi rejeitado e estará visível apenas para o usuário que o sugeriu.",
      });
    } catch (error: any) {
      console.error(
        `Erro ao ${
          actionType === "approve" ? "aprovar" : "rejeitar"
        } exercício:`,
        error
      );
      toast({
        title: "Erro ao processar",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleApproveExercise = async (exerciseId: string) => {
    try {
      setActionLoading(true);
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("exercises")
        .update({ status: "approved", is_public: true })
        .eq("id", exerciseId);

      if (error) {
        throw error;
      }

      // Atualizar a lista de exercícios sugeridos
      setSuggestedExercises((prev) =>
        prev.filter((exercise) => exercise.id !== exerciseId)
      );

      toast({
        title: "Exercício aprovado",
        description:
          "O exercício foi aprovado com sucesso e está disponível publicamente.",
      });
    } catch (error: any) {
      console.error("Erro ao aprovar exercício:", error);
      toast({
        title: "Erro ao aprovar exercício",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectExercise = async (exerciseId: string) => {
    try {
      setActionLoading(true);
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("exercises")
        .update({ status: "rejected" })
        .eq("id", exerciseId);

      if (error) {
        throw error;
      }

      // Atualizar a lista de exercícios sugeridos
      setSuggestedExercises((prev) =>
        prev.filter((exercise) => exercise.id !== exerciseId)
      );

      toast({
        title: "Exercício rejeitado",
        description:
          "O exercício foi rejeitado e não será listado publicamente.",
      });
    } catch (error: any) {
      console.error("Erro ao rejeitar exercício:", error);
      toast({
        title: "Erro ao rejeitar exercício",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin && !loading) {
    return null; // Não renderizar nada se não for admin (já foi redirecionado)
  }

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
          <h1 className="text-2xl font-bold">Gerenciar Exercícios</h1>
        </div>

        {loading ? (
          <p className="text-center py-8">Carregando exercícios...</p>
        ) : pendingExercises.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Não há sugestões de exercícios pendentes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Sugestões Pendentes</h2>
            {pendingExercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Grupo Muscular:{" "}
                    {muscleGroupTranslations[exercise.muscle_group] ||
                      exercise.muscle_group}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{exercise.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <div className="text-xs text-muted-foreground">
                    Sugerido em:{" "}
                    {new Date(exercise.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(exercise)}
                    >
                      <FaTimes className="mr-1" /> Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(exercise)}
                    >
                      <FaCheck className="mr-1" /> Aprovar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Diálogo de confirmação */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve"
                  ? "Aprovar Exercício"
                  : "Rejeitar Exercício"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Ao aprovar, este exercício ficará disponível para todos os usuários."
                  : "Ao rejeitar, este exercício ficará disponível apenas para quem o sugeriu."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <p className="font-semibold">{selectedExercise?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedExercise?.description}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={confirmAction}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
