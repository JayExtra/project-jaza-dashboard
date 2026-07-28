interface ReviewStepProps {
  categoryLabel: string;
  title: string;
  storyExcerpt: string;
  photoSummary: string;
  formattedGoal: string;
  smartGoal: boolean;
  onJumpTo: (step: number) => void;
}

interface ReviewRowProps {
  label: string;
  primary: string;
  secondary?: string;
  onEdit: () => void;
}

const ReviewRow = ({ label, primary, secondary, onEdit }: ReviewRowProps) => (
  <div className="flex justify-between items-start py-4">
    <div className="max-w-[400px]">
      <div className="text-[11px] font-bold tracking-wide text-foreground/40 mb-1.5">{label}</div>
      <div className="text-[15px] font-semibold text-foreground mb-1">{primary}</div>
      {secondary && <div className="text-[13px] leading-relaxed text-foreground/60">{secondary}</div>}
    </div>
    <button type="button" onClick={onEdit} className="text-sm font-bold text-secondary cursor-pointer bg-transparent">
      Edit
    </button>
  </div>
);

export const ReviewStep = ({ categoryLabel, title, storyExcerpt, photoSummary, formattedGoal, smartGoal, onJumpTo }: ReviewStepProps) => {
  return (
    <div className="flex flex-col">
      <ReviewRow label="CATEGORY" primary={categoryLabel} onEdit={() => onJumpTo(1)} />
      <ReviewRow label="TITLE & STORY" primary={title} secondary={storyExcerpt} onEdit={() => onJumpTo(2)} />
      <ReviewRow label="PHOTOS" primary={photoSummary} onEdit={() => onJumpTo(3)} />
      <ReviewRow
        label="GOAL"
        primary={formattedGoal}
        secondary={`Smart goal setting: ${smartGoal ? 'On' : 'Off'}`}
        onEdit={() => onJumpTo(4)}
      />
    </div>
  );
};
