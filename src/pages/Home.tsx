import { useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-secondary font-bold text-xs tracking-[0.1em] uppercase mb-1">WORKSPACE</p>
          <h1 className="text-5xl font-display font-semibold text-primary">Home</h1>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-surface-lowest rounded-[2rem] shadow-ambient text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary">
          <PiggyBank size={26} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Create your first Pot</h2>
          <p className="text-sm text-foreground/60 max-w-sm mx-auto">
            A Pot is your fundraiser — give it a story, a goal, and start collecting support in minutes.
          </p>
        </div>
        <button
          onClick={() => navigate('/pot/new')}
          className="bg-secondary hover:bg-secondary/90 text-background font-display text-sm font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          Start a Pot
        </button>
      </div>
    </div>
  );
};
