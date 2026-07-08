import { Sparkles } from 'lucide-react';

export const AIAgent = () => {
  const handleOpenAiPanel = () => {
    // Fire event to toggle the AI panel in DashboardLayout
    window.dispatchEvent(new Event('toggle-ai-panel'));
  };

  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-secondary font-bold text-xs tracking-[0.1em] uppercase mb-1">AI FEATURES</p>
          <h1 className="text-5xl font-display font-semibold text-primary">AI Agent</h1>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-lowest rounded-[2rem] p-12 text-center shadow-ambient">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
          <Sparkles size={28} className="text-primary" />
        </div>
        <h3 className="text-2xl font-display font-semibold text-primary mb-3">Jaza Autonomous Financial Agent</h3>
        <p className="text-sm text-foreground/60 max-w-[400px] leading-relaxed mb-8">
          The AI Agent can automate collective fund distributions, run predictive analytics on campaigns, and answer financial queries.
        </p>
        <button
          onClick={handleOpenAiPanel}
          className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl flex items-center gap-2 hover:bg-primary/95 transition-colors shadow-ambient text-sm"
        >
          <Sparkles size={16} />
          Launch AI Chat Assistant
        </button>
      </div>
    </div>
  );
};
