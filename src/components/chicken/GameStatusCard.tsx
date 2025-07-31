import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonRippleEffect,
  IonButton,
  IonBadge
} from '@ionic/react';
import { 
  locationOutline, 
  timeOutline, 
  peopleOutline, 
  chevronDownOutline,
  eyeOffOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import './GameStatusCard.css';

interface GameStatusCardProps {
  gameState: ChickenGameState;
  onOpenSelectBarModal: () => void;
  isHidden?: boolean;
  onHideChicken?: () => void;
  hidingTimeLeft?: string;
  hideTimer?: boolean;
  hideTeamsFound?: boolean;
  showingHelpModal?: boolean;
  hideChicken?: boolean;
}

const GameStatusCard: React.FC<GameStatusCardProps> = ({
  gameState,
  onOpenSelectBarModal,
  isHidden = false,
  onHideChicken,
  hidingTimeLeft,
  hideTimer = false,
  hideTeamsFound = false,
  showingHelpModal,
  hideChicken = false
}) => {
  const teamsFound = gameState.teams.filter(team => team.foundChicken).length;
  const totalTeams = gameState.teams.length;
  
  // Déterminer si en phase de cachette ou de chasse
  const isHidingPhase = !isHidden && hidingTimeLeft && hidingTimeLeft !== '00:00';

  // Display the appropriate timer based on state
  const displayTimer = isHidingPhase ? hidingTimeLeft : gameState.timeLeft;
  const timerLabel = isHidingPhase ? 'Pour se cacher' : 'Restant';


  return (
    <IonCard className="game-status-card ion-activatable">
      <IonCardContent className="status-content">
        {/* Main stats grid */}
        <div className="stat-grid">
          {!hideTimer && (
            <div className={`stat-item time-item ${isHidingPhase ? 'critical' : ''}`}>
              <IonIcon icon={timeOutline} />
              <div className="stat-details">
                <div className="stat-value">{displayTimer}</div>
                <div className="stat-label">{timerLabel}</div>
              </div>
            </div>
          )}
          
          {!hideTeamsFound && (
            <div className="stat-item teams-count-item">
              <IonIcon icon={peopleOutline} />
              <div className="stat-details">
                <div className="stat-value">{teamsFound}/{totalTeams}</div>
                <div className="stat-label">Trouvé</div>
              </div>
            </div>
          )}
        </div>

        {(!isHidden || !gameState.currentBar) && (
          <IonItem 
            lines="none" 
            detail={false} 
            button={!isHidden}
            onClick={isHidden ? undefined : onOpenSelectBarModal}
            className="location-selector"
            disabled={isHidden}
          >
            <IonIcon icon={locationOutline} slot="start" color={isHidden ? "success" : "primary"} />
            {gameState.currentBar ? (
              <IonLabel className="location-label">
                <h2>{gameState.currentBar.name}</h2>
                {!isHidden && <p>{gameState.currentBar.address}</p>}
              </IonLabel>
            ) : (
              <IonLabel color="medium">
                <h2>Sélectionner un bar...</h2>
              </IonLabel>
            )}
            {!isHidden && <IonIcon icon={chevronDownOutline} slot="end" />}
            {isHidden && (
              <IonBadge color="success" slot="end">
                <IonIcon icon={checkmarkCircleOutline} />
                Caché
              </IonBadge>
            )}
          </IonItem>
        )}

        {!isHidden && isHidingPhase && gameState.currentBar && (
          <div className="hide-button-container flex justify-center">
            <IonButton
              expand="block"
              color="primary"
              fill="outline"
              className="hide-button"
              onClick={onHideChicken}
              shape="round"
              strong={true}
            >
              <IonIcon icon={eyeOffOutline} slot="start" />
              Je suis caché ici !
            </IonButton>
          </div>
        )}
      </IonCardContent>
      <IonRippleEffect />
    </IonCard>
  );
};

export default GameStatusCard; 