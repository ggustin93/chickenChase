import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonRippleEffect,
  IonButton,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonInput,
  IonText,
  IonFooter
} from '@ionic/react';
import { 
  locationOutline, 
  timeOutline, 
  peopleOutline, 
  chevronDownOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  walletOutline,
  removeCircleOutline
} from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import './GameStatusCard.css';

interface GameStatusCardProps {
  gameState: ChickenGameState;
  onOpenSelectBarModal: () => void;
  isHidden?: boolean;
  onHideChicken?: () => void;
  hidingTimeLeft?: string;
  onCagnotteConsumption?: (amount: number, reason: string) => void;
}

const GameStatusCard: React.FC<GameStatusCardProps> = ({
  gameState,
  onOpenSelectBarModal,
  isHidden = false,
  onHideChicken,
  hidingTimeLeft,
  onCagnotteConsumption
}) => {
  const teamsFound = gameState.teams.filter(team => team.foundChicken).length;
  const totalTeams = gameState.teams.length;
  
  // Déterminer si en phase de cachette ou de chasse
  const isHidingPhase = !isHidden && hidingTimeLeft && hidingTimeLeft !== '00:00';

  // State for cagnotte consumption modal
  const [showCagnotteModal, setShowCagnotteModal] = useState(false);
  const [consumptionAmount, setConsumptionAmount] = useState<number | undefined>(undefined);
  const [amountError, setAmountError] = useState('');

  // Display the appropriate timer based on state
  const displayTimer = isHidingPhase ? hidingTimeLeft : gameState.timeLeft;
  const timerLabel = isHidingPhase ? 'Pour se cacher' : 'Restant';

  // Handle consumption submission
  const handleConsumptionSubmit = () => {
    if (!consumptionAmount || consumptionAmount <= 0) {
      setAmountError('Veuillez entrer un montant valide');
      return;
    }
    
    if (consumptionAmount > gameState.currentCagnotte) {
      setAmountError(`Le montant ne peut pas dépasser la cagnotte (${gameState.currentCagnotte}€)`);
      return;
    }
    
    if (onCagnotteConsumption) {
      onCagnotteConsumption(consumptionAmount, 'Dépense cagnotte');
      resetConsumptionForm();
      setShowCagnotteModal(false);
    }
  };

  // Reset form values
  const resetConsumptionForm = () => {
    setConsumptionAmount(undefined);
    setAmountError('');
  };

  return (
    <IonCard className="game-status-card ion-activatable">
      <IonCardContent className="status-content">
        {/* Main stats grid */}
        <div className="stat-grid">
          <div className={`stat-item time-item ${isHidingPhase ? 'critical' : ''}`}>
            <IonIcon icon={timeOutline} />
            <div className="stat-details">
              <div className="stat-value">{displayTimer}</div>
              <div className="stat-label">{timerLabel}</div>
            </div>
          </div>
          
          <div className="stat-item teams-count-item">
            <IonIcon icon={peopleOutline} />
            <div className="stat-details">
              <div className="stat-value">{teamsFound}/{totalTeams}</div>
              <div className="stat-label">Trouvé</div>
            </div>
          </div>
        </div>

        {/* Cagnotte section - new, compact version */}
        <div className="cagnotte-container compact">
          <div className="cagnotte-header">
            <IonIcon icon={walletOutline} />
            <h3>Cagnotte</h3>
            <div className="cagnotte-amount">{gameState.currentCagnotte}€</div>
            <div className="cagnotte-mini-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${Math.max(0, Math.min(100, Math.round((gameState.currentCagnotte / gameState.initialCagnotte) * 100)))}%` }}
              />
            </div>
          </div>
          
          {isHidden && (
            <IonButton 
              expand="block" 
              fill="outline" 
              size="small"
              className="consume-cagnotte-button"
              onClick={() => setShowCagnotteModal(true)}
            >
              <IonIcon icon={removeCircleOutline} slot="start" />
              Utiliser
            </IonButton>
          )}
        </div>

        {/* Location section */}
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
              <p>{gameState.currentBar.address}</p>
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

        {/* Hide Button - only shown when not hidden and during hiding phase */}
        {!isHidden && isHidingPhase && gameState.currentBar && (
          <div className="hide-button-container">
            <IonButton
              expand="block"
              color="primary"
              className="hide-button"
              onClick={onHideChicken}
            >
              <IonIcon icon={eyeOffOutline} slot="start" />
              Je suis caché ici !
            </IonButton>
          </div>
        )}
        
        {/* Info text about game rules */}
        <div className="game-info">
          <p>{isHidden 
            ? "Vous êtes caché ! La chasse est ouverte." 
            : isHidingPhase 
              ? "Trouvez votre cachette avant la fin du compte à rebours." 
              : "Une fois caché dans un bar, vous ne pouvez plus changer de lieu pendant la partie."
          }</p>
        </div>
      </IonCardContent>
      <IonRippleEffect />

      {/* Cagnotte consumption modal */}
      <IonModal isOpen={showCagnotteModal} onDidDismiss={() => setShowCagnotteModal(false)} className="cagnotte-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>UTILISER LA CAGNOTTE</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => {
                resetConsumptionForm();
                setShowCagnotteModal(false);
              }}>
                ANNULER
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="cagnotte-modal-content">
          <div className="cagnotte-status">
            <IonIcon icon={walletOutline} color="primary" />
            <h2>Cagnotte disponible: {gameState.currentCagnotte}€</h2>
          </div>
          
          <div className="amount-input-container">
            <IonItem lines="none" className="amount-input">
              <IonLabel position="stacked">Montant (€)</IonLabel>
              <IonInput 
                type="number" 
                value={consumptionAmount}
                onIonChange={e => {
                  const value = parseFloat(e.detail.value || '0');
                  setConsumptionAmount(value);
                  setAmountError('');
                }}
                min={0} 
                max={gameState.currentCagnotte}
                placeholder="Entrer un montant"
                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
              />
            </IonItem>
            {amountError && <IonText color="danger" className="error-message">{amountError}</IonText>}
          </div>
          
          <div className="consumption-info">
            <p>L'utilisation de la cagnotte sera notifiée à toutes les équipes.</p>
          </div>
        </IonContent>
        <IonFooter className="cagnotte-footer">
          <IonButton 
            expand="block" 
            onClick={handleConsumptionSubmit}
            disabled={!consumptionAmount || consumptionAmount <= 0}
            className="validate-button"
            shape="round"
            size="large"
          >
            <IonIcon icon={removeCircleOutline} slot="start" />
            VALIDER LA DÉPENSE
          </IonButton>
        </IonFooter>
      </IonModal>
    </IonCard>
  );
};

export default GameStatusCard; 