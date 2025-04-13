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
  IonFab,
  IonFabButton,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonNote,
  IonActionSheet,
  IonRippleEffect,
  IonSkeletonText,
  IonToast,
  IonText
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
  trashOutline,
  walletOutline,
  mapOutline,
  copyOutline,
  closeCircle
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

  const handleCopyEvent = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setToastMessage('Copié dans le presse-papier');
        setShowToast(true);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  // Filter messages into different categories
  const clues = gameState.messages.filter(message => message.isClue);
  const cagnotteEvents = gameState.messages.filter(message => message.isCagnotteEvent);
  const barRemovals = gameState.messages.filter(message => message.isBarRemoval);
  
  // All events combined and sorted by timestamp (newest first)
  const sortedEvents = [...clues, ...cagnotteEvents, ...barRemovals]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
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
                  <IonIcon icon={trashOutline} />
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

      {/* Liste des événements (indices, cagnotte, bars retirés) */}
      <div className="events-list-container">
        <div className="events-header">
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
          <IonList className="events-list">
            {sortedEvents.map((event) => (
              <IonItemSliding key={event.id}>
                <IonItem className="event-item" detail={false}>
                  <div className="ion-activatable ripple-parent" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <IonRippleEffect />
                  </div>
                  
                  <div className="event-icon-container" style={{ 
                    backgroundColor: event.isClue 
                      ? 'rgba(255, 193, 7, 0.15)' 
                      : event.isCagnotteEvent 
                        ? 'rgba(76, 175, 80, 0.15)' 
                        : 'rgba(82, 96, 255, 0.15)'
                  }}>
                    {event.isClue && (
                      <IonIcon icon={bulbOutline} color="warning" className="event-icon" />
                    )}
                    {event.isCagnotteEvent && (
                      <IonIcon icon={walletOutline} color="success" className="event-icon" />
                    )}
                    {event.isBarRemoval && (
                      <IonIcon icon={mapOutline} color="tertiary" className="event-icon" />
                    )}
                  </div>
                  
                  <IonLabel className="event-content">
                    <div className="event-timestamp">
                      <IonIcon icon={timeOutline} />
                      <IonNote color="medium">
                        {new Date(event.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </IonNote>
                    </div>
                    
                    <h2 className="event-text">{event.content}</h2>
                    
                    {/* Afficher la photo si elle existe */}
                    {event.photoUrl && (
                      <div className="event-photo-container">
                        <img src={event.photoUrl} alt="Indice" className="event-photo" />
                      </div>
                    )}
                  </IonLabel>
                  
                  <IonBadge slot="end" color={
                    event.isClue ? "warning" : 
                    event.isCagnotteEvent ? "success" : 
                    "tertiary"
                  }>
                    {event.isClue ? "Indice" : 
                     event.isCagnotteEvent ? "Cagnotte" : 
                     "Bar retiré"}
                  </IonBadge>
                </IonItem>
                
                <IonItemOptions side="end">
                  <IonItemOption color="tertiary" onClick={() => handleCopyEvent(event.content)}>
                    <IonIcon slot="icon-only" icon={copyOutline} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </div>

      {/* FAB pour ajouter un nouvel indice */}
      {!showClueForm && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="add-clue-fab">
          <IonFabButton onClick={() => setShowClueForm(true)} size="small" color="primary">
            <IonIcon icon={addCircle} />
          </IonFabButton>
        </IonFab>
      )}

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
    </div>
  );
};

export default NotificationsTabContent; 