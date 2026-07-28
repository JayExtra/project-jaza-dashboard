// src/pages/PotOnboarding.tsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { StepSidebar } from '../components/pot-onboarding/StepSidebar';
import { CategoryStep } from '../components/pot-onboarding/CategoryStep';
import { DetailsStep } from '../components/pot-onboarding/DetailsStep';
import { PhotosStep } from '../components/pot-onboarding/PhotosStep';
import { GoalStep } from '../components/pot-onboarding/GoalStep';
import { ReviewStep } from '../components/pot-onboarding/ReviewStep';
import { PreviewStep } from '../components/pot-onboarding/PreviewStep';
import type { PotDraft } from '../types/pot';
import { CATEGORY_LABELS, STEP_CONTENT } from '../types/pot';

const TOTAL_STEPS = 6;

export const PotOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [draft, setDraft] = useState<PotDraft>({
    category: 'medical',
    title: '',
    story: '',
    goalAmount: '',
    smartGoal: true,
    coverImage: null,
    featureImages: [null, null, null],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const categoryLabel = CATEGORY_LABELS[draft.category];
  const goalNum = Number(draft.goalAmount) || 0;
  const formattedGoal = `$${goalNum.toLocaleString('en-US')}`;
  const storyExcerpt = draft.story.length > 140 ? `${draft.story.slice(0, 140).trim()}…` : draft.story;
  const photoSummary = draft.coverImage
    ? `Cover + ${draft.featureImages.filter(Boolean).length} feature image(s)`
    : 'No photos added yet';

  const requiredOk: Record<number, boolean> = {
    1: true,
    2: draft.title.trim().length > 0 && draft.story.trim().length > 0,
    3: true,
    4: draft.goalAmount !== '' && Number(draft.goalAmount) > 0,
    5: true,
    6: true,
  };
  const canContinue = requiredOk[step];

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goHome = () => navigate('/');
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const jumpTo = (n: number) => setStep(n);

  const mainAction = () => {
    if (step === TOTAL_STEPS) {
      setLaunched(true);
    } else {
      goNext();
    }
  };

  const updateFeatureImage = (index: 0 | 1 | 2, file: File | null) => {
    setDraft((d) => {
      const next = [...d.featureImages] as PotDraft['featureImages'];
      next[index] = file;
      return { ...d, featureImages: next };
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <StepSidebar step={step} content={STEP_CONTENT[step]} />

      <div className="flex-1 bg-surface-lowest rounded-tl-[40px] flex flex-col relative min-w-0">
        <div className="flex-1 overflow-y-auto flex px-16">
          <div key={step} className="pot-step-in w-full max-w-[560px] mx-auto my-auto">
            {step === 1 && (
              <CategoryStep category={draft.category} onSelect={(category) => setDraft((d) => ({ ...d, category }))} />
            )}
            {step === 2 && (
              <DetailsStep
                title={draft.title}
                story={draft.story}
                onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
                onStoryChange={(story) => setDraft((d) => ({ ...d, story }))}
              />
            )}
            {step === 3 && (
              <PhotosStep
                coverImage={draft.coverImage}
                featureImages={draft.featureImages}
                onCoverChange={(coverImage) => setDraft((d) => ({ ...d, coverImage }))}
                onFeatureChange={updateFeatureImage}
              />
            )}
            {step === 4 && (
              <GoalStep
                goalAmount={draft.goalAmount}
                smartGoal={draft.smartGoal}
                onGoalChange={(goalAmount) => setDraft((d) => ({ ...d, goalAmount }))}
                onToggleSmartGoal={() => setDraft((d) => ({ ...d, smartGoal: !d.smartGoal }))}
              />
            )}
            {step === 5 && (
              <ReviewStep
                categoryLabel={categoryLabel}
                title={draft.title}
                storyExcerpt={storyExcerpt}
                photoSummary={photoSummary}
                formattedGoal={formattedGoal}
                smartGoal={draft.smartGoal}
                onJumpTo={jumpTo}
              />
            )}
            {step === 6 && (
              <PreviewStep
                coverImage={draft.coverImage}
                categoryLabel={categoryLabel}
                title={draft.title}
                storyExcerpt={storyExcerpt}
                formattedGoal={formattedGoal}
              />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-16 pb-10">
          <button
            onClick={() => {
              if (step === 1) {
                goHome();
              } else {
                goBack();
              }
            }}
            className={`bg-transparent text-foreground font-display text-sm font-semibold ring-1 ring-inset ring-foreground/15 rounded-xl px-7 py-3.5`}
          >
            Back
          </button>

          {launched && step === TOTAL_STEPS ? (
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-on-primary font-display text-sm font-semibold rounded-xl px-8 py-3.5"
            >
              Back to Overview
            </button>
          ) : (
            <button
              onClick={mainAction}
              disabled={!canContinue}
              className={`font-display text-sm font-semibold rounded-xl px-8 py-3.5 ${
                canContinue ? 'bg-primary text-on-primary cursor-pointer' : 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
              }`}
            >
              {step === TOTAL_STEPS ? 'Launch Pot' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
