import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Team, Challenge, Bar } from '../data/types';

// Define types for the game data
// These should be moved to a central types file later
interface PlayerGameState {
  team: Team | null;
  challenges: Challenge[];
  bars: Bar[];
}

export const usePlayerGameData = (gameId: string | undefined, teamId: string | undefined) => {
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

    const fetchData = async () => {
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

        // Convert game_bars data to Bar format
        const bars: Bar[] = (barsData || []).map(bar => ({
          id: bar.id,
          name: bar.name,
          address: bar.address,
          description: bar.description || '',
          latitude: Number(bar.latitude),
          longitude: Number(bar.longitude),
          photoUrl: bar.photo_url || undefined,
        }));
        
        setGameState({
          team: teamData,
          challenges: challengesData || [],
          bars: bars,
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