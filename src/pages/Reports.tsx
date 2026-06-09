export const Reports = () => {
  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-secondary font-bold text-xs tracking-[0.1em] uppercase mb-1">MANAGE</p>
          <h1 className="text-5xl font-display font-semibold text-primary">Reports</h1>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-surface-lowest rounded-[2rem] shadow-ambient">
        <p className="text-foreground/40 text-sm">Access standard financial statements, audit logs, and transaction sheets here.</p>
      </div>
    </div>
  );
};
