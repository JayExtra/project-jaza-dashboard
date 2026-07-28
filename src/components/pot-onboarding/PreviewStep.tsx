import { useObjectUrl } from '../../hooks/useObjectUrl';

interface PreviewStepProps {
  coverImage: File | null;
  categoryLabel: string;
  title: string;
  storyExcerpt: string;
  formattedGoal: string;
}

export const PreviewStep = ({ coverImage, categoryLabel, title, storyExcerpt, formattedGoal }: PreviewStepProps) => {
  const coverUrl = useObjectUrl(coverImage);

  return (
    <div className="bg-surface-low rounded-2xl overflow-hidden max-w-[360px] mx-auto shadow-ambient">
      <div className="w-full h-[160px] bg-surface-highest flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-foreground/40">Drop your cover image</span>
        )}
      </div>
      <div className="p-4.5">
        <span className="inline-block text-[10px] font-bold tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2.5">
          {categoryLabel}
        </span>
        <div className="font-display text-base font-semibold text-foreground mb-1.5">{title}</div>
        <div className="text-[13px] leading-relaxed text-foreground/60 mb-4">{storyExcerpt}</div>
        <div className="w-full h-1.5 bg-foreground/10 rounded overflow-hidden mb-2.5">
          <div className="h-full w-[6%] bg-gradient-to-br from-secondary to-primary rounded" />
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="font-bold text-foreground">$0 raised</span>
          <span className="text-foreground/60">of {formattedGoal} goal</span>
        </div>
      </div>
    </div>
  );
};
