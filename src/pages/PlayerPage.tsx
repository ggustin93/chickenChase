import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonButtons, IonMenuButton, IonToast
} from '@ionic/react';
import {
  mapOutline, checkmarkCircleOutline, chatbubbleOutline, trophyOutline,
} from 'ionicons/icons';

// Import types
import { Game, Bar, Team, Challenge, Message, ChallengeCompletion } from '../data/types';

// Import mock data
import { mockChickenGameState } from '../data/mock/mockData';

// Import hooks
import { useCamera, UseCameraPhoto } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';

// Import components
import SideMenu from '../components/SideMenu';
import MapTab from '../components/player/MapTab';
import ChallengesTab from '../components/player/ChallengesTab';
import ChatTab from '../components/player/ChatTab';
import LeaderboardTab from '../components/player/LeaderboardTab';
import CameraModal from '../components/player/CameraModal';
import ChallengeDetailModal from '../components/player/ChallengeDetailModal';
import UnlockModal from '../components/player/UnlockModal';

// --- Utility Function for Time Formatting ---
const formatTime = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return '00:00:00';
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Player-specific Game State Interface
interface PlayerGameState {
  game: Game;
  team: Team;
  bars: Bar[];
  visitedBars: Bar[];
  challenges: Challenge[];
  completedChallenges: Challenge[];
  challengeCompletions: ChallengeCompletion[];
  messages: Message[];
  leaderboard: Team[];
  score: number;
  currentTime: string;
  lastClue: string | null;
}

// --- Constants ---
// Remove unused constants
// const mapCenter: [number, number] = [48.881, 2.340];
// const mapZoom = 15;

const PlayerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'challenges' | 'chat' | 'leaderboard'>('leaderboard');

  // --- Initialize State using Mock Data ---
  const currentPlayerTeamId = 'team-004'; // Équipe Cocorico
  const initialPlayerTeam = mockChickenGameState.teams.find(t => t.id === currentPlayerTeamId) || mockChickenGameState.teams[0];

  const [gameState, setGameState] = useState<PlayerGameState>(() => {
    const playerTeam = initialPlayerTeam;
    const visitedBars = mockChickenGameState.barOptions.slice(0, playerTeam.barsVisited);
    const completedChallenges = mockChickenGameState.challenges.slice(0, playerTeam.challengesCompleted);

    return {
      game: mockChickenGameState.game,
      team: playerTeam,
      bars: mockChickenGameState.barOptions,
      visitedBars: visitedBars,
      challenges: mockChickenGameState.challenges.filter(c => c.active),
      completedChallenges: completedChallenges,
      challengeCompletions: mockChickenGameState.challengeCompletions,
      messages: mockChickenGameState.messages,
      leaderboard: mockChickenGameState.teams,
      score: playerTeam.score,
      currentTime: mockChickenGameState.timeLeft,
      lastClue: mockChickenGameState.messages.filter(m => m.isClue).pop()?.content || null,
    };
  });
  
  // --- State for Timer Display ---
  const [displayTime, setDisplayTime] = useState<string>('--:--:--'); 

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [challengeToComplete, setChallengeToComplete] = useState<string | null>(null);
  const [barToVisit, setBarToVisit] = useState<string | null>(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | 'medium'>('success');
  
  // Ajout d'un état pour gérer la cagnotte
  const [cagnotte, setCagnotte] = useState({
    current: mockChickenGameState.currentCagnotte,
    initial: mockChickenGameState.initialCagnotte
  });

  // State for the new Challenge Detail Modal
  const [showChallengeDetailModal, setShowChallengeDetailModal] = useState(false);
  const [selectedChallengeDetail, setSelectedChallengeDetail] = useState<{challenge: Challenge | null, completion: ChallengeCompletion | null}>({ challenge: null, completion: null });

  // State for the new Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [challengeToUnlock, setChallengeToUnlock] = useState<Challenge | null>(null);

  // --- Instantiate Hooks ---
  const { photo, takePhoto } = useCamera();
  const { 
    currentPosition, 
    getCurrentLocation, 
    watchLocation, 
    clearWatch, 
    error: locationError, 
    isGeolocationAvailable,
    isGettingPosition
  } = useGeolocation();

  // --- Timer Effect ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // Check if game endTime is valid
    const endTimeString = gameState.game?.endTime;
    if (!endTimeString) {
      console.warn('Game end time is missing or invalid. Timer not started.');
      setDisplayTime('N/A'); // Or some other indicator
      return;
    }

    const endTimeMs = new Date(endTimeString).getTime();

    if (isNaN(endTimeMs)) {
      console.error('Invalid game end time format. Timer not started.');
      setDisplayTime('ERR'); // Or some other indicator
      return;
    }

    const updateTimer = () => {
      const nowMs = Date.now();
      const remainingMs = endTimeMs - nowMs;

      if (remainingMs <= 0) {
        setDisplayTime('00:00:00');
        if (intervalId) clearInterval(intervalId);
        // Potentially trigger game over logic here
        console.log("Game time finished!");
      } else {
        setDisplayTime(formatTime(remainingMs));
      }
    };

    // Initial update
    updateTimer();

    // Set interval
    intervalId = setInterval(updateTimer, 1000);

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameState.game?.endTime]); // Re-run if game end time changes

  // --- Geolocation Error Effect ---
  useEffect(() => {
    // Show toast message for geolocation errors
    if (locationError) {
      setToastMessage(locationError.message);
      setToastColor('warning');
      setShowToast(true);
      console.log('Geolocation error:', locationError);
    }
  }, [locationError]);

  // --- Geolocation Availability Effect ---
  useEffect(() => {
    if (!isGeolocationAvailable) {
      setToastMessage('La géolocalisation n\'est pas disponible sur votre appareil.');
      setToastColor('warning');
      setShowToast(true);
    }
  }, [isGeolocationAvailable]);

  // Calculate challenge statuses for the current team
  const challengeStatuses = useMemo(() => {
    const statuses: Record<string, ChallengeCompletion['status'] | undefined> = {};
    gameState.challengeCompletions
      .filter(comp => comp.teamId === gameState.team.id) // Filter completions for the current player's team
      .forEach(comp => {
        statuses[comp.challengeId] = comp.status;
      });
    // Ensure all active challenges have at least an 'undefined' status if not found in completions
    gameState.challenges.forEach(challenge => {
      if (!(challenge.id in statuses)) {
        statuses[challenge.id] = undefined;
      }
    });
    return statuses;
  }, [gameState.challengeCompletions, gameState.challenges, gameState.team.id]);

  // --- Event Handlers ---
  const handleTabChange = (tab: 'map' | 'challenges' | 'chat' | 'leaderboard') => {
    setActiveTab(tab);
  };
  
  // Fonction pour déterminer le titre en fonction de l'onglet actif
  const getTabTitle = () => {
    switch (activeTab) {
      case 'map':
        return 'Carte';
      case 'challenges':
        return 'Défis';
      case 'chat':
        return 'Newsfeed'; // Garder le nom de l'équipe pour le chat
      case 'leaderboard':
        return 'Classement';
      default:
        return gameState.team.name;
    }
  };

  // Renamed from handleChallengeAttempt - MODIFIED LOGIC
  const onViewChallengeDetail = (challengeId: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    const status = challengeStatuses[challengeId]; // Get status from derived state

    console.log(`Viewing detail for challenge ${challengeId}: ${challenge?.title}, Status: ${status || 'Not Started'}, Type: ${challenge?.type}`);
    
    // Handle challenge not found
    if (!challenge) {
      console.error(`Challenge with ID ${challengeId} not found.`);
      setToastMessage('Défi non trouvé.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Decide which action/modal to open based on status and type
    if (status === undefined) { // Challenge not started/attempted
      if (challenge.type === 'unlock') {
        console.log(`Opening unlock modal for initial attempt of challenge ${challengeId}`);
        setChallengeToUnlock(challenge);
        setShowUnlockModal(true);
      } else { // Default to photo type
        console.log(`Opening camera for initial attempt of photo challenge ${challengeId}`);
        setChallengeToComplete(challengeId); // Keep this for CameraModal association
        setShowCameraModal(true);
      }
    } 
    else { // Challenge already attempted (pending, approved, rejected)
      const completion = gameState.challengeCompletions.find(
        comp => comp.challengeId === challengeId && comp.teamId === gameState.team.id
      ) || null;
      
      console.log(`Opening detail modal for challenge ${challengeId}, Completion found:`, !!completion);
      setSelectedChallengeDetail({ challenge, completion });
      setShowChallengeDetailModal(true);
    }
  };

  const handleBarVisitAttempt = (barId: string) => {
    console.log(`handleBarVisitAttempt called for barId: ${barId}`);
    const bar = gameState.bars.find(b => b.id === barId);
    if (!bar || gameState.visitedBars.some(vb => vb.id === barId)) {
      console.log(`Bar ${barId} not found or already visited. Aborting.`);
      return;
    }
    // Ouvrir le modal de caméra pour prendre une photo de justification
    setBarToVisit(barId);
    setChallengeToComplete(null); // S'assurer qu'aucun défi n'est sélectionné
    setShowCameraModal(true);
  }

  const handlePhotoProofSubmit = (capturedPhoto: UseCameraPhoto | null) => {
    const photoPath = capturedPhoto?.webviewPath; // Keep the actual path if available
    
    if (!photoPath) { // Check if we have a path (real or placeholder)
      console.error("No photo captured or placeholder generated.");
      setShowCameraModal(false);
      setChallengeToComplete(null);
      setBarToVisit(null);
      return;
    }

    // Gestion des défis - MODIFIED LOGIC
    if (challengeToComplete) {
      console.log("Submitting photo proof for challenge validation:", challengeToComplete, photoPath);
      const challenge = gameState.challenges.find(c => c.id === challengeToComplete);
      const existingCompletionIndex = gameState.challengeCompletions.findIndex(
        comp => comp.challengeId === challengeToComplete && comp.teamId === gameState.team.id
      );

      // Only submit if it doesn't exist or was rejected previously
      if (challenge && (existingCompletionIndex === -1 || gameState.challengeCompletions[existingCompletionIndex].status === 'rejected')) {
        const newCompletion: ChallengeCompletion = {
          id: `comp-${challengeToComplete}-${gameState.team.id}-${Date.now()}`,
          challengeId: challengeToComplete,
          teamId: gameState.team.id,
          timestamp: new Date().toISOString(),
          status: 'pending', // Set status to pending
          // Use real photo path if available, otherwise placeholder
          photoUrl: photoPath || `https://picsum.photos/seed/${challengeToComplete}/400/300`,
        };

        setGameState(prev => {
          const updatedCompletions = [...prev.challengeCompletions];
          if (existingCompletionIndex !== -1) {
            // Replace the rejected completion
            updatedCompletions[existingCompletionIndex] = newCompletion;
          } else {
            // Add the new pending completion
            updatedCompletions.push(newCompletion);
          }
          return {
            ...prev,
            challengeCompletions: updatedCompletions,
            // Remove direct score update and completedChallenges update
            // score: prev.score + challenge.points // Score updated on approval
            // completedChallenges: [...prev.completedChallenges, challenge], // Handled by status now
          };
        });
        
        console.log(`Challenge ${challengeToComplete} submitted for validation`);
        setToastMessage(`Défi "${challenge.title}" soumis pour validation !`);
        setToastColor('success'); // Use success color for submission confirmation
        setShowToast(true);
        
      } else if (challenge) {
          console.log(`Challenge ${challengeToComplete} already submitted or pending/approved.`);
          setToastMessage(`Défi "${challenge.title}" déjà soumis.`);
          setToastColor('warning');
          setShowToast(true);
      } else {
          console.error("Challenge not found for submission:", challengeToComplete);
      }
    } 
    // Gestion des visites de bar - REMAINS THE SAME
    else if (barToVisit) {
      console.log("Submitting photo proof for bar visit:", barToVisit, photoPath);
      const bar = gameState.bars.find(b => b.id === barToVisit);
      if (bar && !gameState.visitedBars.some(vb => vb.id === barToVisit)) {
        // Stocker la photo et la position avec le bar visité
        const visitedBar = {
          ...bar,
          photoProof: photoPath, // Use the photo path
          locationProof: currentPosition ? {
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
            accuracy: currentPosition.coords.accuracy
          } : null,
          visitTimestamp: new Date().toISOString()
        };
        
        setGameState(prev => ({
          ...prev,
          visitedBars: [...prev.visitedBars, visitedBar],
          team: { ...prev.team, barsVisited: prev.team.barsVisited + 1 },
        }));
        console.log(`Bar ${barToVisit} marked as visited with photo proof`);
        setToastMessage(`${bar.name} visité !`);
        setToastColor('success');
        setShowToast(true);
      }
    }
    // Preuve générique - REMAINS THE SAME
    else {
      console.log("Submitting generic photo proof:", photoPath);
      setToastMessage('Preuve générique envoyée (simulation)');
      setToastColor('medium');
      setShowToast(true);
    }

    setChallengeToComplete(null);
    setBarToVisit(null);
    setShowCameraModal(false);
  };

  // --- Geolocation Actions ---
  const handleGetCurrentLocation = async () => {
    // No need to manage isGettingLocation state here anymore,
    // it's handled inside the hook
    await getCurrentLocation();
  }

  const handleToggleWatchLocation = async () => {
    if (isWatchingLocation) {
      await clearWatch(isWatchingLocation);
      setIsWatchingLocation(undefined);
    } else {
      const watchId = await watchLocation();
      setIsWatchingLocation(watchId);
    }
  }

  // Fonction pour gérer la consommation de la cagnotte
  const handleCagnotteConsumption = (amount: number, reason: string) => {
    // Mettre à jour la valeur de la cagnotte
    setCagnotte(prev => ({
      ...prev,
      current: Math.max(0, prev.current - amount)
    }));
    
    // Afficher un toast de confirmation
    setToastMessage(`${amount}€ utilisés de la cagnotte ! (${reason})`);
    setToastColor('success');
    setShowToast(true);
    
    console.log(`Cagnotte réduite de ${amount}€ pour: ${reason}. Nouveau montant: ${cagnotte.current - amount}€`);
  };

  // --- New Handler for Unlock Submission ---
  const handleUnlockSubmit = (challengeId: string, submittedAnswer: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    
    console.log(`Attempting to unlock challenge ${challengeId} with answer: "${submittedAnswer}"`);

    // Close the modal first
    setShowUnlockModal(false);
    setChallengeToUnlock(null);

    if (!challenge || challenge.type !== 'unlock' || !challenge.correctAnswer) {
      console.error("Invalid challenge or missing correct answer for unlock attempt:", challengeId);
      setToastMessage('Erreur lors de la validation du défi.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Basic comparison (case-insensitive, trim spaces)
    const isCorrect = submittedAnswer.trim().toLowerCase() === challenge.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      console.log("Correct answer submitted!");
      const newCompletion: ChallengeCompletion = {
        id: `comp-${challengeId}-${gameState.team.id}-${Date.now()}`,
        challengeId: challengeId,
        teamId: gameState.team.id,
        timestamp: new Date().toISOString(),
        status: 'approved', // Automatically approved
        textAnswer: submittedAnswer // Store the submitted answer
      };

      setGameState(prev => {
        // Avoid duplicate completions if somehow submitted twice
        const existingIndex = prev.challengeCompletions.findIndex(c => c.challengeId === challengeId && c.teamId === prev.team.id);
        const updatedCompletions = existingIndex === -1
           ? [...prev.challengeCompletions, newCompletion]
           : prev.challengeCompletions.map((comp, index) => index === existingIndex ? newCompletion : comp);

        return {
          ...prev,
          challengeCompletions: updatedCompletions,
          team: { 
            ...prev.team, 
            // Only increment if it wasn't already completed
            challengesCompleted: existingIndex === -1 ? prev.team.challengesCompleted + 1 : prev.team.challengesCompleted, 
            score: prev.team.score + challenge.points 
          },
          // Update top-level score as well
          score: prev.score + challenge.points 
        };
      });

      setToastMessage(`Défi "${challenge.title}" réussi ! (+${challenge.points} pts)`);
      setToastColor('success');
      setShowToast(true);
    } else {
      console.log("Incorrect answer submitted.");
      setToastMessage(`Réponse incorrecte pour le défi "${challenge.title}". Essayez encore !`);
      setToastColor('warning');
      setShowToast(true);
      // Re-open the modal for another try? Or just let them click again? For now, just show toast.
      // Consider adding a attempts counter later.
    }
  };

  // --- Main Render ---
  return (
    <IonPage id="main-content">
      <SideMenu 
        mode="player" 
      />
      {/* Main Header */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" />
          </IonButtons>
          <IonTitle className="ion-text-center page-title">{getTabTitle()}</IonTitle>
          
         
          
        </IonToolbar>
      </IonHeader>

      {/* Content Area */}
      <IonContent fullscreen className={`ion-content-player ${activeTab === 'chat' ? 'chat-active' : ''}`}>
        {/* Conditional Rendering based on activeTab */}
        {activeTab === 'map' && (
          <MapTab 
            bars={gameState.bars}
            visitedBars={gameState.visitedBars}
            currentPosition={currentPosition}
            isGettingLocation={isGettingPosition}
            isWatchingLocation={isWatchingLocation}
            handleGetCurrentLocation={handleGetCurrentLocation}
            handleToggleWatchLocation={handleToggleWatchLocation}
            handleBarVisitAttempt={handleBarVisitAttempt}
            score={gameState.score}
            gameTime={displayTime}
            challengesCompleted={gameState.completedChallenges.length}
            totalChallenges={gameState.challenges.length}
            cagnotteCurrentAmount={cagnotte.current}
            cagnotteInitialAmount={cagnotte.initial}
            onCagnotteConsumption={handleCagnotteConsumption}
            isCagnotteLoading={false}
            error={locationError}
          />
        )}
        {activeTab === 'challenges' && (
          <ChallengesTab
            challenges={gameState.challenges}
            challengeStatuses={challengeStatuses}
            onViewChallengeDetail={onViewChallengeDetail}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab 
            messages={gameState.messages}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab 
            leaderboard={gameState.leaderboard}
            currentPlayerTeamId={gameState.team.id}
          />
        )}
      </IonContent>
      
      {/* Bottom Navigation */}
      <IonTabBar slot="bottom">
        <IonTabButton tab="map" selected={activeTab === 'map'} onClick={() => handleTabChange('map')}>
          <IonIcon icon={mapOutline} />
          <IonLabel>Carte</IonLabel>
        </IonTabButton>
        <IonTabButton tab="challenges" selected={activeTab === 'challenges'} onClick={() => handleTabChange('challenges')}>
          <IonIcon icon={checkmarkCircleOutline} />
          <IonLabel>Défis</IonLabel>
        </IonTabButton>
        <IonTabButton tab="chat" selected={activeTab === 'chat'} onClick={() => handleTabChange('chat')}>
          <IonIcon icon={chatbubbleOutline} />
          <IonLabel>Chat</IonLabel>
        </IonTabButton>
        <IonTabButton tab="leaderboard" selected={activeTab === 'leaderboard'} onClick={() => handleTabChange('leaderboard')}>
          <IonIcon icon={trophyOutline} />
          <IonLabel>Score</IonLabel>
        </IonTabButton>
      </IonTabBar>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onDidDismiss={() => {
          setShowCameraModal(false);
          setChallengeToComplete(null);
          setBarToVisit(null);
        }}
        photo={photo}
        takePhoto={takePhoto}
        onPhotoProofSubmit={handlePhotoProofSubmit}
        challengeToComplete={challengeToComplete}
        challenges={gameState.challenges}
        barToVisit={barToVisit ? gameState.bars.find(b => b.id === barToVisit)?.name : null}
      />

      {/* NEW: Challenge Detail Modal */}
      <ChallengeDetailModal
        isOpen={showChallengeDetailModal}
        onDidDismiss={() => {
          setShowChallengeDetailModal(false);
          setSelectedChallengeDetail({ challenge: null, completion: null }); // Clear selection on close
        }}
        challenge={selectedChallengeDetail.challenge}
        completion={selectedChallengeDetail.completion}
      />

      {/* NEW: Unlock Modal */}
      <UnlockModal 
        isOpen={showUnlockModal}
        onDidDismiss={() => {
          setShowUnlockModal(false);
          setChallengeToUnlock(null);
        }}
        challenge={challengeToUnlock}
        onSubmit={handleUnlockSubmit}
      />

      {/* Toast Notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        color={toastColor}
        duration={3000}
        position="bottom"
      />
    </IonPage>
  );
};

export default PlayerPage;