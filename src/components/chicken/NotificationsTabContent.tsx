import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonButton,
  IonTextarea,
  IonBadge,
  IonNote,
  IonActionSheet,
  IonRippleEffect,
  IonSkeletonText,
  IonToast,
  IonText,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonChip
} from '@ionic/react';
import { 
  bulbOutline, 
  sendOutline, 
  timeOutline, 
  notificationsOutline,
  addCircle,
  informationCircleOutline,
  imageOutline,
  cameraOutline,
  closeCircle,
  walletOutline,
  mapOutline
} from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import { useCamera } from '../../hooks/useCamera';
import './NotificationsTabContent.css';

interface NotificationsTabContentProps {
  gameState: ChickenGameState;
  onSendClue: (clueText: string, photoUrl?: string) => void;
}

const NotificationsTabContent: React.FC<NotificationsTabContentProps> = ({ 
  gameState,
  onSendClue
}) => {
  const [newClue, setNewClue] = useState('');
  const [showClueForm, setShowClueForm] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { photo, takePhoto } = useCamera();

  const handleSendClue = async () => {
    if (newClue.trim()) {
      setIsSubmitting(true);
      try {
        await onSendClue(newClue, photo?.webviewPath);
        setNewClue('');
        setToastMessage('Indice envoyé avec succès!');
        setShowToast(true);
        
        // Add a slight delay before hiding the form for a smoother transition
        setTimeout(() => {
          setShowClueForm(false);
        }, 300);
      } catch (error) {
        console.error('Error sending clue', error);
        setToastMessage('Erreur lors de l\'envoi de l\'indice');
        setShowToast(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      await takePhoto();
      setShowPhotoOptions(false);
    } catch (error) {
      console.error('Error taking photo', error);
      setToastMessage('Erreur lors de la prise de photo');
      setShowToast(true);
    }
  };

  const handleClearPhoto = () => {
    // Reset the photo by re-initializing the hook
    // This is a workaround since the hook doesn't provide a clear method
    takePhoto().then(() => takePhoto()).catch(console.error);
  };

  // Filter messages into different categories
  const clues = gameState.messages.filter(message => message.isClue);
  const cagnotteEvents = gameState.messages.filter(message => message.isCagnotteEvent);
  const barRemovals = gameState.messages.filter(message => message.isBarRemoval);
  
  // All events combined and sorted by timestamp (newest first)
  const sortedEvents = [...clues, ...cagnotteEvents, ...barRemovals]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleRefresh = (event: CustomEvent) => {
    // Dans une vraie app, on pourrait rafraîchir les données ici
    console.log('Rafraîchissement des indices...');
    
    // Simuler un délai de chargement
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  return (
    <IonContent className="notifications-content">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>
            <IonIcon icon={notificationsOutline} className="header-icon" />
            Notifications et Indices
          </h2>
          <p>Envoyez des informations à toutes les équipes</p>
        </div>

        {/* Formulaire pour envoyer un nouvel indice */}
        {showClueForm ? (
          <IonCard className="clue-form-card">
            <IonCardHeader>
              <IonCardTitle>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Nouvel indice
                  <IonButton 
                    fill="clear" 
                    color="medium" 
                    size="small"
                    onClick={() => setShowClueForm(false)}
                  >
                    <IonIcon icon={closeCircle} />
                  </IonButton>
                </div>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonTextarea
                value={newClue}
                onIonChange={e => setNewClue(e.detail.value || '')}
                placeholder="Saisissez votre indice ici..."
                autoGrow={true}
                maxlength={150}
                className="clue-textarea"
                disabled={isSubmitting}
              />
              
              {/* Character count indicator */}
              <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '10px' }}>
                <IonText color={newClue.length > 120 ? "warning" : "medium"} className="character-count">
                  <small>{newClue.length}/150</small>
                </IonText>
              </div>

              {photo?.webviewPath && (
                <div className="photo-preview-container">
                  <img src={photo.webviewPath} alt="Preview" className="photo-preview" />
                  <IonButton 
                    fill="clear" 
                    color="danger" 
                    className="remove-photo-button"
                    onClick={handleClearPhoto}
                    disabled={isSubmitting}
                  >
                    <IonIcon icon={closeCircle} />
                  </IonButton>
                </div>
              )}

              <div className="clue-form-actions">
                <div className="photo-actions">
                  <IonButton 
                    fill="clear" 
                    color="medium"
                    onClick={() => setShowPhotoOptions(true)}
                    disabled={isSubmitting}
                  >
                    <IonIcon icon={imageOutline} slot="start" />
                    {photo?.webviewPath ? 'Changer' : 'Ajouter'} photo
                  </IonButton>
                </div>
                <div className="clue-actions">
                  <IonButton 
                    fill="outline" 
                    onClick={() => setShowClueForm(false)}
                    size="default"
                    disabled={isSubmitting}
                  >
                    Annuler
                  </IonButton>
                  <IonButton 
                    onClick={handleSendClue}
                    disabled={!newClue.trim() || isSubmitting}
                    size="default"
                    color="primary"
                    strong={true}
                  >
                    {isSubmitting ? 
                      <IonSkeletonText animated style={{ width: '80px', height: '16px' }} /> : 
                      <>
                        <IonIcon icon={sendOutline} slot="start" />
                        Envoyer
                      </>
                    }
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ) : (
          <div className="info-banner">
            <IonIcon icon={informationCircleOutline} className="info-icon" />
            <p>Les indices sont visibles par toutes les équipes pour les aider à vous trouver.</p>
          </div>
        )}

        {/* En-tête de la section indices avec bouton d'ajout */}
        <div className="section-header">
          <h3>Activité ({sortedEvents.length})</h3>
          {!showClueForm && (
            <IonButton 
              fill="solid" 
              color="primary"
              onClick={() => setShowClueForm(true)}
              className="add-clue-button"
              size="small"
            >
              <IonIcon icon={addCircle} slot="start" />
              Nouvel indice
            </IonButton>
          )}
        </div>

        {/* Liste des événements simplifiée */}
        {sortedEvents.length === 0 ? (
          <div className="no-events-message">
            <p>Aucune activité pour le moment.</p>
            <IonButton 
              expand="block" 
              onClick={() => setShowClueForm(true)}
              className="empty-state-add-button"
            >
              <IonIcon icon={addCircle} slot="start" />
              Ajouter un premier indice
            </IonButton>
          </div>
        ) : (
          <IonList lines="full" className="indices-list">
            {sortedEvents.map((event) => (
              <IonItem key={event.id} className="indice-item">
                <div className="event-icon-container" style={{ 
                  backgroundColor: event.isClue 
                    ? 'rgba(255, 193, 7, 0.15)' 
                    : event.isCagnotteEvent 
                      ? 'rgba(76, 175, 80, 0.15)' 
                      : 'rgba(82, 96, 255, 0.15)'
                }}>
                  {event.isClue && <IonIcon icon={bulbOutline} color="warning" />}
                  {event.isCagnotteEvent && <IonIcon icon={walletOutline} color="success" />}
                  {event.isBarRemoval && <IonIcon icon={mapOutline} color="tertiary" />}
                </div>
                
                <IonLabel>
                  <div className="event-header">
                    <IonNote color="medium" className="event-time">
                      <IonIcon icon={timeOutline} />
                      {new Date(event.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </IonNote>
                    <IonChip 
                      color={event.isClue ? "warning" : event.isCagnotteEvent ? "success" : "tertiary"} 
                      className="event-type"
                    >
                      {event.isClue ? "Indice" : event.isCagnotteEvent ? "Cagnotte" : "Bar retiré"}
                    </IonChip>
                  </div>
                  <p className="event-message">{event.content}</p>
                  
                  {event.photoUrl && (
                    <div className="event-photo-container">
                      <img src={event.photoUrl} alt="Indice" className="event-photo" />
                    </div>
                  )}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </div>

      {/* Action sheet pour choisir la source de la photo */}
      <IonActionSheet
        isOpen={showPhotoOptions}
        onDidDismiss={() => setShowPhotoOptions(false)}
        buttons={[
          {
            text: 'Prendre une photo',
            icon: cameraOutline,
            handler: () => handleTakePhoto()
          },
          {
            text: 'Choisir depuis la galerie',
            icon: imageOutline,
            handler: () => handleTakePhoto()
          },
          {
            text: 'Annuler',
            role: 'cancel'
          }
        ]}
      />
      
      {/* Toast notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color="dark"
        buttons={[
          {
            text: 'Ok',
            role: 'cancel',
          }
        ]}
      />
    </IonContent>
  );
};

export default NotificationsTabContent; 