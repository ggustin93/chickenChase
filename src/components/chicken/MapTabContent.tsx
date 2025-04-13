import React, { useState, useEffect } from 'react';
import { IonToast, IonActionSheet, IonFab, IonFabButton, IonIcon, IonBadge, IonChip } from '@ionic/react';
import { ChickenGameState, Bar } from '../../data/types';
import GameMap from '../GameMap';
import GameStatusCard from './GameStatusCard';
import { trashOutline, informationCircleOutline, timeOutline } from 'ionicons/icons';
import { useBarManagement } from '../../hooks/useBarManagement';
import useGameTimerDisplay from '../../hooks/useGameTimerDisplay';
import useCagnotteConsumption from '../../hooks/useCagnotteConsumption';
import CagnotteModal from './CagnotteModal';
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

  // Use the cagnotte consumption hook directly
  const cagnotteManager = useCagnotteConsumption({
    currentCagnotte: gameState.currentCagnotte || 0,
    onCagnotteConsumption: (amount, reason) => {
      if (onCagnotteConsumption) {
        onCagnotteConsumption(amount, reason);
        
        // Send notification about cagnotte consumption
        if (onSendNotification) {
          onSendNotification(
            `Le poulet a dépensé ${amount}€ de la cagnotte${reason ? ` pour "${reason}"` : ''}.`,
            'cagnotteEvent'
          );
        }
        
        setToastMessage(`${amount}€ utilisés de la cagnotte!`);
        setShowToast(true);
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
          `Le poulet est maintenant caché ! La chasse est lancée pour ${gameState.timeLeft} !`,
          'clue'
        );
      }
      
      setToastMessage('Vous êtes maintenant caché ! La chasse peut commencer !');
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

  // Handle opening the cagnotte modal
  const handleOpenCagnotteModal = () => {
    if (cagnotteManager && typeof cagnotteManager.openModal === 'function') {
      cagnotteManager.openModal();
    }
  };

  return (
    <div className="map-tab-container no-scroll">
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
      
      {/* Fixed size map container */}
      <div className="map-container fixed-map">
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
        
        {/* Bouton de contrôle d'affichage des bars sur la carte - position ajustée */}
        <IonFab vertical="top" horizontal="end" slot="fixed" className="teams-visibility-fab">
          <IonFabButton size="small" onClick={handleToggleBarsVisibility} color={showBarsOnMap ? "primary" : "medium"}>
            {showBarsOnMap ? (
              <div className="beer-icon-container">🍺</div>
            ) : (
              <div className="beer-icon-container beer-icon-hidden">🍺</div>
            )}
            {showBarsOnMap && barsWithBeerEmoji.length > 0 && (
              <IonBadge color="danger" className="teams-count-badge">{barsWithBeerEmoji.length}</IonBadge>
            )}
          </IonFabButton>
        </IonFab>
      </div>
      
      {/* Status card with cagnotte visible only after hiding */}
      <div className={`status-card-container ultra-compact ${isTransitioning ? 'fade-transition' : ''}`}>
        <GameStatusCard
          gameState={gameState}
          onOpenSelectBarModal={onOpenSelectBarModal || (() => {})}
          isHidden={gameState.isChickenHidden}
          onHideChicken={handleHideChicken}
          hidingTimeLeft={gameState.hidingTimeLeft}
          hideTimer={true} /* Hide timer in card since it's now on map */
          hideTeamsFound={true} /* Hide teams found section since it's not relevant on map */
          hideCagnotte={!gameState.isChickenHidden} /* Show cagnotte only when chicken is hidden */
          cagnotte={gameState.currentCagnotte || 0}
          showCagnotteModal={handleOpenCagnotteModal}
        />
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

      {/* Separate CagnotteModal managed at the Map level */}
      <CagnotteModal 
        isOpen={cagnotteManager.showModal}
        onClose={cagnotteManager.closeModal}
        currentAmount={cagnotteManager.localCagnotte}
        amount={cagnotteManager.amount}
        onAmountChange={cagnotteManager.setAmount}
        error={cagnotteManager.error}
        onSubmit={cagnotteManager.handleSubmit}
      />
    </div>
  );
};

export default MapTabContent; 