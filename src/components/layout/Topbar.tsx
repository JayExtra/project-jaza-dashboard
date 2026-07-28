import { Moon, Sun, Bell, AlignLeft, Sparkles } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { Link } from 'react-router-dom';

interface TopbarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isAiOpen: boolean;
  setIsAiOpen: (value: boolean) => void;
}

export const Topbar = ({ sidebarCollapsed, setSidebarCollapsed, isDark, setIsDark, isAiOpen, setIsAiOpen }: TopbarProps) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-border bg-surface">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-2 -ml-2 text-foreground/60 hover:text-foreground bg-surface-low rounded-lg transition-colors"
        >
          <AlignLeft size={20} />
        </button>
        <SearchBar />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          aria-label="Toggle AI Assistant"
          className={`p-2 rounded-lg transition-all ${isAiOpen ? 'bg-primary/10 text-primary scale-110' : 'text-foreground/60 hover:text-foreground hover:bg-surface-low'}`}
        >
          <Sparkles size={20} className={isAiOpen ? 'animate-pulse' : ''} />
        </button>

        <button
          onClick={() => setIsDark(!isDark)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 text-foreground/60 hover:text-foreground rounded-lg transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          aria-label="Notifications"
          className="relative p-2 text-foreground/60 hover:text-foreground rounded-lg transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-surface" />
        </button>

         <div className="flex items-center ">
                    <Link 
                        to="/"
                        aria-label="Go to home"
                        className="hover:opacity-80 transition-opacity"
                    >
                       <img 
                    src="/logo.png" 
                    alt="Jaza" 
                    className="h-16 w-auto object-contain"
                     /> 
                    </Link>
            </div>
      </div>
    </header>
  );
};