import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonButtons, IonMenuButton, IonToast
} from '@ionic/react';
import {
  mapOutline, checkmarkCircleOutline, chatbubbleOutline, trophyOutline,
} from 'ionicons/icons';

// Import types
import { Game, Bar, Team, Challenge, Message } from '../data/types';

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
      messages: mockChickenGameState.messages,
      leaderboard: mockChickenGameState.teams,
      score: playerTeam.score,
      currentTime: mockChickenGameState.timeLeft,
      lastClue: mockChickenGameState.messages.filter(m => m.isClue).pop()?.content || null,
    };
  });
  
  // --- State for Timer Display ---
  const [displayTime, setDisplayTime] = useState<string>('--:--:--'); 

  const [newMessage, setNewMessage] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [challengeToComplete, setChallengeToComplete] = useState<string | null>(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState<string | undefined>(undefined);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | 'medium'>('medium');

  // --- Instantiate Hooks ---
  const { photo, takePhoto } = useCamera();
  const { currentPosition, getCurrentLocation, watchLocation, clearWatch } = useGeolocation();

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

  // --- Event Handlers ---
  const handleTabChange = (tab: 'map' | 'challenges' | 'chat' | 'leaderboard') => {
    setActiveTab(tab);
  };
  
  const handleChallengeAttempt = (challengeId: string) => {
    const challenge = gameState.challenges.find(c => c.id === challengeId);
    if (challenge && !gameState.completedChallenges.some(c => c.id === challengeId)) {
      console.log(`Attempting challenge ${challengeId}: ${challenge.title}`);
      setChallengeToComplete(challengeId);
      setShowCameraModal(true);
    }
  };

  const handleBarVisitAttempt = (barId: string) => {
    console.log(`handleBarVisitAttempt called for barId: ${barId}`);
    const bar = gameState.bars.find(b => b.id === barId);
    if (!bar || gameState.visitedBars.some(vb => vb.id === barId)) {
      console.log(`Bar ${barId} not found or already visited. Aborting.`);
      return;
    }
    handleMarkBarVisited(bar.id);
  }

  const handleMarkBarVisited = (barId: string) => {
    const bar = gameState.bars.find(b => b.id === barId);
    if (bar && !gameState.visitedBars.some(vb => vb.id === barId)) {
      setGameState(prev => ({
        ...prev,
        visitedBars: [...prev.visitedBars, bar],
        team: { ...prev.team, barsVisited: prev.team.barsVisited + 1 },
      }));
      console.log(`Bar ${barId} marked as visited`);
      setToastMessage(`${bar.name} visité !`);
      setToastColor('success');
      setShowToast(true);
    }
  };

  const handlePhotoProofSubmit = (capturedPhoto: UseCameraPhoto | null) => {
    if (!capturedPhoto?.webviewPath) {
      console.error("No photo captured to submit.");
      setShowCameraModal(false);
      setChallengeToComplete(null);
      return;
    }

    if (challengeToComplete) {
      console.log("Submitting photo proof for challenge:", challengeToComplete, capturedPhoto.webviewPath);
      const challenge = gameState.challenges.find(c => c.id === challengeToComplete);
      if (challenge && !gameState.completedChallenges.some(cc => cc.id === challengeToComplete)) {
        setGameState(prev => ({
          ...prev,
          completedChallenges: [...prev.completedChallenges, challenge],
          team: { ...prev.team, challengesCompleted: prev.team.challengesCompleted + 1, score: prev.team.score + challenge.points },
          score: prev.score + challenge.points
        }));
        console.log(`Challenge ${challengeToComplete} marked as completed`);
        setToastMessage(`Défi "${challenge.title}" complété ! (+${challenge.points} pts)`);
        setToastColor('success');
        setShowToast(true);
      }
    } else {
      console.log("Submitting generic photo proof:", capturedPhoto.webviewPath);
      setToastMessage('Preuve générique envoyée (simulation)');
      setToastColor('medium');
      setShowToast(true);
    }

    setChallengeToComplete(null);
    setShowCameraModal(false);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        gameId: gameState.game.id,
        userId: gameState.team.members[0].id,
        sender: gameState.team.name,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isClue: false
      };
      setGameState(prev => ({
        ...prev,
        messages: [...prev.messages, newMsg]
      }));
      setNewMessage('');
    }
  };
  
  // --- Geolocation Actions ---
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    await getCurrentLocation();
    setIsGettingLocation(false);
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

  // --- Main Render ---
  return (
    <IonPage id="main-content">
      <SideMenu 
        mode="player" 
        gameName={gameState.game.name} 
        onQuitGame={() => {
          console.log("Quitting game from Player Page...");
          setToastMessage("Partie quittée (simulation)");
          setToastColor('medium');
          setShowToast(true);
        }} 
      />
      {/* Main Header */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" />
          </IonButtons>
          <IonTitle className="ion-text-center">{gameState.team.name}</IonTitle>
          
         
          
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
            isGettingLocation={isGettingLocation}
            isWatchingLocation={isWatchingLocation}
            handleGetCurrentLocation={handleGetCurrentLocation}
            handleToggleWatchLocation={handleToggleWatchLocation}
            handleBarVisitAttempt={handleBarVisitAttempt}
            score={gameState.score}
            gameTime={displayTime}
            challengesCompleted={gameState.completedChallenges.length}
            totalChallenges={gameState.challenges.length}
            cagnotteCurrentAmount={mockChickenGameState.currentCagnotte}
            cagnotteInitialAmount={mockChickenGameState.initialCagnotte}
            isCagnotteLoading={false}
          />
        )}
        {activeTab === 'challenges' && (
          <ChallengesTab 
            challenges={gameState.challenges}
            completedChallenges={gameState.completedChallenges}
            onChallengeAttempt={handleChallengeAttempt}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab 
            messages={gameState.messages}
            currentTeamName={gameState.team.name}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={sendMessage}
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
        }}
        photo={photo}
        takePhoto={takePhoto}
        onPhotoProofSubmit={handlePhotoProofSubmit}
        challengeToComplete={challengeToComplete}
        challenges={gameState.challenges}
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