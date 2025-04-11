import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonTextarea,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonAvatar,
  IonChip
} from '@ionic/react';
import { closeOutline, sendOutline, bulbOutline } from 'ionicons/icons';
import { Message } from '../../data/types';

interface CluePanelProps {
  onClose: () => void;
  onSendClue: (clueText: string) => void;
  previousClues: Message[];
}

const CluePanel: React.FC<CluePanelProps> = ({ onClose, onSendClue, previousClues }) => {
  const [clueText, setClueText] = useState('');
  const [isSendingClue, setIsSendingClue] = useState(false);
  
  const handleSendClue = () => {
    if (clueText.trim()) {
      setIsSendingClue(true);
      
      // In a real app, we would send the clue to a server here
      setTimeout(() => {
        onSendClue(clueText);
        setClueText('');
        setIsSendingClue(false);
      }, 1000);
    }
  };
  
  const clueExamples = [
    "Je suis dans un bar avec un nom d'animal",
    "Je suis près d'une station de métro",
    "Le bar où je me trouve a une façade rouge",
    "Je suis dans un quartier historique"
  ];
  
  const filteredClues = previousClues.filter(message => message.isClue);
  
  return (
    <IonCard className="slide-in-panel">
      <IonCardHeader>
        <div className="flex justify-between items-center">
          <IonCardTitle className="panel-title">
            <IonIcon icon={bulbOutline} className="panel-icon" />
            Envoyer un indice
          </IonCardTitle>
          <IonButton fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} slot="icon-only" />
          </IonButton>
        </div>
      </IonCardHeader>
      
      <IonCardContent>
        <p className="panel-description">
          Envoyez un indice à toutes les équipes pour les aider à vous trouver. 
          L'indice sera envoyé sous forme de message spécial dans le chat.
        </p>
        
        <IonTextarea
          value={clueText}
          placeholder="Votre indice ici... (ex: Je suis dans un bar avec une terrasse)"
          onIonChange={e => setClueText(e.detail.value || '')}
          rows={4}
          className="clue-textarea"
        />
        
        <IonButton 
          expand="block" 
          color="warning"
          disabled={!clueText.trim() || isSendingClue}
          onClick={handleSendClue}
          className="mt-4 mb-4"
        >
          <IonIcon slot="start" icon={sendOutline} />
          {isSendingClue ? 'Envoi en cours...' : 'Envoyer l\'indice à toutes les équipes'}
        </IonButton>
        
        <div className="examples-section">
          <h3>Exemples d'indices</h3>
          <div className="example-chips">
            {clueExamples.map((example, index) => (
              <IonChip 
                key={index} 
                color="tertiary" 
                outline 
                onClick={() => setClueText(example)}
              >
                {example}
              </IonChip>
            ))}
          </div>
        </div>
        
        {filteredClues.length > 0 && (
          <div className="previous-clues mt-4">
            <h3>Indices précédents</h3>
            <IonList>
              {filteredClues.map((clue) => (
                <IonItem key={clue.id}>
                  <IonAvatar slot="start" className="small-avatar">
                    <IonIcon icon={bulbOutline} color="warning" className="avatar-icon" />
                  </IonAvatar>
                  <IonLabel className="ion-text-wrap">
                    <p className="timestamp">{clue.timestamp}</p>
                    <h2>{clue.content}</h2>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default CluePanel; 