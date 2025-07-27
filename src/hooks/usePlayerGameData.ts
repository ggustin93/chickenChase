import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Team, Challenge, Bar } from '../data/types';

// Constants for better maintainability
const DEFAULT_ERROR_MESSAGE = 'An unknown error occurred';
const CHANNEL_PREFIX = 'player-game-data-';

// Define types for the game data
// These should be moved to a central types file later
interface PlayerGameState {
  team: Team | null;
  challenges: Challenge[];
  bars: Bar[];
}

export const usePlayerGameData = (gameId: string | undefined, teamId: string | undefined) => {
  // Memoize dependencies to prevent unnecessary re-renders
  const dependencies = useMemo(() => ({ gameId, teamId }), [gameId, teamId]);
  const [gameState, setGameState] = useState<PlayerGameState>({
    team: null,
    challenges: [],
    bars: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const fetchData = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch team details (only if teamId is provided)
        let teamData = null;
        if (teamId) {
          const { data: fetchedTeamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

          if (teamError) {
            console.warn('Failed to fetch team data:', teamError);
          } else {
            teamData = fetchedTeamData;
          }
        }

        // If no teamId, try to find or create a team for this player
        if (!teamId) {
          const { data: availableTeams, error: teamsError } = await supabase
            .from('teams')
            .select('*')
            .eq('game_id', gameId)
            .eq('is_chicken_team', false);
          
          if (!teamsError && availableTeams && availableTeams.length > 0) {
            // Take the first available hunter team
            teamData = availableTeams[0];
          }
        }

        // Fetch available challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*');
        
        if (challengesError) {
          console.warn('Failed to fetch challenges:', challengesError);
        }

        // Fetch game bars
        const { data: barsData, error: barsError } = await supabase
          .from('game_bars')
          .select('*')
          .eq('game_id', gameId);
        
        if (barsError) throw new Error('Failed to fetch game bars: ' + barsError.message);

        // Convert game_bars data to Bar format with better error handling
        const bars: Bar[] = (barsData || []).map(bar => ({
          id: bar.id,
          name: bar.name || 'Unknown Bar',
          address: bar.address || 'Unknown Address',
          description: bar.description || '',
          latitude: Number(bar.latitude) || 0,
          longitude: Number(bar.longitude) || 0,
          photoUrl: bar.photo_url || undefined,
        }));
        
        setGameState({
          team: teamData,
          challenges: challengesData || [],
          bars: bars,
        });

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE;
        console.error('Error fetching player game data:', e);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [dependencies.gameId, dependencies.teamId]);

    fetchData();

    // Set up a real-time subscription for future updates with optimized channel name
    const subscription = supabase
      .channel(`${CHANNEL_PREFIX}${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Game data change received!', payload);
        fetchData(); // Refetch all data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  }, [dependencies.gameId, dependencies.teamId]);

  return { gameState, loading, error };
}; 