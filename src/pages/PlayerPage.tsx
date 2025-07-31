import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonButtons, IonMenuButton, IonToast, IonButton, IonSpinner
} from '@ionic/react';
import {
  mapOutline, checkmarkCircleOutline, chatbubbleOutline, trophyOutline, warningOutline,
} from 'ionicons/icons';

// Import types
import { Game, Bar, Team, Challenge, Message, ChallengeCompletion } from '../data/types';

// Import mock data
import { mockChickenGameState } from '../data/mock/mockData';

// Import hooks
import { useCamera, UseCameraPhoto } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePlayerGameData } from '../hooks/usePlayerGameData';
import { useCagnotteManagement } from '../hooks/useCagnotteManagement';

// Import services
import { PhotoUploadResult } from '../services/photoUploadService';

// Import components
import SideMenu from '../components/SideMenu';
import MapTab from '../components/player/MapTab';
import ChallengesTab from '../components/player/ChallengesTab';
import ChatTab from '../components/player/ChatTab';
import LeaderboardTab from '../components/player/LeaderboardTab';
import CameraModal from '../components/player/CameraModal';
import ChallengeDetailModal from '../components/player/ChallengeDetailModal';
import UnlockModal from '../components/player/UnlockModal';

// Import Supabase
import { supabase } from '../lib/supabase';

// Import utilities (for development testing)
import '../utils/updateBarAddresses';

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
  const [activeTab, setActiveTab] = useState<'map' | 'challenges' | 'chat' | 'leaderboard'>('map');

  // PWA navigation hack removed - replaced with defensive rendering patterns

  // Get session info from localStorage - available to the whole component
  // Add a state to trigger re-renders when session changes
  const [sessionVersion, setSessionVersion] = useState(0);
  const [sessionMigrated, setSessionMigrated] = useState(false);
  
  const session = useMemo(() => {
    const sessionData = localStorage.getItem('player-session');
    if (!sessionData) return null;
    return JSON.parse(sessionData); // { playerId, gameId, teamId }
  }, [sessionVersion]); // Re-compute when sessionVersion changes

  // Session validation and migration on component mount
  useEffect(() => {
    const migrateSessionIfNeeded = async () => {
      if (sessionMigrated) return; // Already checked
      
      const { validateAndMigrateSession } = await import('../utils/sessionMigration');
      const validatedSession = await validateAndMigrateSession();
      
      if (validatedSession) {
        // Session was validated/migrated successfully
        setSessionVersion(prev => prev + 1); // Trigger re-render
        setSessionMigrated(true);
      } else {
        // Session is invalid or migration failed
        console.error('🔧 Session validation/migration failed');
        setToastMessage('Session invalide. Veuillez vous reconnecter au jeu.');
        setToastColor('danger');
        setShowToast(true);
      }
    };

    migrateSessionIfNeeded();
  }, [sessionMigrated]);

  // Fetch live data using the new hook
  const { gameState: liveGameState, loading: liveDataLoading, error: liveDataError } = usePlayerGameData(session?.gameId, session?.teamId);

  useEffect(() => {
    if (liveDataError) {
      console.error("Error fetching live game data:", liveDataError);
      // We can add a user-facing toast here later
    }
  }, [liveDataError]);

  // --- Initialize State using Mock Data (will be replaced gradually) ---
  const currentPlayerTeamId = 'c012d6cc-a0c9-4e42-b2f4-e0e226f81a5d'; // Real UUID - Team "Poulet"
  
  // Create a temporary team with real UUID if not found in mock data  
  const foundMockTeam = mockChickenGameState.teams.find(t => t.id === currentPlayerTeamId);
  const initialPlayerTeam = foundMockTeam || {
    ...mockChickenGameState.teams[0],
    id: currentPlayerTeamId // Use real UUID instead of mock ID
  };

  const [gameState, setGameState] = useState<PlayerGameState>(() => {
    const playerTeam = initialPlayerTeam;
    const visitedBars = mockChickenGameState.barOptions.slice(0, playerTeam.barsVisited);
    const completedChallenges = mockChickenGameState.challenges.slice(0, playerTeam.challengesCompleted);

    return {
      game: mockChickenGameState.game,
      team: playerTeam,
      bars: [], // Will be populated from liveGameState
      visitedBars: visitedBars,
      challenges: [], // Will be populated from liveGameState
      completedChallenges: completedChallenges,
      challengeCompletions: mockChickenGameState.challengeCompletions,
      messages: mockChickenGameState.messages,
      leaderboard: mockChickenGameState.teams,
      score: playerTeam.score,
      currentTime: mockChickenGameState.timeLeft,
      lastClue: mockChickenGameState.messages.filter(m => m.isClue).pop()?.content || null,
    };
  });

  // Update gameState when live data arrives
  useEffect(() => {
    if (liveGameState && !liveDataLoading) {
      setGameState(prev => ({
        ...prev,
        bars: liveGameState.bars,
        challenges: liveGameState.challenges,
        team: liveGameState.team || prev.team
      }));
    }
  }, [liveGameState, liveDataLoading]);
  
  // --- State for Timer Display ---
  const [displayTime, setDisplayTime] = useState<string>('--:--:--'); 

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [challengeToComplete, setChallengeToComplete] = useState<string | null>(null);
  const [barToVisit, setBarToVisit] = useState<string | null>(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | 'medium'>('success');
  
  // Use real cagnotte data from Supabase
  const { 
    currentAmount: cagnotteCurrentCents,
    stats: cagnotteStats,
    loading: cagnotteLoading,
    error: cagnotteError,
    centsToEuros
  } = useCagnotteManagement({
    gameId: session?.gameId || '',
    enableRealtime: true
  });
  
  // Convert cents to euros for display
  const cagnotte = {
    current: cagnotteCurrentCents ? centsToEuros(cagnotteCurrentCents) : 0,
    initial: cagnotteStats?.initial_amount ? centsToEuros(cagnotteStats.initial_amount) : 0
  };

  // State for the new Challenge Detail Modal
  const [showChallengeDetailModal, setShowChallengeDetailModal] = useState(false);
  const [selectedChallengeDetail, setSelectedChallengeDetail] = useState<{challenge: Challenge | null, completion: ChallengeCompletion | null}>({ challenge: null, completion: null });

  // State for the new Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [challengeToUnlock, setChallengeToUnlock] = useState<Challenge | null>(null);

  // --- Instantiate Hooks ---
  const { 
    photo, 
    uploadState, 
    takePhoto, 
    uploadPhoto, 
    clearPhoto 
  } = useCamera();
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
  const onViewChallengeDetail = async (challengeId: string) => {
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

    // Check session before proceeding with photo challenges
    if (status === undefined && challenge.type === 'photo') {
      if (!session || !session.gameId || !session.playerId) {
        console.error('🔧 DEBUG: Session invalid for camera modal - missing basic session data');
        console.error('🔧 DEBUG: session:', session);
        setToastMessage('Session invalide. Veuillez vous reconnecter.');
        setToastColor('danger');
        setShowToast(true);
        return;
      }
      
      if (!session.teamId) {
        console.error('🔧 DEBUG: No team assigned - teamId is null');
        console.error('🔧 DEBUG: session:', session);
        
        // Try to find the player's team from the database
        try {
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('team_id')
            .eq('id', session.playerId)
            .single();

          if (playerError) {
            console.error('🔧 DEBUG: Error fetching player team:', playerError);
            setToastMessage('Erreur: impossible de récupérer votre équipe.');
            setToastColor('danger');
            setShowToast(true);
            return;
          }

          if (playerData?.team_id) {
            console.log('🔧 DEBUG: Found player team ID:', playerData.team_id);
            
            // Update session with the correct team ID
            const updatedSession = { ...session, teamId: playerData.team_id };
            localStorage.setItem('player-session', JSON.stringify(updatedSession));
            
            // Trigger re-render with updated session
            setSessionVersion(prev => prev + 1);
            
            // Continue with the camera modal
            console.log(`Opening camera for challenge ${challengeId} with team ${playerData.team_id}`);
            setChallengeToComplete(challengeId);
            setShowCameraModal(true);
            return;
          } else {
            console.error('🔧 DEBUG: Player has no team assigned in database');
            setToastMessage('Erreur: vous n\'êtes assigné à aucune équipe.');
            setToastColor('danger');
            setShowToast(true);
            return;
          }
        } catch (error) {
          console.error('🔧 DEBUG: Exception while fetching player team:', error);
          setToastMessage('Erreur lors de la récupération de votre équipe.');
          setToastColor('danger');
          setShowToast(true);
          return;
        }
      }
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

  const handlePhotoProofSubmit = async (uploadResult: PhotoUploadResult) => {
    console.log('🔧 DEBUG: handlePhotoProofSubmit called');
    console.log('🔧 DEBUG: uploadResult:', uploadResult);
    console.log('🔧 DEBUG: challengeToComplete:', challengeToComplete);
    console.log('🔧 DEBUG: session:', session);
    
    if (!uploadResult.success || !uploadResult.url || !challengeToComplete) {
      console.error('🔧 DEBUG: Invalid upload result or no challenge ID available for submission.');
      setToastMessage('Erreur lors de la soumission du défi');
      setToastColor('danger');
      setShowToast(true);
      setShowCameraModal(false);
      return;
    }
    
    if (!session || !session.playerId || !session.teamId) {
      console.error('🔧 DEBUG: Player session not found. Cannot submit.');
      return;
    }
    
    try {
      // Create a record in `challenge_submissions` table with the uploaded photo
      const submission = {
        challenge_id: challengeToComplete,
        team_id: session.teamId,
        game_id: session.gameId,
        photo_url: uploadResult.url, // Backward compatibility
        photo_urls: [uploadResult.url], // New array format
        photo_metadata: {
          originalSize: uploadResult.metadata?.originalSize,
          compressedSize: uploadResult.metadata?.compressedSize,
          dimensions: uploadResult.metadata?.dimensions,
          format: uploadResult.metadata?.format,
          uploadTime: uploadResult.metadata?.uploadTime,
          filePath: uploadResult.path
        },
        status: 'pending' as const // Host will validate this later
      };

      const { error: submissionError } = await supabase
        .from('challenge_submissions')
        .insert(submission);

      if (submissionError) {
        console.error('Error creating submission record:', submissionError);
        setToastMessage('Erreur lors de la soumission du défi.');
        setToastColor('danger');
        setShowToast(true);
      } else {
        setToastMessage('Défi soumis pour validation !');
        setToastColor('success');
        setShowToast(true);
        
        // Clear the photo after successful submission
        clearPhoto();
      }
    } catch (error) {
      console.error('Error submitting challenge:', error);
      setToastMessage('Erreur lors de la soumission du défi');
      setToastColor('danger');
      setShowToast(true);
    }
    
    setShowCameraModal(false);
    setChallengeToComplete(null);
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

  // Fonction pour gérer la consommation de la cagnotte (read-only for hunters)
  const handleCagnotteConsumption = (amount: number, reason: string) => {
    // Hunters can't consume cagnotte, only view it
    setToastMessage(`Seule l'équipe Poulet peut utiliser la cagnotte`);
    setToastColor('warning');
    setShowToast(true);
    
    console.log(`Tentative de consommation par chasseur ignorée: ${amount}€ pour: ${reason}`);
  };

  // --- New Handler for Unlock Submission ---
  const handleUnlockSubmit = async (challengeId: string, submittedAnswer: string) => {
    if (!session || !session.teamId) {
      console.error('Player session not found. Cannot submit.');
      return;
    }

    const challenge = liveGameState.challenges.find(c => c.id === challengeId);
    if (!challenge) {
      console.error('Challenge not found:', challengeId);
      return;
    }

    const isCorrect = challenge.correctAnswer?.trim().toLowerCase() === submittedAnswer.trim().toLowerCase();
    const status = isCorrect ? 'approved' : 'rejected';

    const submission = {
      challenge_id: challengeId,
      team_id: session.teamId,
      player_id: session.playerId,
      type: 'unlock',
      content: submittedAnswer,
      status: status
    };

    const { error: submissionError } = await supabase
      .from('challenge_submissions')
      .insert(submission);

    if (submissionError) {
      setToastMessage('Erreur lors de la soumission.');
      setToastColor('danger');
    } else if (isCorrect) {
      setToastMessage('Bonne réponse ! Défi validé !');
      setToastColor('success');
    } else {
      setToastMessage('Mauvaise réponse. Essayez encore !');
      setToastColor('warning');
    }
    setShowToast(true);
    setShowUnlockModal(false);
  };

  // --- Defensive Rendering for PWA Stability ---
  // Loading state - prevent white screen during data fetch
  if (liveDataLoading) {
    return (
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle className="ion-text-center">Chargement...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ color: 'var(--ion-color-medium)', fontSize: '1.1rem' }}>
              Chargement de la partie...
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Error boundary - handle data fetch errors gracefully
  if (liveDataError) {
    return (
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle className="ion-text-center">Erreur</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <IonIcon 
              icon={warningOutline} 
              style={{ fontSize: '4rem', color: 'var(--ion-color-danger)' }} 
            />
            <h2 style={{ color: 'var(--ion-color-danger)' }}>
              Erreur de chargement
            </h2>
            <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center', maxWidth: '300px' }}>
              {liveDataError}
            </p>
            <IonButton 
              color="primary" 
              onClick={() => window.location.reload()}
              style={{ marginTop: '10px' }}
            >
              Réessayer
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
            onCagnotteClick={() => {}} // Disabled for hunters
            isCagnotteLoading={cagnotteLoading}
            error={locationError}
            totalPlayers={gameState.leaderboard.reduce((total, team) => total + (team.members?.length || 0), 0)}
            totalTeams={gameState.leaderboard.length}
            teamName={gameState.team?.name}
          />
        )}
        {activeTab === 'challenges' && (
          <ChallengesTab
            challenges={liveDataLoading ? [] : liveGameState.challenges}
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
          clearPhoto();
        }}
        photo={photo}
        uploadState={uploadState}
        takePhoto={takePhoto}
        uploadPhoto={uploadPhoto}
        clearPhoto={clearPhoto}
        onPhotoProofSubmit={handlePhotoProofSubmit}
        challengeToComplete={challengeToComplete}
        challenges={gameState.challenges}
        barToVisit={barToVisit ? gameState.bars.find(b => b.id === barToVisit)?.name : null}
        gameId={session?.gameId}
        teamId={session?.teamId}
        playerId={session?.playerId}
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