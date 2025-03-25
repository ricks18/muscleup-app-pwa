import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FaMoon, FaSun, FaHeart } from 'react-icons/fa';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/app/lib/utils';
import type { Theme } from '@/components/ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    const handleOutsideClick = () => {
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        className="rounded-full"
      >
        {theme === 'light' && <FaSun className="h-[1.2rem] w-[1.2rem]" />}
        {theme === 'dark' && <FaMoon className="h-[1.2rem] w-[1.2rem]" />}
        {theme === 'carol' && <FaHeart className="h-[1.2rem] w-[1.2rem] text-pink-500" />}
      </Button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-36 z-50 rounded-md shadow-lg bg-card border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={() => handleThemeChange('light')}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                theme === 'light' && "text-primary"
              )}
            >
              <FaSun className="mr-2 h-4 w-4" />
              Claro
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                theme === 'dark' && "text-primary"
              )}
            >
              <FaMoon className="mr-2 h-4 w-4" />
              Escuro
            </button>
            <button
              onClick={() => handleThemeChange('carol')}
              className={cn(
                "flex items-center w-full px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                theme === 'carol' && "text-primary"
              )}
            >
              <FaHeart className="mr-2 h-4 w-4 text-pink-500" />
              Carol
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 