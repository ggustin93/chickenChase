import { useMemo } from 'react';

interface UseGameTimerDisplayProps {
  isChickenHidden: boolean;
  timeLeft?: string;
  hidingTimeLeft?: string;
}

interface UseGameTimerDisplayReturn {
  displayTimer: string;
  timerLabel: string;
  isHidingPhase: boolean;
  isLongTimer: boolean;
}

/**
 * Hook pour gérer l'affichage du timer du jeu
 * Gère le formatage et l'état du timer en fonction du statut du jeu
 */
export const useGameTimerDisplay = ({
  isChickenHidden,
  timeLeft = '00:00',
  hidingTimeLeft = '00:00'
}: UseGameTimerDisplayProps): UseGameTimerDisplayReturn => {
  
  // Déterminer si en phase de cachette
  const isHidingPhase = !isChickenHidden && !!hidingTimeLeft && hidingTimeLeft !== '00:00';
  
  // Format court pour les timers courts, format plus compact pour les longs timers
  const formatTimeDisplay = (time: string): string => {
    // Si le timer est au format "hh:mm:ss"
    if (time.split(':').length === 3) {
      const [hours, minutes, seconds] = time.split(':');
      // Si plus d'une heure, format plus compact
      if (parseInt(hours) > 0) {
        return `${hours}h${minutes}`;
      }
      return `${minutes}:${seconds}`;
    }
    
    // S'il est déjà au format "mm:ss"
    return time;
  };
  
  // Déterminer le timer à afficher et son format
  const { displayTimer, isLongTimer } = useMemo(() => {
    const rawTimer = isHidingPhase ? hidingTimeLeft : timeLeft;
    
    // Vérifier si c'est un long timer (plus d'une heure)
    const parts = rawTimer.split(':');
    const isLong = parts.length === 3 && parseInt(parts[0]) > 0;
    
    return {
      displayTimer: formatTimeDisplay(rawTimer),
      isLongTimer: isLong
    };
  }, [isHidingPhase, hidingTimeLeft, timeLeft]);
  
  // Déterminer le label approprié
  const timerLabel = isHidingPhase ? 'Pour se cacher' : 'Restant';
  
  return {
    displayTimer,
    timerLabel,
    isHidingPhase,
    isLongTimer
  };
};

export default useGameTimerDisplay; 