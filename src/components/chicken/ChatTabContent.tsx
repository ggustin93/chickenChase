import React, { useState } from 'react';
import {
  IonFooter,
  IonToolbar,
  IonInput,
  IonButton,
  IonIcon,
  IonCardTitle,
  IonTextarea,
  IonText,
  IonActionSheet,
  IonSkeletonText,
  IonToast,
  IonFab,
  IonFabButton,
  IonModal,
  IonContent,
  IonHeader,
  IonButtons,
  IonRippleEffect
} from '@ionic/react';
import { 
  sendOutline, 
  imageOutline, 
  cameraOutline, 
  closeCircle,
  bulbOutline,
  close
} from 'ionicons/icons';
import { Message } from '../../data/types';
import ChatMessageList from '../ChatMessageList';
import { useCamera } from '../../hooks/useCamera';
import './ChatTabContent.css'; // Assurez-vous de créer ce fichier CSS

interface ChatTabContentProps {
  messages: Message[];
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onSendClue?: (clueText: string, photoUrl?: string) => void; // Nouvelle prop pour envoyer des indices
  isChickenPage?: boolean; // Prop pour déterminer si on est sur ChickenPage
}

const ChatTabContent: React.FC<ChatTabContentProps> = ({
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onSendClue,
  isChickenPage = false
}) => {
  // États pour la fonctionnalité d'indices
  const [newClue, setNewClue] = useState('');
  const [showClueForm, setShowClueForm] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { photo, takePhoto } = useCamera();
  
  // Fonctions pour la gestion des indices
  const handleSendClue = async () => {
    if (newClue.trim() && onSendClue) {
      setIsSubmitting(true);
      try {
        await onSendClue(newClue, photo?.webviewPath);
        setToastMessage('Indice envoyé avec succès!');
        setShowToast(true);
        
        // Attendre plus longtemps avant de fermer le formulaire et de réinitialiser les champs
        setTimeout(() => {
          setNewClue('');
          setShowClueForm(false);
          setIsSubmitting(false); // Réinitialiser après l'envoi réussi
        }, 1000); // Augmenté à 1 seconde
      } catch (error) {
        console.error('Error sending clue', error);
        setToastMessage('Erreur lors de l\'envoi de l\'indice');
        setShowToast(true);
        setIsSubmitting(false); // Important : réinitialiser seulement en cas d'erreur
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
    takePhoto().then(() => takePhoto()).catch(console.error);
  };
  
  return (
    <>
      {/* Structure simple comme dans ChatTab.tsx */}
      <ChatMessageList messages={messages} />
      
      {/* Bouton flottant pour ajouter un indice (uniquement visible en mode poulet) */}
      {isChickenPage && onSendClue && !showClueForm && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ bottom: '80px', right: '16px' }}>
          <IonFabButton 
            color="warning" 
            onClick={() => setShowClueForm(true)}
            className="clue-fab-button drop-shadow-md transition-all duration-300 ease-in-out"
          >
            <IonIcon icon={bulbOutline} />
          </IonFabButton>
        </IonFab>
      )}
      
      {/* Modal pour l'ajout d'indices (modern iOS look) */}
      <IonModal 
        isOpen={isChickenPage && showClueForm && !!onSendClue} 
        onDidDismiss={() => setShowClueForm(false)}
        className="clue-modal"
        initialBreakpoint={0.75}
        breakpoints={[0, 0.5, 0.75, 1]}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="end">
              <IonButton 
                onClick={() => setShowClueForm(false)}
                fill="clear"
                color="medium"
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonCardTitle className="px-4 py-2 text-xl font-semibold">
              Nouvel indice
            </IonCardTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div className="flex flex-col space-y-4">
            {/* Zone de texte simplifiée */}
            <div className="relative clue-textarea-container">
              <IonTextarea
                value={newClue}
                onIonChange={e => setNewClue(e.detail.value || '')}
                placeholder="Saisissez votre indice ici..."
                autoGrow={true}
                maxlength={150}
                rows={4}
                className="clue-textarea w-full p-3 rounded-xl border border-medium-tint focus:border-warning transition-all duration-200 shadow-sm"
                clearOnEdit={false}
              />
              {/* Compteur de caractères */}
              <div className="absolute bottom-2 right-3">
                <IonText 
                  color={
                    newClue.length > 120 
                      ? "warning" 
                      : newClue.length > 0 
                        ? "medium" 
                        : "light"
                  } 
                  className="text-xs font-semibold"
                >
                  {newClue.length}/150
                </IonText>
              </div>
            </div>
            
            {/* Aperçu de photo avec animations */}
            {photo?.webviewPath && (
              <div className="relative rounded-xl overflow-hidden shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                <img 
                  src={photo.webviewPath} 
                  alt="Aperçu" 
                  className="w-full h-48 object-cover"
                />
                <IonButton 
                  fill="solid" 
                  color="danger" 
                  size="small"
                  className="absolute top-2 right-2 remove-photo-button"
                  onClick={handleClearPhoto}
                >
                  <IonIcon icon={closeCircle} />
                </IonButton>
              </div>
            )}
            
            {/* Bouton d'ajout de photo avec effet ripple - Structure simplifiée */}
            <div 
              className="ion-activatable relative overflow-hidden rounded-lg border-2 border-dashed border-medium-tint p-4 text-center cursor-pointer flex justify-center items-center hover:bg-light-shade transition-all duration-200"
              onClick={() => setShowPhotoOptions(true)}
            >
              <IonRippleEffect />
              <IonIcon icon={imageOutline} className="mr-2 text-xl text-medium" />
              <IonText color="medium">
                {photo?.webviewPath ? 'Changer la photo' : 'Ajouter une photo'}
              </IonText>
            </div>
            
            {/* Actions avec boutons bien distingués */}
            <div className="flex justify-between items-center mt-4 gap-3">
              <IonButton 
                expand="block"
                fill="outline" 
                color="medium"
                className="flex-1 h-12 rounded-lg font-medium text-sm"
                onClick={() => setShowClueForm(false)}
              >
                Annuler
              </IonButton>
              
              <IonButton 
                expand="block"
                fill="solid" 
                color="warning"
                className="flex-1 h-12 rounded-lg font-semibold shadow-md transition-all duration-200 text-sm"
                disabled={!newClue.trim() || isSubmitting}
                onClick={handleSendClue}
              >
                {isSubmitting ? (
                  <IonSkeletonText animated style={{ width: '80px', height: '24px' }} />
                ) : (
                  <>
                    <IonIcon icon={sendOutline} slot="start" />
                    Envoyer
                  </>
                )}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
      
      {/* Input pour message normal - Ne pas afficher si c'est la page du Poulet */}
      {!isChickenPage && (
        <IonFooter className="chat-footer ion-no-border shadow-top">
          <IonToolbar className="px-2 py-1">
            <IonInput
              value={newMessage}
              placeholder="Envoyer un message..."
              onIonChange={e => onNewMessageChange(e.detail.value || '')}
              className="chat-input rounded-full bg-light px-4"
              enterkeyhint="send"
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  onSendMessage();
                  e.preventDefault();
                }
              }}
            />
            <IonButton 
              slot="end" 
              fill="clear" 
              color="primary"
              className="send-button"
              onClick={onSendMessage}
              disabled={!newMessage.trim()}
            >
              <IonIcon icon={sendOutline} slot="icon-only" className="text-lg" />
            </IonButton>
          </IonToolbar>
        </IonFooter>
      )}
      
      {/* Action sheet pour choisir la source de la photo */}
      <IonActionSheet
        isOpen={showPhotoOptions}
        onDidDismiss={() => setShowPhotoOptions(false)}
        header="Photo d'indice"
        cssClass="photo-action-sheet"
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
            role: 'cancel',
            cssClass: 'action-sheet-cancel'
          }
        ]}
      />
      
      {/* Toast notifications améliorées */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color="dark"
        cssClass="custom-toast"
        buttons={[
          {
            text: 'OK',
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default ChatTabContent; 