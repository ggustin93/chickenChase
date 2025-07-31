import React, { useState, useEffect } from 'react';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonIcon, IonModal, IonProgressBar, IonText, IonSpinner, IonAlert 
} from '@ionic/react';
import { cameraOutline, cloudUploadOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { UseCameraPhoto, UploadState } from '../../hooks/useCamera';
import { Challenge } from '../../data/types';
import { PhotoMetadata, PhotoUploadResult } from '../../services/photoUploadService';

interface CameraModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  photo: UseCameraPhoto | null;
  uploadState: UploadState;
  takePhoto: () => void;
  uploadPhoto: (metadata: PhotoMetadata) => Promise<PhotoUploadResult | null>;
  clearPhoto: () => void;
  onPhotoProofSubmit: (uploadResult: PhotoUploadResult) => void;
  challengeToComplete: string | null;
  challenges: Challenge[];
  barToVisit?: string | null;
  gameId?: string;
  teamId?: string;
  playerId?: string;
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onDidDismiss,
  photo,
  uploadState,
  takePhoto,
  uploadPhoto,
  clearPhoto,
  onPhotoProofSubmit,
  challengeToComplete,
  challenges,
  barToVisit,
  gameId,
  teamId,
  playerId
}) => {
  const [showErrorAlert, setShowErrorAlert] = useState(false);

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

  const handleUploadAndSubmit = async () => {
    console.log('🔧 DEBUG: handleUploadAndSubmit called');
    console.log('🔧 DEBUG: photo:', photo);
    console.log('🔧 DEBUG: gameId:', gameId);
    console.log('🔧 DEBUG: teamId:', teamId);
    console.log('🔧 DEBUG: challengeToComplete:', challengeToComplete);
    console.log('🔧 DEBUG: playerId:', playerId);

    if (!photo || !gameId || !teamId || !challengeToComplete) {
      console.error('🔧 DEBUG: Missing required data for upload');
      console.error('🔧 DEBUG: photo exists:', !!photo);
      console.error('🔧 DEBUG: gameId exists:', !!gameId);
      console.error('🔧 DEBUG: teamId exists:', !!teamId);
      console.error('🔧 DEBUG: challengeToComplete exists:', !!challengeToComplete);
      setShowErrorAlert(true);
      return;
    }

    try {
      const metadata = {
        gameId,
        teamId,
        challengeId: challengeToComplete,
        playerId: playerId || '',
        originalName: photo.file?.name || 'photo.jpg',
        timestamp: Date.now()
      };

      console.log('🔧 DEBUG: Upload metadata:', metadata);
      console.log('🔧 DEBUG: Calling uploadPhoto...');
      
      const uploadResult = await uploadPhoto(metadata);
      
      console.log('🔧 DEBUG: Upload result:', uploadResult);
      
      if (uploadResult && uploadResult.success) {
        console.log('🔧 DEBUG: Upload successful, calling onPhotoProofSubmit');
        onPhotoProofSubmit(uploadResult);
        onDidDismiss();
      } else {
        console.error('🔧 DEBUG: Upload failed or returned unsuccessful result');
        console.error('🔧 DEBUG: Upload error:', uploadResult?.error);
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('🔧 DEBUG: Exception in handleUploadAndSubmit:', error);
      setShowErrorAlert(true);
    }
  };

  const handleRetakePhoto = () => {
    clearPhoto();
  };

  // Reset error alert when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowErrorAlert(false);
    }
  }, [isOpen]);

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

        {/* Photo Preview */}
        {photo?.webviewPath && (
          <div className="my-4 text-center">
            <img 
              src={photo.webviewPath} 
              alt="Aperçu" 
              style={{ maxWidth: '100%', maxHeight: '300px', display: 'inline-block' }} 
            />
          </div>
        )}

        {/* Empty State */}
        {!photo && !uploadState.uploading && (
          <div className="text-center my-4">
            <IonIcon 
              icon={cameraOutline} 
              size="large" 
              className="block mx-auto my-2 text-gray-400"
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="my-4">
            <div className="flex items-center justify-center mb-2">
              <IonSpinner name="crescent" className="mr-2" />
              <IonText>
                <p className="text-sm">Envoi en cours... {Math.round(uploadState.progress)}%</p>
              </IonText>
            </div>
            <IonProgressBar value={uploadState.progress / 100} />
          </div>
        )}

        {/* Success State */}
        {uploadState.result?.success && !uploadState.uploading && (
          <div className="my-4 text-center">
            <IonIcon 
              icon={checkmarkCircleOutline} 
              size="large" 
              color="success"
              className="block mx-auto my-2"
            />
            <IonText color="success">
              <p className="text-sm">Photo envoyée avec succès!</p>
            </IonText>
          </div>
        )}

        {/* Error State */}
        {uploadState.error && !uploadState.uploading && (
          <div className="my-4 text-center">
            <IonIcon 
              icon={alertCircleOutline} 
              size="large" 
              color="danger"
              className="block mx-auto my-2"
            />
            <IonText color="danger">
              <p className="text-sm">Erreur d'envoi: {uploadState.error}</p>
            </IonText>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!photo && (
            <IonButton 
              expand="block" 
              onClick={takePhoto} 
              disabled={uploadState.uploading}
            >
              <IonIcon slot="start" icon={cameraOutline} />
              Prendre la Photo
            </IonButton>
          )}

          {photo && !uploadState.result?.success && (
            <>
              <IonButton 
                expand="block" 
                fill="outline"
                onClick={handleRetakePhoto} 
                disabled={uploadState.uploading}
              >
                <IonIcon slot="start" icon={cameraOutline} />
                Reprendre la Photo
              </IonButton>
              
              <IonButton 
                expand="block" 
                color="success" 
                onClick={handleUploadAndSubmit}
                disabled={uploadState.uploading || !photo}
              >
                <IonIcon slot="start" icon={cloudUploadOutline} />
                {uploadState.uploading ? 'Envoi...' : 'Envoyer la Preuve'}
              </IonButton>
            </>
          )}
        </div>

        {/* Error Alert */}
        <IonAlert
          isOpen={showErrorAlert}
          onDidDismiss={() => setShowErrorAlert(false)}
          header="Erreur"
          message={uploadState.error || "Une erreur s'est produite lors de l'envoi de la photo. Veuillez réessayer."}
          buttons={[
            {
              text: 'Réessayer',
              handler: () => {
                if (photo) {
                  handleUploadAndSubmit();
                }
              }
            },
            {
              text: 'Annuler',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonModal>
  );
};

export default CameraModal; 