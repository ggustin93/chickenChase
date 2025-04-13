import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonModal } from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import { UseCameraPhoto } from '../../hooks/useCamera';
import { Challenge } from '../../data/types';

interface CameraModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  photo: UseCameraPhoto | null;
  takePhoto: () => void;
  onPhotoProofSubmit: (photo: UseCameraPhoto | null) => void;
  challengeToComplete: string | null;
  challenges: Challenge[];
  barToVisit?: string | null; // Nom du bar à visiter (optionnel)
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onDidDismiss,
  photo,
  takePhoto,
  onPhotoProofSubmit,
  challengeToComplete,
  challenges,
  barToVisit
}) => {
  const challenge = challengeToComplete 
    ? challenges.find(c => c.id === challengeToComplete) 
    : null;

  // Détermine le titre et le message en fonction de l'action
  const getTitle = () => {
    if (challengeToComplete) return "Preuve Défi";
    if (barToVisit) return "Preuve Visite";
    return "Preuve Photo";
  };

  const getMessage = () => {
    if (challengeToComplete) return `Preuve requise pour le défi: ${challenge?.title}`;
    if (barToVisit) return `Preuve de visite pour le bar: ${barToVisit}`;
    return "Preuve générique (si nécessaire)";
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{getTitle()}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Annuler</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="mb-3">
          {getMessage()}
        </p>
        {photo?.webviewPath && (
          <div className="my-4 text-center">
            <img 
              src={photo.webviewPath} 
              alt="Aperçu" 
              style={{ maxWidth: '100%', maxHeight: '300px', display: 'inline-block' }} 
            />
          </div>
        )}
        {!photo && (
          <div className="text-center my-4">
            <IonIcon 
              icon={cameraOutline} 
              size="large" 
              className="block mx-auto my-2 text-gray-400"
            />
          </div>
        )}
        <IonButton expand="block" onClick={takePhoto} disabled={!!photo}>
          <IonIcon slot="start" icon={cameraOutline} />
          Prendre la Photo
        </IonButton>
        <IonButton 
          expand="block" 
          color="success" 
          onClick={() => onPhotoProofSubmit(photo)} 
          disabled={!photo}
        >
          Envoyer la Preuve
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default CameraModal; 