import React from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { bulbOutline } from 'ionicons/icons';
import { ChickenGameState, Message } from '../data/types'; // Assurez-vous que le chemin est correct
import '../pages/ChickenPage.css'; // Importer les styles globaux ou spécifiques nécessaires

interface ChatInterfaceProps {
  gameState: ChickenGameState;
  setShowPanel: (panel: string | null) => void;
  sendMessage: () => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  gameState, 
  setShowPanel, 
  sendMessage, 
  newMessage, 
  setNewMessage 
}) => {

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  // Déterminer le style et l'alignement de la bulle
  const getBubbleInfo = (message: Message) => {
    const isOwnMessage = message.userId === 'user-5'; 
    const isSystemMessage = message.sender === 'Système';
    const isClueMessage = message.isClue;

    let bubbleClass = "chat-bubble ";
    let alignmentClass = "";
    let showSenderTime = true;

    if (isOwnMessage) {
      // Priorité 1: Si c'est mon message (normal OU indice), aligner à droite
      bubbleClass += "chat-bubble-own";
      alignmentClass = "self-end";
      // Afficher "Vous" ou "Le Poulet" ? Utilisons sender pour cohérence.
      // Garder l'heure visible pour ses propres messages.
    } else {
      // Si ce n'est PAS mon message, vérifier les autres types
      if (isSystemMessage) {
        bubbleClass += "chat-bubble-system";
        alignmentClass = "self-center";
        showSenderTime = false; // Pas de sender/time pour système
      } else if (isClueMessage) {
        // Indices des autres (si applicable), à gauche avec style clue
        bubbleClass += "chat-bubble-clue";
        alignmentClass = "self-start";
      } else {
        // Messages des autres, à gauche
        bubbleClass += "chat-bubble-other";
        alignmentClass = "self-start";
      }
    }
    
    return { bubbleClass, alignmentClass, isSystemMessage, isClueMessage, showSenderTime };
  };

  return (
    <>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="page-title">Chat de partie</IonTitle>
          <IonButtons slot="end">
            <IonButton color="primary" onClick={() => setShowPanel('clue')}>
              <IonIcon slot="icon-only" icon={bulbOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {/* Bannière pour envoyer un indice SUPPRIMÉE */}
        {/* 
        <IonItem lines="none" className="clue-banner">
          <IonIcon icon={alertCircleOutline} color="warning" slot="start" />
          <IonLabel>
            <p>Envoyez des indices</p>
            <p>aux équipes</p>
          </IonLabel>
          <IonButton 
            size="small"
            color="warning"
            className="clue-banner-button"
            onClick={() => setShowPanel('clue')}
            slot="end"
          >
            Nouvel indice
          </IonButton>
        </IonItem>
        */}
        
        {/* Liste des messages */}
        <div className="chat-messages-container">
          {gameState.messages.map(message => {
            // Utiliser showSenderTime retourné par getBubbleInfo
            const { bubbleClass, alignmentClass, isSystemMessage, isClueMessage, showSenderTime } = getBubbleInfo(message);
            
            return (
              <div 
                key={message.id} 
                className={`chat-message-wrapper ${alignmentClass}`}
              >
                {/* Afficher sender/time seulement si showSenderTime est vrai */}
                {showSenderTime && (
                  <div 
                    className="chat-sender-time" 
                    style={{ textAlign: alignmentClass === 'self-end' ? 'right' : 'left' }}
                  >
                     {/* Optionnel: Ne pas montrer le sender pour ses propres messages ? */}
                     {/* {alignmentClass !== 'self-end' ? message.sender : ''} {formatTime(message.timestamp)} */}
                     {message.sender} {formatTime(message.timestamp)} 
                  </div>
                )}
                <div className={bubbleClass}>
                  <div>{message.content}</div>
                  {/* Le badge Indice s'affiche même dans les bulles alignées à droite si isClue est vrai */}
                  {isClueMessage && (
                    <div className="badge-indice">
                      <IonIcon icon={bulbOutline} size="small" /> 
                      <span>Indice</span>
                    </div>
                  )}
                </div>
                 {isSystemMessage && (
                   <div className="chat-system-time">
                     Système {formatTime(message.timestamp)}
                   </div>
                 )}
              </div>
            );
          })}
        </div>
      </IonContent>
      
      {/* Footer pour l'input - SUPPRIMÉ d'ici */}
      {/* 
      <IonFooter>
        <IonToolbar className="chat-input-toolbar">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="chat-input-form">
            <IonInput
              placeholder="Message..."
              value={newMessage}
              onIonChange={(e) => setNewMessage(e.detail.value || '')}
              className="chat-input"
            />
            <IonButton
              type="submit"
              fill="clear"
              disabled={!newMessage.trim()}
              className="send-button"
            >
              <IonIcon slot="icon-only" icon={sendOutline} />
            </IonButton>
          </form>
        </IonToolbar>
      </IonFooter>
      */}
    </>
  );
};

export default ChatInterface; 