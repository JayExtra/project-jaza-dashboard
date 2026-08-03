import { config } from './config';
import { authenticatedFetch, getAuthToken, attemptRefresh } from './api';
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

/**
 * Perform a multipart upload request with Authorization header attached from
 * the current in-memory access token. On a 401, attempts a single token
 * refresh via the shared auth interceptor and retries once with the
 * refreshed token.
 */
const uploadWithRetry = async (url: string, formData: FormData): Promise<Response> => {
  const doRequest = () => {
    const token = getAuthToken();
    return fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
  };

  let response = await doRequest();

  if (response.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await doRequest();
    }
  }

  return response;
};

export const uploadPotCover = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('coverImage', file);

  const response = await uploadWithRetry(`${config.apiBaseUrl}/pots/upload-cover`, formData);

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || 'Failed to upload cover image');
  }
  const result = await response.json();
  if (!result?.data) {
    throw new Error('Unexpected response from server');
  }
  return result.data;
};

export const uploadPotFeatureImages = async (files: File[]): Promise<string[]> => {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('featuredImages', file));

  const response = await uploadWithRetry(`${config.apiBaseUrl}/pots/upload-feature`, formData);

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || 'Failed to upload feature images');
  }
  const result = await response.json();
  if (result?.data === undefined || result?.data === null) {
    throw new Error('Unexpected response from server');
  }
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
  if (!result?.data) {
    throw new Error('Unexpected response from server');
  }
  return result.data;
};
