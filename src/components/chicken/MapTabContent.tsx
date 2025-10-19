import React, { useState, useEffect } from 'react';
import { IonToast, IonActionSheet, IonFab, IonFabButton, IonIcon, IonChip, IonButton } from '@ionic/react';
import { ChickenGameState, Bar } from '../../data/types';
import GameMap from '../GameMap';
import UserInfoHeader from '../shared/UserInfoHeader';
import { trashOutline, informationCircleOutline, timeOutline, eyeOutline, eyeOffOutline, locationOutline } from 'ionicons/icons';
import { useBarManagement } from '../../hooks/useBarManagement';
import useGameTimerDisplay from '../../hooks/useGameTimerDisplay';
import './MapTabContent.css';

interface MapTabContentProps {
  gameState: ChickenGameState;
  onOpenSelectBarModal?: () => void;
  onHideChicken?: () => void; // Callback pour indiquer que le poulet est caché
  onRemoveBar?: (barId: string) => void; // Callback for bar removal
  onSendNotification?: (content: string, type: 'clue' | 'barRemoval' | 'cagnotteEvent') => void; // Callback for notifications
  onCagnotteConsumption?: (amount: number, reason: string) => void; // Callback for cagnotte consumption
  changeBar?: (barId: string) => Bar | null; // For changing current bar
  markTeamFound?: (teamId: string) => void; // For marking a team as found
}

const MapTabContent: React.FC<MapTabContentProps> = ({ 
  gameState, 
  onOpenSelectBarModal,
  onHideChicken,
  onRemoveBar,
  onSendNotification,
  onCagnotteConsumption
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBarsOnMap, setShowBarsOnMap] = useState(true); // Affiche les bars par défaut
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [showBarActionSheet, setShowBarActionSheet] = useState(false);
  
  // État pour suivre la transition entre caché/non-caché
  const [wasHidden, setWasHidden] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Utiliser le hook pour le timer
  const timerDisplay = useGameTimerDisplay({
    isChickenHidden: gameState.isChickenHidden || false,
    timeLeft: gameState.timeLeft,
    hidingTimeLeft: gameState.hidingTimeLeft
  });

  // Surveiller les changements de statut de cachette pour gérer la transition
  useEffect(() => {
    if (!wasHidden && gameState.isChickenHidden) {
      // Le poulet vient d'être caché
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    setWasHidden(gameState.isChickenHidden || false);
  }, [gameState.isChickenHidden, wasHidden]);

  // Use our bar management hook
  const { 
    bars: availableBars, 
    removedBars, 
    removeBar
  } = useBarManagement({
    initialBars: gameState.barOptions,
    onBarRemoved: (barId, barName) => {
      // Call the parent component's onRemoveBar if it exists
      if (onRemoveBar) {
        onRemoveBar(barId);
      }
      
      // Send notification about bar removal
      if (onSendNotification) {
        onSendNotification(
          `Le bar "${barName}" a été retiré de la carte. Le poulet ne s'y cache pas !`,
          'barRemoval'
        );
      }
    }
  });


  // Gestion du bouton "Je suis caché"
  const handleHideChicken = () => {
    if (onHideChicken) {
      onHideChicken();
      
      // Send notification about hiding
      if (onSendNotification && gameState.currentBar) {
        onSendNotification(
          `🚨 ATTENTION : Le poulet est maintenant caché au bar "${gameState.currentBar.name}" ! La chasse est officiellement lancée pour ${gameState.timeLeft} ! Bonne chance à toutes les équipes ! 🚨`,
          'clue'
        );
      }
      
      setToastMessage('Vous êtes maintenant caché ! Votre position a été enregistrée dans la base de données.');
      setShowToast(true);
    }
  };

  const handleToggleBarsVisibility = () => {
    setShowBarsOnMap(!showBarsOnMap);
    setToastMessage(`Positions des bars ${!showBarsOnMap ? 'affichées' : 'masquées'} sur la carte`);
    setShowToast(true);
  };

  // New function to handle bar click on map
  const handleBarClick = (barId: string) => {
    setSelectedBar(barId);
    setShowBarActionSheet(true);
  };

  // New function to handle bar removal
  const handleRemoveBar = () => {
    if (selectedBar) {
      const removedBar = removeBar(selectedBar);
      
      if (removedBar) {
        setToastMessage(`Bar "${removedBar.name}" retiré de la carte (indice envoyé aux équipes)`);
        setShowToast(true);
      } else {
        setToastMessage('Erreur: Bar non trouvé ou déjà retiré');
        setShowToast(true);
      }
    }
    setShowBarActionSheet(false);
  };

  // Filtrer et préparer les équipes pour l'affichage sur la carte
  const getTeamsWithLocations = () => {
    // Ne renvoyer que les équipes qui ont une position connue
    return gameState.teams.filter(team => 
      team.lastLocation && 
      team.lastLocation.latitude && 
      team.lastLocation.longitude
    );
  };
  
  // Calculer le nombre de bars retirés
  const removedBarsCount = removedBars.length;

  // Create modified bar data with beer emoji markers
  const barsWithBeerEmoji = availableBars.map(bar => ({
    ...bar,
    useCustomMarker: true,
    customMarkerHtml: bar.id === gameState.currentBar?.id 
      ? '<div class="beer-marker current">🍺</div>' 
      : '<div class="beer-marker">🍺</div>'
  }));
  
  // Fonction pour sélectionner un emoji approprié pour les équipes
  const getTeamEmoji = (): string => {
    // Utiliser un seul emoji pour toutes les équipes
    return '🕵️'; // Détective pour toutes les équipes
  };

  // Préparer les icônes custom pour les équipes (détectives)
  const teamsWithCustomIcons = getTeamsWithLocations().map(team => ({
    ...team,
    useCustomMarker: true,
    customMarkerHtml: `<div class="team-marker ${team.foundChicken ? 'found' : ''}" title="${team.name}">${getTeamEmoji()}</div>`
  }));


  // Find current player's team name
  const chickenTeam = gameState.teams.find(team => team.is_chicken_team);
  const teamName = chickenTeam ? chickenTeam.name : undefined;

  return (
    <div className="map-tab-container">
      {/* User Info Header */}
      <UserInfoHeader 
        totalPlayers={gameState.teams.reduce((total, team) => total + (team.members?.length || 0), 0)}
        additionalInfo={gameState.teams?.length ? `${gameState.teams.length} équipe${gameState.teams.length > 1 ? 's' : ''}` : undefined}
        teamName={teamName}
      />
      
      {/* Main map container - takes all available space */}
      <div className="map-container fullscreen-map">
        {/* Notification des bars retirés */}
        {removedBarsCount > 0 && (
          <div className="removed-bars-notification">
            <IonChip color="tertiary" outline>
              <IonIcon icon={trashOutline} />
              <span>{removedBarsCount} bar{removedBarsCount > 1 ? 's' : ''} retiré{removedBarsCount > 1 ? 's' : ''}</span>
            </IonChip>
            {removedBarsCount === 1 && (
              <div className="removed-bar-name">
                <IonIcon icon={informationCircleOutline} />
                <span>{removedBars[0].name}</span>
              </div>
            )}
          </div>
        )}
        
        <GameMap 
          currentLocation={
            gameState.currentBar 
              ? [gameState.currentBar.latitude, gameState.currentBar.longitude]
              : undefined
          }
          bars={showBarsOnMap ? barsWithBeerEmoji : []}
          teamLocations={teamsWithCustomIcons}
          onBarClick={handleBarClick}
          isChicken={true}
          centerOnCurrentLocation={false}
        />
        
        {/* Timer display in corner of map - avec classe différente selon la taille */}
        <div className={`map-timer-display ${timerDisplay.isLongTimer ? 'compact-timer' : ''}`}>
          <div className="timer-icon">
            <IonIcon icon={timeOutline} />
          </div>
          <div className="timer-value">{timerDisplay.displayTimer}</div>
          <div className="timer-label">{timerDisplay.timerLabel}</div>
        </div>
        
        {/* Bouton de filtrage des bars - avec un design distinctif */}
        <IonFab vertical="top" horizontal="end" slot="fixed" className="teams-visibility-fab">
          <IonFabButton size="small" onClick={handleToggleBarsVisibility} color="secondary">
            <IonIcon icon={showBarsOnMap ? eyeOutline : eyeOffOutline} />
          </IonFabButton>
        </IonFab>
      </div>
      
      {/* Floating action button for hiding when ready */}
      {!gameState.isChickenHidden && gameState.currentBar && (
        <div className="floating-hide-button">
          <IonFab vertical="bottom" horizontal="center" slot="fixed">
            <IonFabButton 
              color="warning" 
              onClick={handleHideChicken}
              className="hide-chicken-fab"
            >
              <IonIcon icon={eyeOffOutline} />
            </IonFabButton>
          </IonFab>
          <div className="hide-button-label">
            Je suis caché ici !
          </div>
        </div>
      )}
      
      {/* Bar selection overlay when no bar is selected */}
      {!gameState.currentBar && onOpenSelectBarModal && (
        <div className="no-bar-overlay">
          <div className="no-bar-content">
            <IonIcon icon={locationOutline} className="location-icon" />
            <h3>Sélectionnez votre cachette</h3>
            <p>Choisissez un bar pour commencer le jeu</p>
            <IonButton 
              expand="block" 
              color="primary" 
              onClick={() => {
                console.log('Bouton Choisir un bar cliqué!');
                onOpenSelectBarModal();
              }}
              className="select-bar-button"
            >
              Choisir un bar
            </IonButton>
          </div>
        </div>
      )}
      
      {/* Debug overlay - always visible for testing */}
      <div style={{ 
        position: 'absolute', 
        top: '50px', 
        left: '10px', 
        background: 'rgba(255,0,0,0.9)', 
        color: 'white',
        padding: '12px', 
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        <div>Overlay should show: {(!gameState.currentBar && onOpenSelectBarModal) ? 'YES' : 'NO'}</div>
        <div>!gameState.currentBar: {!gameState.currentBar ? 'true' : 'false'}</div>
        <div>currentBar: {gameState.currentBar ? JSON.stringify({id: gameState.currentBar.id, name: gameState.currentBar.name}) : 'null'}</div>
        <div>onOpenSelectBarModal: {onOpenSelectBarModal ? 'exists' : 'null'}</div>
        <div>bars count: {gameState.barOptions?.length || 0}</div>
        <div>gameId: {gameState.game?.id || 'undefined'}</div>
      </div>
      
      {/* Debug information */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(255,255,255,0.9)', 
        padding: '8px', 
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9998
      }}>
        Debug: currentBar={gameState.currentBar ? 'exists' : 'null'}, 
        onOpenSelectBarModal={onOpenSelectBarModal ? 'exists' : 'null'},
        bars={gameState.barOptions?.length || 0}
      </div>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="middle"
        color="primary"
      />

      {/* Action sheet for bar management */}
      <IonActionSheet
        isOpen={showBarActionSheet}
        onDidDismiss={() => setShowBarActionSheet(false)}
        header="Options du bar"
        buttons={[
          {
            text: 'Retirer de la carte (envoyer comme indice)',
            role: 'destructive',
            handler: handleRemoveBar
          },
          {
            text: 'Annuler',
            role: 'cancel'
          }
        ]}
      />
    </div>
  );
};

export default MapTabContent; 