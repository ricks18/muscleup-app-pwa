'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaDumbbell, FaChartLine } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      path: '/',
      label: 'Início',
      icon: FaHome
    },
    {
      path: '/workouts',
      label: 'Treinos',
      icon: FaDumbbell
    },
    {
      path: '/progress',
      label: 'Progresso',
      icon: FaChartLine
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex justify-around items-center px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link href={item.path} key={item.path} className="w-full">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full h-full flex flex-col items-center justify-center rounded-none py-1 px-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
} 