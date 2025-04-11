import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonChip,
  IonButton,
  IonCardHeader,
  IonCardTitle
} from '@ionic/react';
import { 
  locationOutline, 
  timeOutline, 
  peopleOutline, 
  chevronDownOutline,
  ribbonOutline,
  bulbOutline,
  footstepsOutline
} from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import './GameStatusCard.css';

interface GameStatusCardProps {
  gameState: ChickenGameState;
  onOpenSelectBarModal: () => void;
  onSendClue: () => void;
  onChickenRun?: () => void;
}

const GameStatusCard: React.FC<GameStatusCardProps> = ({
  gameState,
  onOpenSelectBarModal,
  onSendClue,
  onChickenRun
}) => {
  const teamsFound = gameState.teams.filter(team => team.foundChicken).length;
  const totalTeams = gameState.teams.length;

  return (
    <IonCard className="game-status-card">
      <IonCardHeader>
        <div className="game-status-header">
          <IonCardTitle>État de la partie</IonCardTitle>
          <div className="game-stats">
            <div className="stat-item">
              <IonIcon icon={timeOutline} />
              <span>{gameState.timeLeft}</span>
            </div>
            <div className="stat-item">
              <IonIcon icon={peopleOutline} />
              <span>{teamsFound}/{totalTeams}</span>
            </div>
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        <div className="location-section">
          <h3 className="section-title">Ma cachette actuelle</h3>
          <IonItem 
            lines="none" 
            detail={false} 
            button
            onClick={onOpenSelectBarModal}
            className="location-selector"
          >
            <IonIcon icon={locationOutline} slot="start" color="primary" />
            {gameState.currentBar ? (
              <IonLabel className="location-label">
                <h2>{gameState.currentBar.name}</h2>
                <p>{gameState.currentBar.address}</p>
              </IonLabel>
            ) : (
              <IonLabel color="medium">
                <h2>Sélectionner un bar...</h2>
              </IonLabel>
            )}
            <IonIcon icon={chevronDownOutline} slot="end" />
          </IonItem>
        </div>

        <div className="teams-section">
          <div className="teams-header">
            <h3 className="section-title">Équipes</h3>
            <span className="teams-count">{teamsFound}/{totalTeams} ont trouvé le poulet</span>
          </div>
          
          <div className="teams-list">
            {gameState.teams.map(team => (
              <IonChip 
                key={team.id} 
                outline={!team.foundChicken}
                color={team.foundChicken ? "success" : "medium"}
                className="team-chip"
              >
                {team.foundChicken && (
                  <IonIcon icon={ribbonOutline} color="success" />
                )}
                <span>{team.name}</span>
              </IonChip>
            ))}
          </div>
        </div>

        <div className="action-button">
          <IonButton 
            expand="block" 
            color="primary" 
            size="small"
            className="chicken-run-btn"
            onClick={onChickenRun}
            disabled={!gameState.currentBar}
          >
            <IonIcon icon={footstepsOutline} slot="start" />
            Chicken Run
          </IonButton>
        </div>

        <div className="clue-button-container">
          <IonButton 
            expand="block" 
            color="warning" 
            className="clue-button"
            onClick={onSendClue}
          >
            <IonIcon icon={bulbOutline} slot="start" />
            Envoyer un indice à toutes les équipes
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default GameStatusCard; 