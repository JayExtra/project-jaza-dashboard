import config from './config';
import { authenticatedFetch } from './api';
import type { Pot } from '../types/pot';

export interface CreatePotPayload {
  title: string;
  description: string;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  categoryId: string;
  smartGoalSetting: boolean;
}

export const uploadPotCover = async (file: File, accessToken: string | null): Promise<string> => {
  const formData = new FormData();
  formData.append('coverImage', file);

  const response = await fetch(`${config.apiBaseUrl}/pots/upload-cover`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload cover image');
  }
  const result = await response.json();
  return result.data;
};

export const uploadPotFeatureImages = async (files: File[], accessToken: string | null): Promise<string[]> => {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('featuredImages', file));

  const response = await fetch(`${config.apiBaseUrl}/pots/upload-feature`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload feature images');
  }
  const result = await response.json();
  return result.data;
};

export const createPot = async (payload: CreatePotPayload): Promise<Pot> => {
  const response = await authenticatedFetch(`${config.apiBaseUrl}/pots/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || 'Failed to create Pot');
  }
  const result = await response.json();
  return result.data;
};
