import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Team, Challenge } from '../data/types';

// Define types for the game data
// These should be moved to a central types file later
interface PlayerGameState {
  team: Team | null;
  challenges: Challenge[];
}

export const usePlayerGameData = (gameId: string | undefined, teamId: string | undefined) => {
  const [gameState, setGameState] = useState<PlayerGameState>({
    team: null,
    challenges: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !teamId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch team details
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (teamError) throw new Error('Failed to fetch team data');

        // Fetch available challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*');
        
        if (challengesError) throw new Error('Failed to fetch challenges');

        setGameState({
          team: teamData,
          challenges: challengesData,
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up a real-time subscription for future updates
    const subscription = supabase
      .channel(`player-game-data-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Game data change received!', payload);
        fetchData(); // Refetch all data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  }, [gameId, teamId]);

  return { gameState, loading, error };
}; 