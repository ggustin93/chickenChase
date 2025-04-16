import React, { useState } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonItem, IonLabel, IonInput, IonIcon
} from '@ionic/react';
import { close, checkmark } from 'ionicons/icons';
import { Challenge } from '../../data/types';

interface UnlockModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  challenge: Challenge | null;
  onSubmit: (challengeId: string, answer: string) => void; // Callback on submit
}

const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  onDidDismiss,
  challenge,
  onSubmit
}) => {
  const [answer, setAnswer] = useState('');

  // Handle input change
  const handleInputChange = (event: CustomEvent) => {
    setAnswer(event.detail.value || '');
  };

  // Handle submission
  const handleSubmit = () => {
    if (challenge && answer.trim()) {
      onSubmit(challenge.id, answer.trim());
      setAnswer(''); // Clear input after submit
    }
  };

  // Clear answer when modal opens/challenge changes
  React.useEffect(() => {
    if (isOpen) {
      setAnswer('');
    }
  }, [isOpen]);

  if (!challenge) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => { setAnswer(''); onDidDismiss(); }}>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle className="ion-text-center font-semibold">Répondre au Défi</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => { setAnswer(''); onDidDismiss(); }}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-lg font-bold">{challenge.title}</IonCardTitle>
            <IonCardSubtitle>{challenge.points} pts</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="ion-margin-top ion-margin-bottom">{challenge.description}</p>
            
            <IonItem lines="full" className="ion-margin-top">
              <IonLabel position="stacked">Votre réponse</IonLabel>
              <IonInput 
                value={answer}
                onIonInput={handleInputChange} // Use onIonInput for controlled component
                placeholder="Entrez votre réponse ici"
                clearInput // Adds a clear button
              />
            </IonItem>

            <IonButton 
              expand="block" 
              color="warning" 
              fill="outline"
              className="ion-margin-top font-semibold" 
              onClick={handleSubmit}
              disabled={!answer.trim()} // Disable if input is empty
            >
              <IonIcon icon={checkmark} slot="start" />
              Valider la réponse
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default UnlockModal; 