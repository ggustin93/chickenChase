import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonList, IonItem, IonInput, IonButton, IonCard, IonCardHeader,
  IonCardContent, IonCardTitle, IonCardSubtitle, IonChip, IonAvatar, IonFooter,
  IonFab, IonFabButton, IonText, IonButtons, IonSegment, IonSegmentButton, IonBadge, IonModal,
  IonLoading, IonNote, IonThumbnail,
  IonToast, IonMenuButton
} from '@ionic/react';
import {
  mapOutline, checkmarkCircleOutline, chatbubbleOutline, trophyOutline, searchOutline,
  sendOutline, cameraOutline, checkmarkCircle, ellipseOutline, timeOutline, peopleOutline,
  arrowForwardOutline, closeOutline, locateOutline, warningOutline, refreshOutline
} from 'ionicons/icons';

// Import mock data and types
import { Game, Bar, Team, Challenge, Message } from '../data/types'; // Assuming types are here
import { mockChickenGameState } from '../data/mock/mockData';

// Import GameMap component
import GameMap from '../components/GameMap';

// Import hooks
import { useCamera, UseCameraPhoto } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';

// Import new component
import LeaderboardList from '../components/LeaderboardList';
import ChatMessageList from '../components/ChatMessageList';
import SideMenu from '../components/SideMenu';

// Player-specific Game State Interface (derived from ChickenGameState or defined separately)
interface PlayerGameState {
  game: Game;
  team: Team; // Current player's team
  bars: Bar[]; // All available bars
  visitedBars: Bar[]; // Bars visited by this team
  challenges: Challenge[]; // All available challenges
  completedChallenges: Challenge[]; // Challenges completed by this team
  messages: Message[]; // All game messages
  leaderboard: Team[]; // All teams for ranking
  score: number;
  currentTime: string; // Example game time
  lastClue: string | null;
}

// --- Constants ---
const mapCenter: [number, number] = [48.881, 2.340];
const mapZoom = 15;
const LOCATION_MAX_AGE_MS = 60000; // 60 seconds
const VISIT_RADIUS_METERS = 100; // 100 meters allowed radius

// --- Helper Functions ---
/**
 * Calculates the distance between two points using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const PlayerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'challenges' | 'chat' | 'leaderboard'>('leaderboard');

  // --- Initialize State using Mock Data ---
  const currentPlayerTeamId = 'team-004'; // Équipe Cocorico
  const initialPlayerTeam = mockChickenGameState.teams.find(t => t.id === currentPlayerTeamId) || mockChickenGameState.teams[0]; // Fallback

  const [gameState, setGameState] = useState<PlayerGameState>(() => {
    // Derive player-specific state from mock data
    const playerTeam = initialPlayerTeam;
    // --- Corrected/Simplified Logic for Visited Bars/Completed Challenges ---
    // This uses the counts provided in the mock Team data directly
    // It assumes the first N bars/challenges are visited/completed for simplicity
    // A real implementation would rely on actual visit/completion records
    const visitedBars = mockChickenGameState.barOptions.slice(0, playerTeam.barsVisited);
    const completedChallenges = mockChickenGameState.challenges.slice(0, playerTeam.challengesCompleted);

    return {
      game: mockChickenGameState.game,
      team: playerTeam,
      bars: mockChickenGameState.barOptions,
      visitedBars: visitedBars,
      challenges: mockChickenGameState.challenges.filter(c => c.active), // Show only active challenges
      completedChallenges: completedChallenges,
      messages: mockChickenGameState.messages, // Show all messages for now
      leaderboard: mockChickenGameState.teams,
      score: playerTeam.score,
      currentTime: mockChickenGameState.timeLeft, // Use timeLeft from mock
      lastClue: mockChickenGameState.messages.filter(m => m.isClue).pop()?.content || null,
    };
  });
  // --- End State Initialization ---
  
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
  const { currentPosition, error: geoError, permissionStatus, getCurrentLocation, watchLocation, clearWatch } = useGeolocation();

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
            return; // Bar not found or already visited
        }

        console.log(`Attempting visit check for bar ${barId}`);

        // MODE TEST: Marquer directement le bar comme visité sans vérifier la position
        handleMarkBarVisited(bar.id);
        return;

        // Le code ci-dessous est commenté pour permettre de marquer les bars sans vérification de position
        /*
        if (!currentPosition || (Date.now() - currentPosition.timestamp) > LOCATION_MAX_AGE_MS) {
            console.log("Location missing or too old, showing warning toast.");
            setToastMessage('Votre position n\'est pas à jour. Veuillez l\'actualiser.');
            setToastColor('warning');
            setShowToast(true);
            return;
        }

        // Calculate distance
        const distance = getDistance(
            currentPosition.coords.latitude,
            currentPosition.coords.longitude,
            bar.latitude,
            bar.longitude
        );

        console.log(`Distance to ${bar.name}: ${distance.toFixed(0)} meters`);

        if (distance <= VISIT_RADIUS_METERS) {
            // Within radius - Mark as visited
            handleMarkBarVisited(bar.id);
        } else {
            // Too far
            setToastMessage(`Vous êtes trop loin (${distance.toFixed(0)}m). Rapprochez-vous à moins de ${VISIT_RADIUS_METERS}m.`);
            setToastColor('danger');
            setShowToast(true);
        }
        */
   }

   // --- Add success toast to handleMarkBarVisited ---
   const handleMarkBarVisited = (barId: string) => {
     const bar = gameState.bars.find(b => b.id === barId);
     if (bar && !gameState.visitedBars.some(vb => vb.id === barId)) {
          setGameState(prev => ({
              ...prev,
              visitedBars: [...prev.visitedBars, bar],
              team: { ...prev.team, barsVisited: prev.team.barsVisited + 1 },
              // TODO: Add potential score update for visiting a bar
          }));
          console.log(`Bar ${barId} marked as visited`);
          setToastMessage(`${bar.name} visité !`);
          setToastColor('success');
          setShowToast(true);
          // TODO: Add API call to record visit
     }
   };

   // Called after successful photo capture FOR CHALLENGES
   const handlePhotoProofSubmit = (capturedPhoto: UseCameraPhoto | null) => {
       if (!capturedPhoto?.webviewPath) {
           console.error("No photo captured to submit.");
           setShowCameraModal(false);
           setChallengeToComplete(null);
           return;
       }

        if (challengeToComplete) {
           console.log("Submitting photo proof for challenge:", challengeToComplete, capturedPhoto.webviewPath);
           // TODO: Implement actual photo upload logic here

           // Simulate success
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
             // Handle generic proof submission if needed
             setToastMessage('Preuve générique envoyée (simulation)');
             setToastColor('medium');
             setShowToast(true);
        }

       // Reset tracking states and close modal
       setChallengeToComplete(null);
       setShowCameraModal(false);
   };


  const handleFoundChicken = () => {
    console.log("Chicken found!");
     setGameState(prev => ({
      ...prev,
      team: { ...prev.team, foundChicken: true }
     }));
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
      // TODO: Add API call to send message
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

  // --- Tab Content Components ---

  const MapTabContent: React.FC = () => (
    <>
      {/* Map Container */}
      <div style={{ height: '40vh', width: '100%', background: '#eee', position: 'relative' }}>
          <GameMap
              bars={gameState.bars}
              center={currentPosition ? [currentPosition.coords.latitude, currentPosition.coords.longitude] : mapCenter}
              zoom={currentPosition ? 16 : mapZoom}
              // TODO: Pass player location to GameMap to show a marker
          />
          
          {/* Position indicator - Bottom left with icon */}
          <div className="absolute bottom-0 left-0 flex items-center" style={{zIndex: 1000}}>
              <div className="flex items-center bg-white m-2 py-1 px-2 rounded-md shadow-sm text-sm" style={{borderLeft: '3px solid var(--ion-color-primary)'}}>
                  <IonIcon icon={locateOutline} style={{color: currentPosition ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', marginRight: '6px'}} />
                  <span>
                      {currentPosition ? `${currentPosition.coords.latitude.toFixed(4)}, ${currentPosition.coords.longitude.toFixed(4)}` : 'Position inconnue'}
                  </span>
              </div>
          </div>
          
          {/* Geolocation FAB buttons - Bottom RIGHT of map */}
          <div className="absolute bottom-0 right-0 flex flex-row gap-3 m-2" style={{zIndex: 1000}}>
              {/* Actualiser Button */}
              <div className="flex flex-col items-center">
                  <IonFabButton 
                      size="small"
                      disabled={isGettingLocation}
                      onClick={handleGetCurrentLocation}
                      style={{
                          '--background': 'white',
                          '--color': 'var(--ion-color-primary)',
                          '--border-color': 'var(--ion-color-primary)',
                          '--border-style': 'solid',
                          '--border-width': '2px',
                          'boxShadow': '0 2px 6px rgba(0,0,0,0.1)',
                          'height': '50px',
                          'width': '50px'
                      }}
                  >
                      {isGettingLocation ? (
                          <div className="spinner-border animate-spin w-5 h-5 border-2 rounded-full border-t-transparent"></div>
                      ) : (
                          <IonIcon icon={refreshOutline} style={{fontSize: '24px'}} />
                      )}
                  </IonFabButton>
                  <div className="text-xs bg-white mt-1 px-2 py-1 rounded-full font-medium shadow-sm">
                      ACTUALISER
                  </div>
              </div>
              
              {/* Suivre Button */}
              <div className="flex flex-col items-center">
                  <IonFabButton 
                      size="small"
                      onClick={handleToggleWatchLocation}
                      style={{
                          '--background': 'white',
                          '--color': isWatchingLocation ? 'var(--ion-color-danger)' : 'var(--ion-color-primary)',
                          '--border-color': isWatchingLocation ? 'var(--ion-color-danger)' : 'var(--ion-color-primary)',
                          '--border-style': 'solid',
                          '--border-width': '2px',
                          'boxShadow': '0 2px 6px rgba(0,0,0,0.1)',
                          'height': '50px',
                          'width': '50px'
                      }}
                  >
                      <IonIcon icon={locateOutline} style={{fontSize: '24px'}} />
                  </IonFabButton>
                  <div className="text-xs bg-white mt-1 px-2 py-1 rounded-full font-medium shadow-sm">
                      {isWatchingLocation ? 'ARRÊTER' : 'SUIVRE'}
                  </div>
              </div>
          </div>
      </div>

      {/* Bars List Header */}
      <IonHeader translucent={true}>
          <IonToolbar>
              <IonTitle size="small">Bars Visitables</IonTitle>
              <IonBadge slot="end" color="medium" className="mr-2">
                 {gameState.visitedBars.length} / {gameState.bars.length} visités
              </IonBadge>
          </IonToolbar>
      </IonHeader>

      {/* Bars List */}
      <IonList lines="full" className="bar-list-player">
        {gameState.bars.map(bar => {
           const isVisited = gameState.visitedBars.some(vb => vb.id === bar.id);
           return (
              <IonItem key={bar.id} button={!isVisited} onClick={() => !isVisited && handleBarVisitAttempt(bar.id)} detail={!isVisited} color={isVisited ? 'light' : undefined}>
                 <IonThumbnail slot="start" className="bar-thumbnail-player">
                     <img alt={bar.name} src={bar.photoUrl || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'} onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/thumbnail.svg')} />
                 </IonThumbnail>
                 <IonIcon
                    icon={isVisited ? checkmarkCircle : ellipseOutline}
                    color={isVisited ? 'success' : 'medium'}
                    slot="start"
                    className="visit-status-icon"
                 />
                <IonLabel className={isVisited ? 'ion-text-wrap text-medium' : 'ion-text-wrap'}>
                  <h2>{bar.name}</h2>
                  {isVisited ? (
                      <IonNote color="success">Déjà visité</IonNote>
                  ) : (
                     <IonNote color="medium">{bar.address}</IonNote>
                  )}
                </IonLabel>
              </IonItem>
           );
        })}
      </IonList>
    </>
  );

  const ChallengesTabContent: React.FC = () => (
    <>
      <IonHeader translucent={true}>
        <IonToolbar>
            <IonTitle size="small">Défis Actifs ({gameState.challenges.length})</IonTitle>
            <IonBadge slot="end" color="secondary" className="mr-2">
                {gameState.completedChallenges.length} complétés
            </IonBadge>
        </IonToolbar>
      </IonHeader>
      <IonList lines="inset">
        {gameState.challenges.map(challenge => {
            const isCompleted = gameState.completedChallenges.some(cc => cc.id === challenge.id);
            return (
              <IonItem key={challenge.id} detail={false} button={!isCompleted} onClick={() => !isCompleted && handleChallengeAttempt(challenge.id)}>
                 <IonIcon
                    icon={isCompleted ? checkmarkCircle : ellipseOutline}
                    color={isCompleted ? 'success' : 'medium'}
                    slot="start"
                    className="text-xl mt-1 self-start"
                 />
                <IonLabel className="whitespace-normal py-2">
                  <h2 className={isCompleted ? 'line-through text-medium' : ''}>{challenge.title}</h2>
                  {challenge.description && <p className="text-xs text-medium mt-1">{challenge.description}</p>}
                  <IonChip outline color="secondary" className="mt-1">
                     <IonIcon icon={trophyOutline} />
                     <IonLabel>{challenge.points} pts</IonLabel>
                  </IonChip>
                </IonLabel>
                {!isCompleted && (
                     <IonButton fill="clear" size="small" slot="end" aria-label="Compléter le défi">
                         <IonIcon icon={cameraOutline} className="text-xl" />
                     </IonButton>
                 )}
              </IonItem>
            );
        })}
      </IonList>
    </>
  );

  const ChatTabContent: React.FC = () => (
    <>
      {/* Use the new ChatMessageList component */}
      <ChatMessageList messages={gameState.messages} currentTeamName={gameState.team.name} />

      {/* Input Footer */}
      <IonFooter>
        <IonToolbar className="chat-input-toolbar">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center p-2 gap-2">
            <IonInput
              placeholder="Votre message..."
                value={newMessage}
              onIonChange={(e) => setNewMessage(e.detail.value || '')}
              className="flex-1 bg-light rounded-full px-3"
              clearInput
            />
            <IonButton
              type="submit"
              fill="clear"
              disabled={!newMessage.trim()}
              className="send-button"
              shape="round"
            >
              <IonIcon slot="icon-only" icon={sendOutline} color="primary" />
            </IonButton>
          </form>
        </IonToolbar>
      </IonFooter>
    </>
  );

  const LeaderboardTabContent: React.FC = () => (
     <>
         <IonHeader translucent={true}>
             <IonToolbar>
                 <IonTitle size="small">Classement</IonTitle>
                 <IonNote slot="end" color="medium" className="ion-padding-end text-xs">Temps réel</IonNote>
             </IonToolbar>
         </IonHeader>
         <LeaderboardList
             teams={gameState.leaderboard}
             currentPlayerTeamId={gameState.team.id}
         />
     </>
  );


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
          <IonTitle>{gameState.team.name}</IonTitle>
          <IonChip slot="end" className="mr-2" color="light" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            color: '#333',
            fontWeight: 'bold',
            padding: '2px 8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <IonIcon icon={trophyOutline} style={{color: 'var(--ion-color-primary)'}} />
            <IonLabel>{gameState.score} pts</IonLabel>
          </IonChip>
          <IonChip slot="end" color="light" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            color: '#333',
            fontWeight: 'bold',
            padding: '2px 8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <IonIcon icon={timeOutline} style={{color: 'var(--ion-color-primary)'}} />
            <IonLabel>{gameState.currentTime}</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>

      {/* Content Area */}
      <IonContent fullscreen className={`ion-content-player ${activeTab === 'chat' ? 'chat-active' : ''}`}>
          {/* Conditional Rendering based on activeTab */}
          {activeTab === 'map' && <MapTabContent />}
          {activeTab === 'challenges' && <ChallengesTabContent />}
          {activeTab === 'chat' && <ChatTabContent />}
          {activeTab === 'leaderboard' && <LeaderboardTabContent />}
      </IonContent>

       {/* Clue Banner Removed */}
       {/* {gameState.lastClue && activeTab !== 'chat' && (
          <IonFooter className="ion-no-border clue-footer">
              <IonToolbar color="warning" className="ion-text-center py-1">
                  <IonLabel className="text-xs flex items-center justify-center">
                      <IonIcon icon={chatbubbleOutline} className="mr-1" />
                      <strong>Indice:</strong> {gameState.lastClue}
                  </IonLabel>
              </IonToolbar>
          </IonFooter>
       )} */}
      
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

        {/* Camera Modal - Now primarily for Challenges */}
         <IonModal isOpen={showCameraModal} onDidDismiss={() => setShowCameraModal(false)}>
             <IonHeader>
                <IonToolbar>
                    {/* Title updated to reflect context */}
                    <IonTitle>{challengeToComplete ? "Preuve Défi" : "Preuve Photo"}</IonTitle>
                    <IonButtons slot="end">
                        {/* Reset challengeToComplete on cancel */}
                        <IonButton onClick={() => { setShowCameraModal(false); setChallengeToComplete(null); }}>Annuler</IonButton>
                    </IonButtons>
                </IonToolbar>
             </IonHeader>
             <IonContent className="ion-padding">
                <p className="mb-3">
                    {/* Removed barToVisit condition */}
                    {challengeToComplete && `Preuve requise pour le défi: ${gameState.challenges.find(c => c.id === challengeToComplete)?.title}`}
                    {!challengeToComplete && "Preuve générique (si nécessaire)"}
                </p>
                 {/* Display photo preview if available */}
                 {photo?.webviewPath && (
                   <div className="my-4 text-center">
                     <img src={photo.webviewPath} alt="Aperçu" style={{ maxWidth: '100%', maxHeight: '300px', display: 'inline-block' }} />
                   </div>
                 )}
                 {!photo && (
                     <div className="text-center my-4">
                        <p>(Intégration du plugin Capacitor Camera ici)</p>
                        <IonIcon icon={cameraOutline} size="large" className="block mx-auto my-2 text-gray-400"/>
                     </div>
                 )}
                <IonButton expand="block" onClick={takePhoto} disabled={!!photo}>
                   <IonIcon slot="start" icon={cameraOutline} />
                    Prendre la Photo
                </IonButton>
                <IonButton expand="block" color="success" onClick={() => handlePhotoProofSubmit(photo)} disabled={!photo}>
                    Envoyer la Preuve
                </IonButton>
             </IonContent>
         </IonModal>

         {/* Added IonToast for feedback */}
         <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            color={toastColor}
            duration={3000} // Show toast for 3 seconds
            position="bottom"
         />

    </IonPage>
  );
};

export default PlayerPage;