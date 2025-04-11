import { useState, useEffect } from 'react';
import { ChickenGameState, Challenge, Message } from '../data/types';
import { mockChickenGameState } from '../data/mock/mockData';

export const useChickenGameState = (initialState = mockChickenGameState) => {
  const [gameState, setGameState] = useState<ChickenGameState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate initial loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

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
  };
};

export default useChickenGameState; 