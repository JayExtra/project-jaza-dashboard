import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '../lib/api';
import config from '../lib/config';
import type { PotCategoryMeta } from '../types/pot';

interface UsePotCategoriesResult {
  categories: PotCategoryMeta[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const usePotCategories = (enabled: boolean = true): UsePotCategoriesResult => {
  const [categories, setCategories] = useState<PotCategoryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${config.apiBaseUrl}/pots/categories/all`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const result = await response.json();
      setCategories(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchCategories();
  }, [enabled, fetchCategories]);

  return { categories, isLoading, error, retry: fetchCategories };
};
