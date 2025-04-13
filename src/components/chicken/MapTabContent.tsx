import React, { useState } from 'react';
import { IonToast, IonActionSheet, IonFab, IonFabButton, IonIcon, IonBadge, IonChip } from '@ionic/react';
import { ChickenGameState, Bar } from '../../data/types';
import GameMap from '../GameMap';
import GameStatusCard from './GameStatusCard';
import { eyeOutline, eyeOffOutline, trashOutline, informationCircleOutline } from 'ionicons/icons';
import { useBarManagement } from '../../hooks/useBarManagement';
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
  const [showTeamsOnMap, setShowTeamsOnMap] = useState(true); // Affiche les équipes par défaut
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [showBarActionSheet, setShowBarActionSheet] = useState(false);

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
          `Le poulet est maintenant caché ! La chasse est lancée pour ${gameState.timeLeft} !`,
          'clue'
        );
      }
      
      setToastMessage('Vous êtes maintenant caché ! La chasse peut commencer !');
      setShowToast(true);
    }
  };

  const handleToggleTeamsVisibility = () => {
    setShowTeamsOnMap(!showTeamsOnMap);
    setToastMessage(`Positions des équipes ${!showTeamsOnMap ? 'affichées' : 'masquées'} sur la carte`);
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

  // Handle cagnotte consumption
  const handleCagnotteConsumption = (amount: number, reason: string) => {
    if (onCagnotteConsumption) {
      onCagnotteConsumption(amount, reason);
      
      // Send notification about cagnotte consumption
      if (onSendNotification) {
        onSendNotification(
          `Le poulet a dépensé ${amount}€ de la cagnotte${reason ? ` pour "${reason}"` : ''}.`,
          'cagnotteEvent'
        );
      }
    }
  };

  // Filtrer et préparer les équipes pour l'affichage sur la carte
  const getTeamsWithLocations = () => {
    // Ne renvoyer que les équipes qui ont une position connue
    if (!showTeamsOnMap) return [];

    return gameState.teams.filter(team => 
      team.lastLocation && 
      team.lastLocation.latitude && 
      team.lastLocation.longitude
    );
  };

  // Calculer le nombre d'équipes visibles sur la carte
  const visibleTeamsCount = getTeamsWithLocations().length;
  
  // Calculer le nombre de bars retirés
  const removedBarsCount = removedBars.length;

  return (
    <div className="map-tab-container">
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
      
      {/* Augmenter la taille relative de la carte */}
      <div className="map-container large-map">
        <GameMap 
          currentLocation={
            gameState.currentBar 
              ? [gameState.currentBar.latitude, gameState.currentBar.longitude]
              : undefined
          }
          bars={availableBars}
          teamLocations={getTeamsWithLocations()}
          onBarClick={handleBarClick}
          isChicken={true}
        />
        
        {/* Bouton de contrôle d'affichage des équipes sur la carte */}
        <IonFab vertical="top" horizontal="end" slot="fixed" className="teams-visibility-fab">
          <IonFabButton size="small" onClick={handleToggleTeamsVisibility} color={showTeamsOnMap ? "primary" : "medium"}>
            <IonIcon icon={showTeamsOnMap ? eyeOutline : eyeOffOutline} />
            {showTeamsOnMap && visibleTeamsCount > 0 && (
              <IonBadge color="danger" className="teams-count-badge">{visibleTeamsCount}</IonBadge>
            )}
          </IonFabButton>
        </IonFab>
      </div>
      
      {/* Réduire la taille et rendre le status card plus compact */}
      <div className="status-card-container compact">
        <GameStatusCard
          gameState={gameState}
          onOpenSelectBarModal={onOpenSelectBarModal || (() => {})}
          isHidden={gameState.isChickenHidden}
          onHideChicken={handleHideChicken}
          hidingTimeLeft={gameState.hidingTimeLeft}
          onCagnotteConsumption={handleCagnotteConsumption}
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
    </div>
  );
};

export default MapTabContent; 