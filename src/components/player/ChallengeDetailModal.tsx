import React from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonImg, IonIcon, IonBadge
} from '@ionic/react';
import { closeCircleOutline, checkmarkCircleOutline, timeOutline, close } from 'ionicons/icons';
import { Challenge, ChallengeCompletion } from '../../data/types';

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  challenge: Challenge | null;
  completion: ChallengeCompletion | null;
}

// Helper to get status details (similar to ChallengesTab but maybe slightly different presentation)
const getStatusBadge = (status: ChallengeCompletion['status'] | undefined) => {
  switch (status) {
    case 'pending':
      return <IonBadge color="warning"><IonIcon icon={timeOutline} slot="start" /> En attente</IonBadge>;
    case 'approved':
      return <IonBadge color="success"><IonIcon icon={checkmarkCircleOutline} slot="start" /> Validé</IonBadge>;
    case 'rejected':
      return <IonBadge color="danger"><IonIcon icon={closeCircleOutline} slot="start" /> Refusé</IonBadge>;
    default:
      return null; // Should not happen if modal is opened for completed/pending
  }
};

const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  isOpen,
  onDidDismiss,
  challenge,
  completion
}) => {
  if (!challenge) return null; // Don't render if no challenge is selected

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{challenge.title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{challenge.title}</IonCardTitle>
            <IonCardSubtitle>{challenge.points} pts</IonCardSubtitle>
            <div className="ion-margin-top">
              {getStatusBadge(completion?.status)}
            </div>
          </IonCardHeader>
          <IonCardContent>
            <p className="ion-margin-bottom">{challenge.description}</p>

            {completion && (
              <>
                <h3 className="ion-margin-top ion-margin-bottom text-sm font-semibold">Preuve photo :</h3>
                <IonImg
                  src={completion.photoUrl || `https://picsum.photos/seed/detail-${challenge.id}/400/300`}
                  alt={`Preuve pour ${challenge.title}`}
                  className="rounded-lg shadow-md"
                />
              </>
            )}
            {!completion && (
               <p className="text-medium text-sm italic ion-margin-top">Aucune soumission pour ce défi.</p>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default ChallengeDetailModal; 