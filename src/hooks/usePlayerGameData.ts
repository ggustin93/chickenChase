import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Team, Challenge, Bar, Message } from '../data/types';
import { OpenStreetMapService } from '../services/openStreetMapService';
import { messageService } from '../services/MessageService';

// Constants for better maintainability
const DEFAULT_ERROR_MESSAGE = 'An unknown error occurred';
const CHANNEL_PREFIX = 'player-game-data-';

// Client-side caching constants
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const COORDINATE_PRECISION = 3; // Round coordinates to 3 decimal places for cache keys

// Types for caching
interface CachedBarSearch {
  data: Bar[];
  timestamp: number;
  coordinates: { lat: number; lng: number };
  radius: number;
}

// Define types for the game data
// These should be moved to a central types file later
interface PlayerGameState {
  team: Team | null;
  challenges: Challenge[];
  bars: Bar[];
  messages: Message[];
}

export const usePlayerGameData = (gameId: string | undefined, teamId: string | undefined) => {
  const [gameState, setGameState] = useState<PlayerGameState>({
    team: null,
    challenges: [],
    bars: [],
    messages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Client-side cache for bar searches
  const barSearchCache = useRef<Map<string, CachedBarSearch>>(new Map());

  // Define fetchData as a useCallback at the top level
  const fetchData = useCallback(async () => {
    if (!gameId) {
      setLoading(false);
      return;
    }

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

      // Fetch messages for this game
      const messagesResult = await messageService.findByGameId(gameId);
      const messages = messagesResult.success ? messagesResult.data! : [];
      
      setGameState({
        team: teamData,
        challenges: challengesData || [],
        bars: bars,
        messages: messages.map(m => ({
          id: m.id,
          gameId: m.game_id,
          userId: m.user_id || m.player_id || '',
          sender: m.sender || 'System',
          content: m.content,
          timestamp: m.timestamp || m.created_at,
          isClue: m.is_clue || false,
          photoUrl: m.photo_url,
          isCagnotteEvent: m.is_cagnotte_event,
          isBarRemoval: m.is_bar_removal,
          amount: m.amount,
          barId: m.bar_id,
        })),
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE;
      console.error('Error fetching player game data:', e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [gameId, teamId]);

  useEffect(() => {
    fetchData();

    // Only set up subscription if we have a gameId
    if (!gameId) {
      return;
    }

    // Set up specific real-time subscriptions for player game updates
    const channelName = `${CHANNEL_PREFIX}${gameId}`;
    console.log('📡 Setting up player game real-time channel:', channelName);
    
    const gameChannel = supabase.channel(channelName);

    // Listen for game status changes
    gameChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log('🎮 Player game status update received:', payload);
        fetchData(); // Refetch data when game status changes
      }
    );

    // Listen for team updates (especially for the player's team)
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams'
      },
      (payload) => {
        console.log('👥 Player team update received:', payload);
        fetchData(); // Refetch data when teams change
      }
    );

    // Listen for challenge updates
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenges'
      },
      (payload) => {
        console.log('🏆 Challenge update received:', payload);
        fetchData(); // Refetch data when challenges change
      }
    );

    // Listen for bar updates
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_bars'
      },
      (payload) => {
        console.log('🍺 Bar update received:', payload);
        fetchData(); // Refetch data when bars change
      }
    );

    // Listen for game events (real-time notifications)
    gameChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events'
      },
      (payload) => {
        console.log('🔔 Player game event received:', payload);
        fetchData(); // Refetch data when new events occur
      }
    );

    // Listen for challenge submission changes
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'challenge_submissions'
      },
      (payload) => {
        console.log('🏆 Challenge submission update received:', payload);
        fetchData(); // Refetch data when challenge submissions change
      }
    );

    // Listen for message updates
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('💬 New message received:', payload);
        fetchData(); // Refetch game data when new messages arrive
      }
    );

    // Subscribe to the channel
    gameChannel.subscribe((status) => {
      console.log(`📡 Player game realtime status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to player game updates');
      } else if (status === 'CLOSED') {
        console.log('❌ Player game subscription closed');
      }
    });

    return () => {
      console.log('🧹 Cleaning up player game real-time subscriptions');
      supabase.removeChannel(gameChannel);
    };

  }, [fetchData, gameId]);

  // Client-side cached bar search function
  const searchBarsNearLocation = useCallback(async (
    lat: number, 
    lng: number, 
    radiusMeters: number = 1000
  ): Promise<Bar[]> => {
    try {
      // Generate cache key based on rounded coordinates and radius
      const roundedLat = Number(lat.toFixed(COORDINATE_PRECISION));
      const roundedLng = Number(lng.toFixed(COORDINATE_PRECISION));
      const cacheKey = `${roundedLat}-${roundedLng}-${radiusMeters}`;
      
      // Check cache first
      const cachedResult = barSearchCache.current.get(cacheKey);
      const now = Date.now();
      
      if (cachedResult && (now - cachedResult.timestamp) < CACHE_TTL) {
        console.log('Bar search cache hit for key:', cacheKey);
        return cachedResult.data;
      }
      
      // Cache miss or expired - perform actual search
      console.log('Bar search cache miss for key:', cacheKey, 'performing API call');
      const places = await OpenStreetMapService.searchBarsNearLocation(lat, lng, radiusMeters);
      
      // Convert places to bars format
      const bars: Bar[] = places.map(place => ({
        id: place.placeId || `bar-${Date.now()}-${Math.random()}`,
        name: place.name || 'Bar sans nom',
        address: place.address || 'Adresse non disponible',
        latitude: place.latitude,
        longitude: place.longitude,
        description: `${place.types?.join(', ') || 'Bar'}`,
        photoUrl: undefined,
      }));
      
      // Store in cache
      barSearchCache.current.set(cacheKey, {
        data: bars,
        timestamp: now,
        coordinates: { lat: roundedLat, lng: roundedLng },
        radius: radiusMeters
      });
      
      // Clean up expired entries (keep cache size manageable)
      const expiredKeys = Array.from(barSearchCache.current.entries())
        .filter(([, cached]) => (now - cached.timestamp) >= CACHE_TTL)
        .map(([key]) => key);
      
      expiredKeys.forEach(key => barSearchCache.current.delete(key));
      
      return bars;
    } catch (error) {
      console.error('Error in cached bar search:', error);
      return [];
    }
  }, []);

  return { gameState, loading, error, searchBarsNearLocation };
}; 