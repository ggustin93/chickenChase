import { useState, useEffect, useCallback } from 'react';
import { gameBarService } from '../services';
import { Bar } from '../data/types';
import { DbGameBar } from '../data/database-types';

interface UseGameBarsState {
  bars: Bar[];
  loading: boolean;
  error: string | null;
}

interface UseGameBarsResult extends UseGameBarsState {
  refresh: () => Promise<void>;
  markAsVisited: (barId: string, teamId: string) => Promise<void>;
}

/**
 * Hook to manage bars for a specific game from Supabase database
 */
export const useGameBars = (gameId?: string): UseGameBarsResult => {
  const [state, setState] = useState<UseGameBarsState>({
    bars: [],
    loading: false,
    error: null
  });

  /**
   * Convert DbGameBar to Bar format for compatibility
   */
  const convertDbBarToBar = useCallback((dbBar: DbGameBar): Bar => {
    return {
      id: dbBar.id,
      name: dbBar.name,
      address: dbBar.address,
      description: dbBar.description || '',
      photoUrl: dbBar.photo_url || undefined,
      latitude: dbBar.latitude,
      longitude: dbBar.longitude
    };
  }, []);

  /**
   * Load bars from database
   */
  const loadBars = useCallback(async () => {
    if (!gameId) {
      setState(prev => ({ ...prev, bars: [], error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await gameBarService.findByGameId(gameId);
      
      if (result.success) {
        const bars = result.data!.map(convertDbBarToBar);
        setState(prev => ({
          ...prev,
          bars,
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          bars: [],
          loading: false,
          error: result.error || 'Failed to load bars'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        bars: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [gameId, convertDbBarToBar]);

  /**
   * Refresh bars data
   */
  const refresh = useCallback(async () => {
    await loadBars();
  }, [loadBars]);

  /**
   * Mark a bar as visited by a team
   */
  const markAsVisited = useCallback(async (barId: string, teamId: string) => {
    if (!gameId) return;

    try {
      const result = await gameBarService.markBarAsVisited(gameId, barId, teamId);
      
      if (result.success) {
        // Refresh the bars to update the visited status
        await loadBars();
      } else {
        console.error('Failed to mark bar as visited:', result.error);
      }
    } catch (error) {
      console.error('Error marking bar as visited:', error);
    }
  }, [gameId, loadBars]);

  // Load bars when gameId changes
  useEffect(() => {
    loadBars();
  }, [loadBars]);

  return {
    ...state,
    refresh,
    markAsVisited
  };
};