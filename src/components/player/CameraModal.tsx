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
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onDidDismiss,
  photo,
  takePhoto,
  onPhotoProofSubmit,
  challengeToComplete,
  challenges
}) => {
  const challenge = challengeToComplete 
    ? challenges.find(c => c.id === challengeToComplete) 
    : null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{challengeToComplete ? "Preuve Défi" : "Preuve Photo"}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Annuler</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="mb-3">
          {challengeToComplete && `Preuve requise pour le défi: ${challenge?.title}`}
          {!challengeToComplete && "Preuve générique (si nécessaire)"}
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
            <p>(Intégration du plugin Capacitor Camera ici)</p>
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