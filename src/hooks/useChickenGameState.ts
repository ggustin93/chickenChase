import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChickenGameState, Challenge, Message } from '../data/types';
import { supabase } from '../lib/supabase';
import { GameEventService } from '../services/GameEventService';
import { gameService } from '../services/GameService';
import { challengeService } from '../services/ChallengeService';
import { messageService } from '../services/MessageService';
import { chickenPositionService } from '../services/ChickenPositionService';
import { useGameBars } from './useGameBars';

// Constants for performance optimization
const GAME_STATUS_CHECK_INTERVAL = 5000; // 5 seconds
const LOCAL_UPDATE_GRACE_PERIOD = 2000; // 2 seconds
const DEFAULT_GAME_DURATION_HOURS = 3;

// Définir un type pour la fenêtre avec notre propriété personnalisée
declare global {
  interface Window {
    _lastGameStatusUpdate?: number;
  }
}

// Initial empty state matching ChickenGameState interface
const createInitialGameState = (): ChickenGameState => ({
  game: {
    id: '',
    name: '',
    startTime: '',
    endTime: '',
    status: 'lobby',
    maxTeams: 8,
    chicken_hidden_at: undefined
  },
  teams: [],
  challenges: [],
  challengeCompletions: [],
  messages: [],
  currentBar: null,
  timeLeft: '00:00:00',
  barOptions: [],
  isChickenHidden: false,
  hidingTimeLeft: '00:00',
  initialCagnotte: 0,
  currentCagnotte: 0
});

export const useChickenGameState = (gameId?: string) => {
  const [gameState, setGameState] = useState<ChickenGameState>(createInitialGameState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the game bars hook to get bars from database
  const { bars: databaseBars, loading: barsLoading, error: barsError } = useGameBars(gameId);
  
  // Debug bars loading
  console.log('🔧 DEBUG useChickenGameState: gameId:', gameId);
  console.log('🔧 DEBUG useChickenGameState: databaseBars:', databaseBars);
  console.log('🔧 DEBUG useChickenGameState: barsLoading:', barsLoading);
  console.log('🔧 DEBUG useChickenGameState: barsError:', barsError);
  
  // Référence pour stocker les intervalles de timer
  const hidingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Référence pour suivre les mises à jour locales récentes
  const lastLocalUpdateRef = useRef<number>(0);
  
  // Fonction pour marquer une mise à jour locale - optimized
  const markLocalUpdate = useCallback(() => {
    const now = Date.now();
    lastLocalUpdateRef.current = now;
    window._lastGameStatusUpdate = now;
  }, []);
  
  // Optimized time conversion functions with useMemo
  const timeToSeconds = useMemo(() => {
    return (timeString: string): number => {
      if (!timeString || typeof timeString !== 'string') return 0;
      const [minutes = 0, seconds = 0] = timeString.split(':').map(Number);
      return (minutes * 60) + seconds;
    };
  }, []);
  
  const secondsToTime = useMemo(() => {
    return (totalSeconds: number): string => {
      if (typeof totalSeconds !== 'number' || totalSeconds < 0) return '00:00';
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
  }, []);

  // Fetch all game data from services
  const fetchGameData = useCallback(async () => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch game with relations
      const gameResult = await gameService.findByIdWithRelations(gameId);
      if (!gameResult.success) {
        setError(gameResult.error || 'Failed to fetch game data');
        return;
      }

      const gameData = gameResult.data!;

      // Fetch challenges
      const challengesResult = await challengeService.findMany({});
      const challenges = challengesResult.success ? challengesResult.data! : [];

      // Fetch messages for this game
      const messagesResult = await messageService.findByGameId(gameId);
      const messages = messagesResult.success ? messagesResult.data! : [];

      // Transform the data to match ChickenGameState structure
      const transformedState: ChickenGameState = {
        game: {
          id: gameData.id,
          name: `Game ${gameData.join_code}`,
          startTime: gameData.started_at || gameData.created_at,
          endTime: gameData.started_at 
            ? new Date(new Date(gameData.started_at).getTime() + (gameData.game_duration || 120) * 60000).toISOString()
            : '',
          status: gameData.status,
          maxTeams: gameData.max_teams || 8,
          chicken_hidden_at: gameData.chicken_hidden_at || undefined
        },
        teams: (gameData.all_teams || []).map(t => ({
          id: t.id,
          name: t.name,
          avatarUrl: '', // Default empty avatar
          score: t.score || 0,
          members: [], // Will be populated by players in team
          barsVisited: t.bars_visited || 0,
          challengesCompleted: t.challenges_completed || 0,
          foundChicken: t.found_chicken || false,
          is_chicken_team: t.is_chicken_team || false
        })),
        challenges: challenges.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          points: c.points,
          type: c.type as 'photo' | 'unlock' | undefined,
          active: true,
          correctAnswer: c.correct_answer || undefined,
          completed: false,
          teams: []
        })),
        challengeCompletions: [], // TODO: Fetch from challenge_submissions
        messages: messages.map(m => ({
          id: m.id.toString(),
          content: m.content,
          sender: m.sender || 'Unknown',
          timestamp: m.timestamp || m.created_at,
          isClue: m.is_clue || false,
          gameId: m.game_id,
          userId: m.user_id || ''
        })),
        timeLeft: gameData.status === 'chicken_hidden' ? '03:00:00' : '00:00:00',
        barOptions: databaseBars || [],
        isChickenHidden: gameData.status === 'chicken_hidden',
        hidingTimeLeft: '00:00',
        initialCagnotte: gameData.cagnotte_initial || 0,
        currentCagnotte: gameData.cagnotte_current || 0
      };

      setGameState(transformedState);
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, databaseBars]);

  // Initial data fetch and real-time subscriptions
  useEffect(() => {
    // Fetch data on mount
    fetchGameData();

    if (!gameId) return;

    // Set up real-time subscriptions for game data changes
    const channelName = `chicken-game-${gameId}`;
    console.log('📡 Setting up chicken game real-time channel:', channelName);
    
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
        console.log('🎮 Game status update received:', payload);
        fetchGameData(); // Refetch all game data when game changes
      }
    );

    // Listen for team updates
    gameChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams'
      },
      (payload) => {
        console.log('👥 Team update received:', payload);
        fetchGameData(); // Refetch game data when teams change
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
        fetchGameData(); // Refetch game data when challenge submissions change
      }
    );

    // Listen for message updates
    gameChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        console.log('💬 New message received:', payload);
        fetchGameData(); // Refetch game data when new messages arrive
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
        console.log('🔔 Game event received:', payload);
        fetchGameData(); // Refetch game data when new events occur
      }
    );

    // Subscribe to the channel
    gameChannel.subscribe((status) => {
      console.log(`📡 Chicken game realtime status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to chicken game updates');
      } else if (status === 'CLOSED') {
        console.log('❌ Chicken game subscription closed');
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up chicken game real-time subscriptions');
      supabase.removeChannel(gameChannel);
    };
  }, [gameId]); // Remove fetchGameData dependency to prevent loops
  
  // Vérification périodique du statut du jeu dans Supabase
  useEffect(() => {
    if (!gameId) return;
    
    const checkGameStatus = async () => {
      try {
        console.log("Vérification du statut du jeu dans Supabase:", gameId);
        
        // Vérifier si une mise à jour locale récente a eu lieu (moins de 5 secondes)
        const timeSinceLastUpdate = Date.now() - lastLocalUpdateRef.current;
        if (timeSinceLastUpdate < 5000) {
          console.log("Mise à jour locale récente détectée, report de la synchronisation Supabase");
          return;
        }
        
        // Ne pas utiliser .single() pour éviter l'erreur quand aucune ligne n'est retournée
        const { data, error } = await supabase
          .from('games')
          .select('status, chicken_team_id')
          .eq('id', gameId);
        
        if (error) {
          console.error("Erreur lors de la vérification du statut du jeu:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const dbStatus = data[0].status;
          console.log("Statut du jeu dans Supabase:", dbStatus);
          
          // Use ref to get current state without causing dependency loop
          setGameState(prevState => {
            // Only update if status actually changed
            if (prevState.game.status !== dbStatus) {
              console.log("Mise à jour du statut local avec celui de Supabase:", dbStatus);
              
              // If status changed to "chicken_hidden", update accordingly
              if (dbStatus === 'chicken_hidden' && !prevState.isChickenHidden) {
                console.log("Le poulet est maintenant caché selon Supabase");
                
                const formattedGameTime = `${DEFAULT_GAME_DURATION_HOURS}:00:00`;
                
                return {
                  ...prevState,
                  game: {
                    ...prevState.game,
                    status: dbStatus
                  },
                  isChickenHidden: true,
                  hidingTimeLeft: '00:00',
                  timeLeft: formattedGameTime
                };
              } else {
                return {
                  ...prevState,
                  game: {
                    ...prevState.game,
                    status: dbStatus
                  },
                  isChickenHidden: dbStatus === 'chicken_hidden'
                };
              }
            }
            return prevState; // No change needed
          });
        } else {
          console.warn("Aucune partie trouvée avec l'ID:", gameId);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut du jeu:", err);
      }
    };
    
    // Vérifier immédiatement le statut au chargement
    checkGameStatus();
    
    // Puis vérifier périodiquement avec constante optimisée
    const interval = setInterval(checkGameStatus, GAME_STATUS_CHECK_INTERVAL);
    
    return () => {
      clearInterval(interval);
    };
  }, [gameId]); // Remove gameState dependencies to prevent infinite loop
  
  // Update game state when database bars are loaded
  useEffect(() => {
    if (databaseBars.length > 0) {
      setGameState(prevState => ({
        ...prevState,
        barOptions: databaseBars
      }));
    } else if (!barsLoading && gameId) {
      // Fallback: use demo bars if no database bars are found
      console.log('🔧 No database bars found, using demo bars for development');
      const demoBars = [
        {
          id: 'demo-bar-1',
          name: 'Delirium Café',
          address: 'Impasse de la Fidélité 4, 1000 Bruxelles',
          description: 'Famous beer café with over 3000 beers',
          latitude: 50.8476,
          longitude: 4.3564,
          photoUrl: undefined
        },
        {
          id: 'demo-bar-2', 
          name: 'À la Mort Subite',
          address: 'Rue Montagne aux Herbes Potagères 7, 1000 Bruxelles',
          description: 'Historic lambic specialist since 1928',
          latitude: 50.8462,
          longitude: 4.3547,
          photoUrl: undefined
        },
        {
          id: 'demo-bar-3',
          name: 'Brussels Beer Project',
          address: 'Rue Antoine Dansaert 188, 1000 Bruxelles', 
          description: 'Modern craft brewery and taproom',
          latitude: 50.8509,
          longitude: 4.3442,
          photoUrl: undefined
        }
      ];
      
      setGameState(prevState => ({
        ...prevState,
        barOptions: demoBars
      }));
    }
  }, [databaseBars, barsLoading, gameId]);

  // Effect to load saved chicken position
  useEffect(() => {
    const loadSavedPosition = async () => {
      if (!gameId || databaseBars.length === 0) return;
      
      const result = await chickenPositionService.getChickenCurrentBar(gameId);
      if (result.success && result.data?.currentBarId) {
        const savedBar = databaseBars.find(bar => bar.id === result.data!.currentBarId);
        if (savedBar) {
          setGameState(prevState => ({ ...prevState, currentBar: savedBar }));
        }
      }
    };

    loadSavedPosition();
  }, [gameId, databaseBars]);

  // Chargement des données du jeu - this is handled by the fetchGameData useEffect above

  // Update loading state to include bars loading
  const totalLoading = isLoading || barsLoading;
  
  // Gestion du timer de cachette
  useEffect(() => {
    // Only start timer if we have hiding time and chicken is not hidden yet
    if (gameState.hidingTimeLeft && !gameState.isChickenHidden && gameState.hidingTimeLeft !== '00:00') {
      // Si timer déjà en cours, le nettoyer
      if (hidingTimerRef.current) {
        clearInterval(hidingTimerRef.current);
      }
      
      // Démarrer le timer pour la phase de cachette
      let seconds = timeToSeconds(gameState.hidingTimeLeft);
      
      hidingTimerRef.current = setInterval(() => {
        if (seconds <= 0) {
          // Le temps est écoulé, nettoyer l'intervalle
          if (hidingTimerRef.current) {
            clearInterval(hidingTimerRef.current);
            hidingTimerRef.current = null;
          }
          // Forcer le poulet à être caché si le temps est écoulé
          hideChicken();
        } else {
          seconds -= 1;
          setGameState(prevState => ({
            ...prevState,
            hidingTimeLeft: secondsToTime(seconds)
          }));
        }
      }, 1000);
    }
    
    return () => {
      // Nettoyer l'intervalle à la sortie
      if (hidingTimerRef.current) {
        clearInterval(hidingTimerRef.current);
      }
    };
  }, [gameState.isChickenHidden]); // Only depend on isChickenHidden to prevent timer restart loops
  
  // Gestion du timer principal du jeu
  useEffect(() => {
    if (gameState.isChickenHidden && gameState.timeLeft && gameState.timeLeft !== '00:00:00') {
      // Si timer déjà en cours, le nettoyer
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      
      // Démarrer le timer principal
      let seconds = timeToSeconds(gameState.timeLeft);
      
      gameTimerRef.current = setInterval(() => {
        if (seconds <= 0) {
          // Le temps est écoulé, nettoyer l'intervalle
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
          }
        } else {
          seconds -= 1;
          setGameState(prevState => ({
            ...prevState,
            timeLeft: secondsToTime(seconds)
          }));
        }
      }, 1000);
    }
    
    return () => {
      // Nettoyer l'intervalle à la sortie
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [gameState.isChickenHidden]); // Keep dependency minimal to prevent restart loops

  const sendClue = (clueText: string) => {
    const newClue: Message = {
      id: `clue-${Date.now()}`,
      content: clueText,
      sender: 'Le Poulet',
      gameId: gameState.game.id,
      userId: 'chicken',
      timestamp: new Date().toISOString(),
      isClue: true,
    };

    setGameState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newClue],
    }));

    return newClue;
  };

  const handleChallengeValidation = useCallback(async (id: string, approve: boolean) => {
    try {
      // First get the submission details for the game event
      const { data: submission, error: fetchError } = await supabase
        .from('challenge_submissions')
        .select('*, challenge:challenges(title), team:teams(name)')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Failed to fetch submission details:', fetchError);
        return;
      }

      // Update challenge submission status
      const { error } = await supabase
        .from('challenge_submissions')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', id);
      
      if (error) {
        console.error('Failed to update challenge submission:', error);
        return;
      }

      // Create a game event for the validation
      if (gameId && submission) {
        const gameEventService = new GameEventService();
        await gameEventService.createEvent(gameId, 'challenge_validated', {
          submissionId: id,
          challengeTitle: (submission as any).challenge?.title || 'Unknown Challenge',
          teamName: (submission as any).team?.name || 'Unknown Team',
          approved: approve,
          timestamp: new Date().toISOString()
        });

        // Send a message notification
        const status = approve ? 'validé' : 'rejeté';
        const teamName = (submission as any).team?.name || 'Une équipe';
        const challengeTitle = (submission as any).challenge?.title || 'un défi';
        
        const newMessage: Message = {
          id: `validation-${Date.now()}`,
          content: `🏆 ${teamName} a eu son défi "${challengeTitle}" ${status} !`,
          sender: 'Le Poulet',
          gameId: gameId,
          userId: 'chicken',
          timestamp: new Date().toISOString(),
          isClue: false,
        };

        setGameState(prevState => ({
          ...prevState,
          messages: [...prevState.messages, newMessage],
        }));
      }

      // Refresh game data to get updated submissions
      await fetchGameData();
    } catch (error) {
      console.error('Error updating challenge validation:', error);
    }
  }, [fetchGameData, gameId]);

  const markTeamFound = (teamId: string) => {
    setGameState(prevState => {
      const updatedTeams = prevState.teams.map(team => 
        team.id === teamId ? { ...team, foundChicken: true } : team
      );
      return { ...prevState, teams: updatedTeams };
    });
  };

  const changeCurrentBar = async (barId: string) => {
    // Si le poulet est déjà caché, il ne peut plus changer de bar
    if (gameState.isChickenHidden) return null;
    
    // Use database bars if available, otherwise fall back to mock data
    const barsToSearch = databaseBars.length > 0 ? databaseBars : gameState.barOptions;
    const bar = barsToSearch.find(b => b.id === barId);
    if (bar && gameId) {
      // Save to persistent storage
      await chickenPositionService.updateChickenCurrentBar(gameId, barId);
      
      // Update local state
      setGameState(prevState => ({ ...prevState, currentBar: bar }));
      return bar;
    }
    return null;
  };

  const toggleChallengeStatus = (id: string) => {
    setGameState(prevState => {
      const updatedChallenges = prevState.challenges.map(challenge => 
        challenge.id === id ? {...challenge, active: !challenge.active} : challenge
      );
      return { ...prevState, challenges: updatedChallenges };
    });
  };

  const sendMessage = (messageText: string) => {
    if (!messageText.trim()) return null;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageText,
      sender: 'Le Poulet',
      gameId: gameState.game.id,
      userId: 'chicken',
      timestamp: new Date().toISOString(),
      isClue: false,
    };

    setGameState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newMessage],
    }));

    return newMessage;
  };

  const addChallenge = (challenge: Omit<Challenge, 'id' | 'active'>) => {
    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      ...challenge,
      active: true,
    };

    setGameState(prevState => ({
      ...prevState,
      challenges: [...prevState.challenges, newChallenge],
    }));

    return newChallenge;
  };
  
  // Fonction pour indiquer que le poulet est caché
  const hideChicken = useCallback(async () => {
    if (!gameId) return;
    
    // Arrêter le timer de cachette si actif
    if (hidingTimerRef.current) {
      clearInterval(hidingTimerRef.current);
      hidingTimerRef.current = null;
    }
    
    try {
      // Marquer une mise à jour locale pour éviter les conflits avec la vérification périodique
      markLocalUpdate();
      
      // Use the game service to hide chicken
      const result = await gameService.hideChicken(gameId);
      
      if (!result.success) {
        console.error("Failed to hide chicken:", result.error);
        throw new Error(result.error || 'Failed to hide chicken');
      }
      
      console.log("Chicken hidden successfully");
      
      // Reset the timer to 3 hours when the chicken is hidden
      const gameTimeInHours = 3;
      const formattedGameTime = `${gameTimeInHours}:00:00`;
      
      // Mettre à jour l'état local
      setGameState(prevState => ({
        ...prevState,
        isChickenHidden: true,
        hidingTimeLeft: '00:00',
        timeLeft: formattedGameTime, // Reset to 3 hours
        game: {
          ...prevState.game,
          status: 'chicken_hidden',
          chicken_hidden_at: new Date().toISOString()
        }
      }));
      
      // Create a game event for chicken hiding
      const gameEventService = new GameEventService();
      await gameEventService.createEvent(gameId, 'chicken_hidden', {
        hiddenAt: new Date().toISOString(),
        gameTimeHours: gameTimeInHours,
        timestamp: new Date().toISOString()
      });

      // Message système indiquant que la chasse a commencé
      const gameStartMessage: Message = {
        id: `game-start-${Date.now()}`,
        content: `🔔 Le poulet est caché ! La chasse est officiellement ouverte et durera ${gameTimeInHours} heures !`,
        sender: 'Le Poulet',
        gameId: gameId,
        userId: 'chicken',
        timestamp: new Date().toISOString(),
        isClue: false,
      };

      setGameState(prevState => ({
        ...prevState,
        messages: [...prevState.messages, gameStartMessage],
      }));
    } catch (err) {
      console.error("Error updating chicken hidden status:", err);
      // Fallback en cas d'erreur
      setGameState(prevState => ({
        ...prevState,
        isChickenHidden: true,
        hidingTimeLeft: '00:00',
        timeLeft: `3:00:00` // Reset to 3 hours
      }));
    }
  }, [gameId, markLocalUpdate]);

  // Fonction pour terminer la partie
  const finishGame = useCallback(async () => {
    if (!gameId) return;
    
    try {
      console.log("Finishing game with ID:", gameId);
      
      // Utiliser la fonction RPC corrigée pour mettre à jour le statut
      const { data, error } = await supabase
        .rpc('update_game_status', { 
          game_id: gameId,
          new_status: 'finished',
          changed_by: 'chicken_player',
          metadata: { 
            final_scores: gameState.teams.map(t => ({ id: t.id, score: t.score })),
            ended_by: 'chicken'
          }
        });
      
      if (error) throw error;
      
      if (!data || !data.success) {
        console.error("La mise à jour du statut a échoué:", data);
        throw new Error('Erreur lors de la fin de la partie');
      }
      
      console.log("Game finished successfully:", data);
      
      // Mettre à jour l'état local
      setGameState(prevState => ({
        ...prevState,
        game: {
          ...prevState.game,
          status: 'finished',
          end_time: new Date().toISOString()
        }
      }));
      
      // Message système indiquant que la partie est terminée
      sendMessage(`🏁 La partie est terminée ! Merci d'avoir joué à Chicken Chase !`);
      
      // Créer un événement de fin de partie avec les scores finaux
      const finalScores = gameState.teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        score: team.score || 0,
        barsVisited: team.barsVisited || 0,
        challengesCompleted: team.challengesCompleted || 0
      }));
      
      const gameEventService = new GameEventService();
      await gameEventService.createEvent(gameId, 'game_finished', {
        finalScores,
        winner: finalScores.reduce((prev, current) => 
          (prev.score > current.score) ? prev : current
        ),
        duration: gameState.timeLeft
      });
      
    } catch (err) {
      console.error("Error finishing game:", err);
      throw err;
    }
  }, [gameId, gameState.teams, gameState.timeLeft, sendMessage]);

  return {
    gameState,
    isLoading: isLoading || barsLoading,
    error: error || barsError,
    sendClue,
    handleChallengeValidation,
    markTeamFound,
    changeCurrentBar,
    toggleChallengeStatus,
    sendMessage,
    addChallenge,
    hideChicken,
    finishGame,
    refetch: fetchGameData
  };
};

export default useChickenGameState; 