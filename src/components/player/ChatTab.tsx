import React from 'react';
import { IonFooter, IonToolbar, IonInput, IonButton, IonIcon } from '@ionic/react';
import { sendOutline } from 'ionicons/icons';
import ChatMessageList from '../ChatMessageList';
import { Message } from '../../data/types';

interface ChatTabProps {
  messages: Message[];
  currentTeamName: string;
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

const ChatTab: React.FC<ChatTabProps> = ({ 
  messages, 
  currentTeamName, 
  newMessage, 
  onMessageChange, 
  onSendMessage 
}) => {
  return (
    <>
      {/* Use the ChatMessageList component */}
      <ChatMessageList messages={messages} currentTeamName={currentTeamName} />

      {/* Input Footer */}
      <IonFooter>
        <IonToolbar className="chat-input-toolbar">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              onSendMessage(); 
            }} 
            className="flex items-center p-2 gap-2"
          >
            <IonInput
              placeholder="Votre message..."
              value={newMessage}
              onIonChange={(e) => onMessageChange(e.detail.value || '')}
              className="flex-1 bg-light rounded-full px-3"
              clearInput
            />
            <IonButton
              type="submit"
              fill="clear"
              disabled={!newMessage.trim()}
              className="send-button"
              shape="round"
            >
              <IonIcon slot="icon-only" icon={sendOutline} color="primary" />
            </IonButton>
          </form>
        </IonToolbar>
      </IonFooter>
    </>
  );
};

export default ChatTab; 