'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaDumbbell, FaUser } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/app/lib/auth';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, []);

  if (!user) {
    return (
      <>
        <Header />
        <main className="mobile-container flex min-h-screen flex-col items-center justify-center pt-16 pb-24">
          <div className="w-full max-w-md flex flex-col items-center">
            <div className="relative w-64 h-64 mb-8">
              <Image
                src="/logo.png"
                alt="MuscleUP Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            
            <Card className="w-full mb-6">
              <CardHeader>
                <CardTitle>Bem-vindo ao MuscleUP</CardTitle>
                <CardDescription>
                  Seu aplicativo para acompanhar seu progresso na academia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Para começar a usar o aplicativo, por favor faça login ou crie uma conta.
                </p>
                <Button className="w-full mb-2" onClick={() => router.push('/auth')}>
                  <FaUser className="mr-2 h-4 w-4" />
                  Entrar / Cadastrar
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mobile-container flex min-h-screen flex-col items-center justify-between pt-16 pb-24">
        <div className="w-full">
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-64">
              <Image
                src="/logo.png"
                alt="MuscleUP Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Bem-vindo ao MuscleUP</CardTitle>
              <CardDescription>
                {greeting}! Seu aplicativo para acompanhar seu progresso na academia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Registre seus treinos, acompanhe suas medidas corporais e visualize seu progresso de forma simples e eficiente.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/workouts">
                  <FaDumbbell className="mr-2 h-4 w-4" />
                  Começar a Treinar
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Treinos</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">Registre e acompanhe seus treinos por dia da semana.</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/workouts">Ver treinos</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Progresso</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">Visualize gráficos de evolução dos seus exercícios.</p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/progress">Ver progresso</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <p className="text-center text-muted-foreground text-sm mb-4">
              Desenvolvido com ❤️ por você
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm">Sobre</Button>
              <Button variant="ghost" size="sm">Privacidade</Button>
              <Button variant="ghost" size="sm">Termos</Button>
            </div>
          </div>
        </div>
        
        <BottomNavigation />
      </main>
    </>
  );
} 