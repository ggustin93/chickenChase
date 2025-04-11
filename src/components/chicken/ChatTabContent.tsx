import React from 'react';
import {
  IonFooter,
  IonToolbar,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/react';
import { sendOutline } from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import ChatMessageList from '../ChatMessageList';

interface ChatTabContentProps {
  gameState: ChickenGameState;
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

const ChatTabContent: React.FC<ChatTabContentProps> = ({
  gameState,
  newMessage,
  onNewMessageChange,
  onSendMessage
}) => (
  <>
    <ChatMessageList 
      messages={gameState.messages} 
      currentTeamName="Vous"
    />
    
    <IonFooter className="chat-footer">
      <IonToolbar>
        <IonInput
          value={newMessage}
          placeholder="Envoyer un message..."
          onIonChange={e => onNewMessageChange(e.detail.value || '')}
          className="chat-input"
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
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
        >
          <IonIcon icon={sendOutline} slot="icon-only" />
        </IonButton>
      </IonToolbar>
    </IonFooter>
  </>
);

export default ChatTabContent; 