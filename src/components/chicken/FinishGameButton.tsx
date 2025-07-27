import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonAlert,
  IonToast
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';

interface FinishGameButtonProps {
  onFinishGame: () => Promise<void>;
  isChickenHidden: boolean;
}

const FinishGameButton: React.FC<FinishGameButtonProps> = ({ onFinishGame, isChickenHidden }) => {
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinishGame = async () => {
    try {
      setIsLoading(true);
      await onFinishGame();
      setToastMessage('La partie est terminée ! Bravo à tous !');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Erreur lors de la fin de la partie');
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowConfirmAlert(false);
    }
  };

  // Only show the button if the chicken is hidden (game is in progress)
  if (!isChickenHidden) {
    return null;
  }

  return (
    <>
      <IonButton
        fill="clear"
        color="medium"
        size="small"
        onClick={() => setShowConfirmAlert(true)}
        disabled={isLoading}
        className="finish-game-button"
        style={{ opacity: 0.6 }}
      >
        <IonIcon icon={checkmarkCircle} slot="start" />
        Terminer la partie
      </IonButton>

      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => setShowConfirmAlert(false)}
        header="Terminer la partie"
        message="Êtes-vous sûr de vouloir terminer la partie ? Cette action est irréversible et tous les joueurs seront notifiés."
        buttons={[
          {
            text: 'Annuler',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Terminer',
            cssClass: 'danger',
            handler: handleFinishGame
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </>
  );
};

export default FinishGameButton;