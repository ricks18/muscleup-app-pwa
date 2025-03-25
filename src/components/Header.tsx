import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FaUser, FaSignOutAlt, FaDumbbell } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const nameMatch = user.email?.match(/^([^@])/);
    return nameMatch ? nameMatch[1].toUpperCase() : "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center px-4">
      <div className="w-full max-w-md mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-lg flex items-center">
          <FaDumbbell className="text-primary h-6 w-6 mr-2" />
          <span>MuscleUP</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FaUser className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <FaSignOutAlt className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/auth")}
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
