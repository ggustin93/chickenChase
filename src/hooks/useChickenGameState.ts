import { useState, useEffect, useRef, useCallback } from 'react';
import { ChickenGameState, Challenge, Message } from '../data/types';
import { mockChickenGameState } from '../data/mock/mockData';
// import { supabase } from '../lib/supabase';

export const useChickenGameState = (gameId?: string) => {
  const [gameState, setGameState] = useState<ChickenGameState>(mockChickenGameState);
  const [isLoading, setIsLoading] = useState(false);
  
  // Référence pour stocker les intervalles de timer
  const hidingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const hideChicken = useCallback(() => {
    if (!gameState.currentBar) return;
    
    // Arrêter le timer de cachette si actif
    if (hidingTimerRef.current) {
      clearInterval(hidingTimerRef.current);
      hidingTimerRef.current = null;
    }
    
    // Reset the timer to 3 hours when the chicken is hidden
    const gameTimeInHours = 3;
    const formattedGameTime = `${gameTimeInHours}:00:00`;
    
    // Mettre à jour l'état
    setGameState(prevState => ({
      ...prevState,
      isChickenHidden: true,
      hidingTimeLeft: '00:00',
      timeLeft: formattedGameTime // Reset to 3 hours
    }));
    
    // Message système indiquant que la chasse a commencé
    sendMessage(`🔔 Le poulet est caché ! La chasse est officiellement ouverte et durera ${gameTimeInHours} heures !`);
  }, [gameState.currentBar]);

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