interface GoalStepProps {
  goalAmount: number | '';
  smartGoal: boolean;
  onGoalChange: (value: number | '') => void;
  onToggleSmartGoal: () => void;
}

export const GoalStep = ({ goalAmount, smartGoal, onGoalChange, onToggleSmartGoal }: GoalStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">FUNDRAISING GOAL</label>
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-semibold text-foreground">$</span>
        <input
          value={goalAmount}
          onChange={(e) => onGoalChange(e.target.value === '' ? '' : Number(e.target.value))}
          type="number"
          min={0}
          step={100}
          className="w-full font-display text-lg font-semibold text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg pl-8 pr-4 py-3.5 outline-none"
        />
      </div>

      <div className="flex items-center justify-between bg-surface-low rounded-xl px-5 py-4">
        <div className="pr-5">
          <div className="text-sm font-bold text-foreground mb-1">Smart goal setting</div>
          <div className="text-[13px] leading-relaxed text-foreground/60">
            Automatically fine-tune your goal over time based on how your Pot's story and category typically perform.
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSmartGoal}
          role="switch"
          aria-checked={smartGoal}
          className={`flex-shrink-0 w-[46px] h-[26px] rounded-full p-[3px] cursor-pointer transition-colors ${
            smartGoal ? 'bg-primary' : 'bg-foreground/15'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-surface-lowest shadow-md transition-transform ${
              smartGoal ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
