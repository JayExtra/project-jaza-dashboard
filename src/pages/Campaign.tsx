
import { Plus, CreditCard, Share2, Zap, BarChart2 } from 'lucide-react';

export const Campaign = () => {
  return (
    <div className="p-8 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-secondary font-bold text-xs tracking-[0.1em] uppercase mb-1">WORKSPACE</p>
          <h1 className="text-5xl font-display font-semibold text-primary">Campaign</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-surface-lowest text-foreground font-semibold rounded-xl hover:bg-surface-low transition-colors shadow-ambient text-sm">
            View Archive
          </button>
          <button className="px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl flex items-center gap-2 hover:bg-primary-container transition-colors shadow-ambient text-sm">
            <Plus size={18} />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Empty State Card */}
        <div className="col-span-2 bg-surface-lowest rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-ambient min-h-[400px]">
          <div className="w-16 h-16 bg-surface-low rounded-2xl flex items-center justify-center mb-6">
            <BarChart2 size={28} className="text-foreground/30" />
          </div>
          <h3 className="text-xl font-display font-semibold text-foreground/60 mb-2">No Active Campaigns</h3>
          <p className="text-sm text-foreground/40 max-w-[250px] leading-relaxed">
            Start your first campaign to see analytics, conversion rates, and influencer performance here.
          </p>
        </div>

        {/* Right Column Stats */}
        <div className="space-y-6">
          <div className="bg-surface-low rounded-[2rem] p-8 relative">
            <div className="absolute top-8 right-8 bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded tracking-wider">
              PENDING
            </div>
            <div className="w-10 h-10 bg-surface-lowest rounded-xl flex items-center justify-center mb-10 shadow-ambient">
              <CreditCard size={20} className="text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground/60 mb-1">Estimated Earnings</p>
            <h2 className="text-4xl font-display font-semibold text-primary">$0.00</h2>
          </div>

          <div className="bg-surface-lowest rounded-[2rem] p-8 shadow-ambient">
            <div className="w-10 h-10 mb-10 flex items-center justify-center">
              <Share2 size={24} className="text-primary/40" />
            </div>
            <p className="text-xs font-semibold text-foreground/60 mb-1">Network Reach</p>
            <h2 className="text-4xl font-display font-semibold text-foreground mb-6">0</h2>
            <div className="h-1 w-full bg-surface-low rounded-full overflow-hidden">
              <div className="h-full bg-surface-low w-0"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-1 bg-surface-lowest rounded-[2rem] min-h-[200px] shadow-ambient"></div>
        <div className="col-span-2 bg-gradient-to-br from-surface-low via-surface-low to-secondary/10 rounded-[2rem] min-h-[200px] relative overflow-hidden">
            {/* Decorative background wave logic */}
            <div className="absolute inset-0 opacity-30">
               <svg viewBox="0 0 800 400" className="w-full h-full object-cover">
                  <path d="M0 200 Q 200 100 400 200 T 800 200 L 800 400 L 0 400 Z" fill="url(#grad)" />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--tertiary)" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.2"/>
                    </linearGradient>
                  </defs>
               </svg>
            </div>
        </div>
        
        {/* Floating FAB on bottom right */}
        <div className="fixed bottom-8 right-8">
          <button className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-all rotate-12 hover:rotate-0">
            <Zap size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
