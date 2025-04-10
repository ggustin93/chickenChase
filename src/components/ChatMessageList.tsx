import React from 'react';
import { IonList, IonIcon } from '@ionic/react';
import { chatbubbleOutline } from 'ionicons/icons';
import { Message } from '../data/types'; // Adjust path if necessary
import styles from './ChatMessageList.module.css'; // Import CSS Module

interface ChatMessageListProps {
  messages: Message[];
  currentTeamName: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, currentTeamName }) => {
  // Sort messages chronologically just in case
  const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <IonList lines="none" className="chat-messages-container flex flex-col flex-1 overflow-y-auto p-3 space-y-2">
      {sortedMessages.map(message => {
        const isOwnMessage = message.sender === currentTeamName;
        const isSystemMessage = message.sender === 'Système';
        const isClue = message.isClue;

        // Determine alignment based on message type
        const itemAlignmentClass = isOwnMessage ? 'justify-end' : isSystemMessage ? 'justify-center' : 'justify-start';

        // Container for the entire row - add px-2 (horizontal padding)
        const rowStyle: React.CSSProperties = {
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : isSystemMessage ? 'center' : 'flex-start',
          marginBottom: '8px',
          width: '100%',
          paddingLeft: isOwnMessage ? '15%' : '2%', // Add space on left for own messages
          paddingRight: !isOwnMessage ? '15%' : '2%', // Add space on right for other messages
        };

        // Create inline styles for each type of bubble 
        let bubbleStyle: React.CSSProperties = {
          padding: '10px 15px',
          borderRadius: '15px',
          wordWrap: 'break-word' as 'break-word',
          maxWidth: '300px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        };

        let bubbleClasses = `${styles.chatBubble}`; // Keep module class for maintainability

        if (isOwnMessage) {
          // Your message (right side)
          bubbleStyle = {
            ...bubbleStyle,
            backgroundColor: 'var(--ion-color-primary)',
            color: 'white',
            borderBottomRightRadius: '5px',
          };
          bubbleClasses += ` bg-primary text-primary-contrast ${styles.chatBubbleOwn}`;
        } else if (isClue) {
          // Clue message (special highlight)
          bubbleStyle = {
            ...bubbleStyle,
            backgroundColor: '#3880ff', // Bleu ionique plutôt qu'orange
            color: 'white',
            borderRadius: '10px',
            border: '1px solid #3171e0', // Bordure plus foncée
          };
          bubbleClasses += ` bg-warning text-warning-contrast border border-warning-shade ${styles.chatBubbleClue}`;
        } else if (isSystemMessage) {
          // System message (centered)
          bubbleStyle = {
            ...bubbleStyle,
            backgroundColor: '#f0f0f0',
            color: '#555',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '5px 10px',
            fontSize: '0.8rem',
            borderRadius: '5px',
            width: 'fit-content',
          };
          bubbleClasses += ` bg-medium text-medium-contrast text-xs italic ${styles.chatBubbleSystem}`;
        } else {
          // Other person's message (left side)
          bubbleStyle = {
            ...bubbleStyle,
            backgroundColor: '#e5e5ea',
            color: 'black',
            borderBottomLeftRadius: '5px',
          };
          bubbleClasses += ` bg-light text-light-contrast ${styles.chatBubbleOther}`;
        }

        return (
          // Use a standard div for the message row alignment with direct styling
          <div key={message.id} style={rowStyle}>
             {/* Apply both inline styles AND module classes */}
             <div className={bubbleClasses} style={bubbleStyle}>
                 {/* Sender Name (only for other non-clue messages) */}
                 {!isOwnMessage && !isClue && !isSystemMessage && (
                   <p className="chat-sender-name text-xs font-medium mb-1 opacity-80" style={{fontSize: '0.75rem', fontWeight: 500, marginBottom: '4px', opacity: 0.8}}>
                     {message.sender}
                   </p>
                 )}
                 {/* Clue Header */}
                 {isClue && (
                   <p className="chat-sender-name text-xs font-bold mb-1 flex items-center" 
                      style={{
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        marginBottom: '4px', 
                        display: 'flex', 
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '12px',
                    }}>
                      <IonIcon icon={chatbubbleOutline} className="mr-1" /> Indice du Poulet
                   </p>
                 )}
                 {/* Message Content */}
                 <p className={`chat-content text-sm ${isSystemMessage ? 'italic' : ''}`} style={{fontSize: '0.875rem'}}>
                   {message.content}
                 </p>
                 {/* Timestamp (always show, aligned right within bubble, except for system) */}
                 {!isSystemMessage && (
                    <p className="chat-timestamp text-xs opacity-70 mt-1 text-right" style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '4px', textAlign: 'right'}}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 )}
              </div>
          </div>
        );
      })}
    </IonList>
  );
};

export default ChatMessageList; 