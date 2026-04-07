import { Moon, Sun, Bell, AlignLeft } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';

export const Topbar = ({ sidebarCollapsed, setSidebarCollapsed, isDark, setIsDark }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 -ml-2 text-foreground/60 hover:text-foreground bg-surface-low rounded-lg transition-colors"
        >
          <AlignLeft size={20} />
        </button>
        <SearchBar />
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="text-foreground/60 hover:text-foreground transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="relative">
          <Bell size={20} className="text-foreground/60 hover:text-foreground transition-colors cursor-pointer" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full"></div>
        </div>
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="text-right flex flex-col">
            <span className="text-sm font-semibold">Jaza</span>
            <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">BRAND</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 selected" /><path d="M8 21v-2a4 4 0 0 1 4-4h0" /><rect width="20" height="8" x="2" y="3" rx="2" /><path d="M6 11v8" /><path d="M18 11v8" /></svg>
          </div>
        </div>
      </div>
    </header>
  );
};
