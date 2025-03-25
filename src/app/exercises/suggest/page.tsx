"use client";

import { useState } from "react";
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

type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "abs"
  | "cardio"
  | "full_body"
  | "other";

// Mapeamento de tradução para os grupos musculares
const muscleGroupOptions = [
  { value: "chest", label: "Peito" },
  { value: "back", label: "Costas" },
  { value: "shoulders", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "legs", label: "Pernas" },
  { value: "glutes", label: "Glúteos" },
  { value: "abs", label: "Abdômen" },
  { value: "cardio", label: "Cardio" },
  { value: "full_body", label: "Corpo Inteiro" },
  { value: "other", label: "Outros" },
];

export default function SuggestExercisePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Estado para o formulário
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("");
  const [loading, setLoading] = useState(false);

  // Salvar sugestão
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "É necessário estar logado para sugerir um exercício.",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (!name || !description || !muscleGroup) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();

      const { error } = await supabase.from("exercises").insert({
        name,
        description,
        muscle_group: muscleGroup,
        user_id: user.id,
        is_public: false, // Começa como não público (pendente de aprovação)
        status: "pending", // Status pendente para revisão do admin
      });

      if (error) {
        console.error("Erro ao sugerir exercício:", error);
        toast({
          title: "Erro ao enviar sugestão",
          description: error.message || "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Sugestão enviada",
        description: "Sua sugestão de exercício foi enviada para aprovação!",
      });

      // Redirecionamento após sucesso
      router.push("/workouts");
    } catch (error: any) {
      console.error("Erro ao sugerir exercício:", error);
      toast({
        title: "Erro ao enviar sugestão",
        description: error.message || "Ocorreu um erro. Tente novamente.",
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
          <h1 className="text-2xl font-bold">Sugerir Exercício</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Exercício</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do Exercício
              </label>
              <Input
                placeholder="Ex: Supino Inclinado com Halteres"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Grupo Muscular
              </label>
              <Select
                value={muscleGroup}
                onValueChange={(value) => setMuscleGroup(value as MuscleGroup)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descrição
              </label>
              <Textarea
                placeholder="Descreva o exercício com detalhes de como executá-lo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sua sugestão será revisada pelo administrador. Se aprovada, o
            exercício estará disponível para todos os usuários. Se recusada, o
            exercício ficará disponível apenas para você.
          </p>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <FaSave className="mr-2" /> Enviar Sugestão
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
