interface DetailsStepProps {
  title: string;
  story: string;
  onTitleChange: (value: string) => void;
  onStoryChange: (value: string) => void;
}

export const DetailsStep = ({ title, story, onTitleChange, onStoryChange }: DetailsStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">POT TITLE</label>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g. Help Maria Beat Cancer"
        className="w-full font-display text-base font-semibold text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg px-4 py-3.5 mb-6 outline-none placeholder:text-foreground/40"
      />

      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">THE STORY</label>
      <textarea
        value={story}
        onChange={(e) => onStoryChange(e.target.value)}
        placeholder="Tell people what happened, why it matters, and how their gift helps."
        rows={6}
        className="w-full text-sm leading-relaxed text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg px-4 py-3.5 outline-none resize-y placeholder:text-foreground/40"
      />
    </div>
  );
};
