import { useState, useEffect, useRef, useCallback } from 'react';
import { ChickenGameState, Challenge, Message } from '../data/types';
import { mockChickenGameState } from '../data/mock/mockData';
import { supabase } from '../lib/supabase';

// Définir un type pour la fenêtre avec notre propriété personnalisée
declare global {
  interface Window {
    _lastGameStatusUpdate?: number;
  }
}

export const useChickenGameState = (gameId?: string) => {
  const [gameState, setGameState] = useState<ChickenGameState>(mockChickenGameState);
  const [isLoading, setIsLoading] = useState(false);
  
  // Référence pour stocker les intervalles de timer
  const hidingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Référence pour suivre les mises à jour locales récentes
  const lastLocalUpdateRef = useRef<number>(0);
  
  // Fonction pour marquer une mise à jour locale
  const markLocalUpdate = useCallback(() => {
    lastLocalUpdateRef.current = Date.now();
    window._lastGameStatusUpdate = Date.now();
  }, []);
  
  // Fonction pour convertir une string "MM:SS" en secondes
  const timeToSeconds = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  // Fonction pour convertir des secondes en string "MM:SS"
  const secondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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
          console.log("Statut du jeu dans Supabase:", dbStatus, "Statut local:", gameState.game.status);
          
          // Si le statut dans Supabase est différent de celui en local, mettre à jour l'état local
          if (gameState.game.status !== dbStatus) {
            console.log("Mise à jour du statut local avec celui de Supabase:", dbStatus);
            
            setGameState(prevState => ({
              ...prevState,
              game: {
                ...prevState.game,
                status: dbStatus
              },
              isChickenHidden: dbStatus === 'chicken_hidden'
            }));
            
            // Si le statut est passé à "chicken_hidden", mettre à jour l'état local en conséquence
            if (dbStatus === 'chicken_hidden' && !gameState.isChickenHidden) {
              console.log("Le poulet est maintenant caché selon Supabase");
              
              // Reset le timer à 3 heures
              const gameTimeInHours = 3;
              const formattedGameTime = `${gameTimeInHours}:00:00`;
              
              setGameState(prevState => ({
                ...prevState,
                isChickenHidden: true,
                hidingTimeLeft: '00:00',
                timeLeft: formattedGameTime,
                game: {
                  ...prevState.game,
                  status: 'chicken_hidden'
                }
              }));
            }
          }
        } else {
          console.warn("Aucune partie trouvée avec l'ID:", gameId);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut du jeu:", err);
      }
    };
    
    // Vérifier immédiatement le statut au chargement
    checkGameStatus();
    
    // Puis vérifier périodiquement (toutes les 10 secondes)
    const interval = setInterval(checkGameStatus, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [gameId, gameState.game.status, gameState.isChickenHidden]);
  
  // Chargement des données du jeu
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;
      
      setIsLoading(true);
      
      try {
        // Récupérer les données du jeu depuis Supabase
        // Pour l'instant, nous utilisons les données mockées
        // À l'avenir, remplacer par des requêtes Supabase
        
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Utiliser les données mockées pour l'instant
        // À remplacer par les données réelles de Supabase
        setGameState({
          ...mockChickenGameState,
          game: {
            ...mockChickenGameState.game,
            id: gameId
          }
        });
        
      } catch (error) {
        console.error('Erreur lors du chargement des données du jeu:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId]);
  
  // Gestion du timer de cachette
  useEffect(() => {
    if (gameState.hidingTimeLeft && !gameState.isChickenHidden) {
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
  }, [gameState.isChickenHidden, gameState.hidingTimeLeft]);
  
  // Gestion du timer principal du jeu
  useEffect(() => {
    if (gameState.isChickenHidden) {
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
  }, [gameState.isChickenHidden]);

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

  const handleChallengeValidation = (id: string, approve: boolean) => {
    setGameState(prevState => {
      const updatedCompletions = prevState.challengeCompletions.map(completion => 
        completion.id === id 
          ? { ...completion, status: approve ? 'approved' as const : 'rejected' as const } 
          : completion
      );
      return { ...prevState, challengeCompletions: updatedCompletions };
    });
  };

  const markTeamFound = (teamId: string) => {
    setGameState(prevState => {
      const updatedTeams = prevState.teams.map(team => 
        team.id === teamId ? { ...team, foundChicken: true } : team
      );
      return { ...prevState, teams: updatedTeams };
    });
  };

  const changeCurrentBar = (barId: string) => {
    // Si le poulet est déjà caché, il ne peut plus changer de bar
    if (gameState.isChickenHidden) return null;
    
    const bar = gameState.barOptions.find(b => b.id === barId);
    if (bar) {
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
    if (!gameId || !gameState.currentBar) return;
    
    // Arrêter le timer de cachette si actif
    if (hidingTimerRef.current) {
      clearInterval(hidingTimerRef.current);
      hidingTimerRef.current = null;
    }
    
    try {
      // Marquer une mise à jour locale pour éviter les conflits avec la vérification périodique
      markLocalUpdate();
      
      // Appeler la fonction Supabase pour mettre à jour le statut du jeu
      const { data, error } = await supabase
        .rpc('update_game_status', { 
          game_id: gameId,
          new_status: 'chicken_hidden'
        });
      
      if (error) throw error;
      
      if (!data || !data.success) {
        console.error("La mise à jour du statut a échoué:", data);
        throw new Error('Erreur lors de la mise à jour du statut du jeu');
      }
      
      console.log("Chicken hidden status updated:", data);
      
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
      
      // Message système indiquant que la chasse a commencé
      sendMessage(`🔔 Le poulet est caché ! La chasse est officiellement ouverte et durera ${gameTimeInHours} heures !`);
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
  }, [gameId, gameState.currentBar, sendMessage, markLocalUpdate]);

  return {
    gameState,
    isLoading,
    sendClue,
    handleChallengeValidation,
    markTeamFound,
    changeCurrentBar,
    toggleChallengeStatus,
    sendMessage,
    addChallenge,
    hideChicken
  };
};

export default useChickenGameState; 