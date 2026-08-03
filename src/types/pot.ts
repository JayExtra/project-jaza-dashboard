// src/types/pot.ts
export interface PotCategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: string; // kebab-case slug, e.g. "heart-pulse" — maps to a lucide-react icon name
}

export interface PotDraft {
  categoryId: string;
  title: string;
  story: string;
  goalAmount: number | '';
  smartGoal: boolean;
  coverImage: File | null;
  featureImages: [File | null, File | null, File | null];
}

export interface PotOrganiser {
  firstName: string;
  lastName: string;
  thumbnailUrl: string | null;
  id: string;
}

export interface Pot {
  id: string;
  title: string;
  description: string;
  organiser: PotOrganiser;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  category: PotCategoryMeta;
  pageId: string | null;
  smartGoalSetting: boolean;
  currency: string;
}

export interface StepContent {
  title: string;
  desc: string;
}

export const STEP_CONTENT: Record<number, StepContent> = {
  1: {
    title: "What's this Pot for?",
    desc: 'Choose the category that best describes your fundraiser. This helps us tailor tips and reach the right supporters.',
  },
  2: {
    title: 'Give your Pot a name and a story',
    desc: 'A clear title and honest story are the biggest drivers of support. Take your time here.',
  },
  3: {
    title: 'Add photos',
    desc: "A strong cover image is required — it's the first thing people see. Feature images are optional extras that add depth to your story.",
  },
  4: {
    title: 'Set your goal',
    desc: 'How much do you need to raise? You can adjust this later as your Pot grows.',
  },
  5: {
    title: 'Confirm your details',
    desc: 'Take one last look before you preview your Pot.',
  },
  6: {
    title: 'Preview your Pot',
    desc: 'This is roughly how supporters will see your Pot. Ready to share it with the world?',
  },
};
