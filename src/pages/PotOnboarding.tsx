// src/pages/PotOnboarding.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePotCategories } from '../hooks/usePotCategories';
import { StepSidebar } from '../components/pot-onboarding/StepSidebar';
import { CategoryStep } from '../components/pot-onboarding/CategoryStep';
import { DetailsStep } from '../components/pot-onboarding/DetailsStep';
import { PhotosStep } from '../components/pot-onboarding/PhotosStep';
import { GoalStep } from '../components/pot-onboarding/GoalStep';
import { ReviewStep } from '../components/pot-onboarding/ReviewStep';
import { PreviewStep } from '../components/pot-onboarding/PreviewStep';
import { PotSuccessDialog } from '../components/pot-onboarding/PotSuccessDialog';
import { uploadPotCover, uploadPotFeatureImages, createPot } from '../lib/potApi';
import type { PotDraft, Pot } from '../types/pot';
import { STEP_CONTENT } from '../types/pot';

const TOTAL_STEPS = 6;

export const PotOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const { categories, isLoading: categoriesLoading, error: categoriesError, retry: retryCategories } = usePotCategories();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdPot, setCreatedPot] = useState<Pot | null>(null);
  const [draft, setDraft] = useState<PotDraft>({
    categoryId: '',
    title: '',
    story: '',
    goalAmount: '',
    smartGoal: true,
    coverImage: null,
    featureImages: [null, null, null],
  });

  useEffect(() => {
    if (draft.categoryId === '' && categories.length > 0) {
      setDraft((d) => ({ ...d, categoryId: categories[0].id }));
    }
  }, [categories, draft.categoryId]);

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

  const categoryLabel = categories.find((c) => c.id === draft.categoryId)?.name ?? '';
  const goalNum = Number(draft.goalAmount) || 0;
  const formattedGoal = `KES ${goalNum.toLocaleString('en-US')}`;
  const storyExcerpt = draft.story.length > 140 ? `${draft.story.slice(0, 140).trim()}…` : draft.story;
  const photoSummary = draft.coverImage
    ? `Cover + ${draft.featureImages.filter(Boolean).length} feature image(s)`
    : 'No photos added yet';

  const requiredOk: Record<number, boolean> = {
    1: draft.categoryId !== '',
    2: draft.title.trim().length > 0 && draft.story.trim().length > 0,
    3: draft.coverImage !== null,
    4: draft.goalAmount !== '' && Number(draft.goalAmount) > 0,
    5: true,
    6: true,
  };
  const canContinue = requiredOk[step];

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goHome = () => navigate('/');
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const jumpTo = (n: number) => setStep(n);

  const handleLaunch = async () => {
    if (!draft.coverImage) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const coverUrl = await uploadPotCover(draft.coverImage, accessToken);
      const featureFiles = draft.featureImages.filter((f): f is File => f !== null);
      const featureUrls = await uploadPotFeatureImages(featureFiles, accessToken);
      const pot = await createPot({
        title: draft.title,
        description: draft.story,
        coverImage: coverUrl,
        featuredImages: featureUrls,
        goal: Number(draft.goalAmount),
        categoryId: draft.categoryId,
        smartGoalSetting: draft.smartGoal,
      });
      setCreatedPot(pot);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainAction = () => {
    if (step === TOTAL_STEPS) {
      handleLaunch();
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
    <>
      <div className="flex min-h-screen w-full bg-background">
        <StepSidebar step={step} content={STEP_CONTENT[step]} />

        <div className="flex-1 bg-surface-lowest rounded-tl-[40px] flex flex-col relative min-w-0">
          <div className="flex-1 overflow-y-auto flex px-16">
            <div key={step} className="pot-step-in w-full max-w-[560px] mx-auto my-auto">
              {step === 1 && (
                <CategoryStep
                  categories={categories}
                  categoryId={draft.categoryId}
                  onSelect={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
                  isLoading={categoriesLoading}
                  error={categoriesError}
                  onRetry={retryCategories}
                />
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

          <div className="px-16 pb-10">
            {submitError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                {submitError}
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (step === 1) {
                    goHome();
                  } else {
                    goBack();
                  }
                }}
                disabled={isSubmitting}
                className="bg-transparent text-foreground font-display text-sm font-semibold ring-1 ring-inset ring-foreground/15 rounded-xl px-7 py-3.5 disabled:opacity-50"
              >
                Back
              </button>

              <button
                onClick={mainAction}
                disabled={!canContinue || isSubmitting}
                className={`font-display text-sm font-semibold rounded-xl px-8 py-3.5 ${
                  canContinue && !isSubmitting
                    ? 'bg-primary text-on-primary cursor-pointer'
                    : 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                }`}
              >
                {step === TOTAL_STEPS ? (isSubmitting ? 'Launching…' : 'Launch Pot') : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {createdPot && <PotSuccessDialog pot={createdPot} onDone={() => navigate('/')} />}
    </>
  );
};
