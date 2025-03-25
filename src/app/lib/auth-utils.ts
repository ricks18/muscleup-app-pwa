import { User } from "@/app/types";
import { toast } from "@/components/ui/use-toast";
import { redirect } from "next/navigation";

/**
 * Verifica se o usuário está autenticado e retorna o ID seguro do usuário
 * @param user Objeto de usuário da sessão atual
 * @param redirectPath Caminho para redirecionar se não autenticado (opcional)
 * @param showToast Se deve mostrar uma mensagem toast (padrão: true)
 * @returns ID seguro do usuário ou null
 */
export function getUserId(
  user: User | null | undefined,
  redirectPath: string | null = null,
  showToast: boolean = true
): string | null {
  if (!user || !user.id) {
    if (showToast) {
      toast({
        title: "Não autenticado",
        description:
          "É necessário estar logado para acessar esta funcionalidade.",
        variant: "destructive",
      });
    }

    if (redirectPath) {
      redirect(redirectPath);
    }

    return null;
  }

  return user.id;
}

/**
 * Verifica se a string fornecida é um UUID válido
 * @param id String a ser verificada
 * @returns boolean indicando se é um UUID válido
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitiza uma string de entrada removendo caracteres potencialmente perigosos
 * @param input String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, "");
}

/**
 * Verifica se o ID é válido e converte para string segura
 * @param id ID a ser verificado
 * @returns ID sanitizado ou null se inválido
 */
export function validateId(id: string | null | undefined): string | null {
  if (!id) return null;
  id = id.trim();
  if (!isValidUUID(id)) return null;
  return id;
}
