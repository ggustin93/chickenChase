import React, { useMemo } from 'react';
import { 
  IonList, 
  IonIcon, 
  IonImg,
  IonText,
  IonChip,
  IonLabel,
  IonAvatar
} from '@ionic/react';
import { 
  chatbubbleOutline, 
  trophyOutline, 
  cashOutline, 
  closeCircleOutline, 
  notificationsOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { Message } from '../data/types';
import styles from './ChatMessageList.module.css';
import chickenLogo from '../assets/images/logo.png'; // Importer le logo du poulet

interface ChatMessageListProps {
  messages: Message[];
  currentTeamName?: string; // Optional prop for the current team name
}

// Type pour les messages regroupés par date
type MessageGroups = Record<string, Message[]>;

// Composant pour l'en-tête d'un message
interface MessageHeaderProps {
  icon: string;
  text: string;
  color?: string;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ icon, text, color = 'medium' }) => (
  <IonChip 
    className="my-1 rounded-md px-2 py-1 flex items-center" 
    color={color as "primary" | "secondary" | "tertiary" | "success" | "warning" | "danger" | "medium" | "light" | "dark"}
    outline={true}
  >
    <IonIcon icon={icon} className="mr-1" />
    <IonLabel className="text-xs font-semibold">{text}</IonLabel>
  </IonChip>
);

// Composant pour le timestamp
interface TimestampProps {
  timestamp: string;
  isDark?: boolean;
}

const Timestamp: React.FC<TimestampProps> = ({ timestamp, isDark = false }) => (
  <IonText 
    className={`text-xs ${isDark ? 'text-white opacity-80' : 'text-gray-500'} float-right mt-1`}
    color="medium"
  >
    {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </IonText>
);

// Composant pour l'avatar du poulet
const ChickenAvatar: React.FC = () => (
  <div className={styles.avatarContainer}>
    <IonAvatar className={styles.chickenAvatar}>
      <img src={chickenLogo} alt="Le Poulet" />
    </IonAvatar>
  </div>
);

// Provide a default empty array for messages
const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages = [], currentTeamName }) => {
  // Trier et regrouper les messages par date
  const messagesByDate = useMemo(() => {
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedMessages.reduce((groups, message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {} as MessageGroups);
  }, [messages]);

  return (
    <IonList lines="none" className="chat-messages-container flex flex-col flex-1 overflow-y-auto p-3 space-y-2">
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <React.Fragment key={date}>
          {/* Optionally add date separator */}
          {/* <div className="text-center text-xs bg-gray-100 text-gray-500 rounded-full py-1 px-3 mx-auto my-2">{date}</div> */}
          
          {dateMessages.map(message => {
            const isSystemMessage = message.sender === 'Système';
            const isClue = message.isClue;
            const isCagnotteEvent = message.isCagnotteEvent;
            const isBarRemoval = message.isBarRemoval;
            const isRanking = isSystemMessage && message.content.includes('classement');
            const isChallengeCompletion = isSystemMessage && message.content.includes('complété le défi');
            const hasPhoto = Boolean(message.photoUrl);
            const isCurrentTeam = currentTeamName && message.sender === currentTeamName;
            
            // Déterminer l'icône et la couleur en fonction du type de message
            let icon = notificationsOutline;
            let headerColor = 'medium';
            let headerText = 'Notification';
            
            if (isClue) {
              icon = chatbubbleOutline;
              headerText = 'Indice du Poulet';
              headerColor = 'primary';
            } else if (isCagnotteEvent) {
              icon = cashOutline;
              headerText = 'Cagnotte';
              headerColor = 'warning';
            } else if (isBarRemoval) {
              icon = closeCircleOutline;
              headerText = 'Bar retiré';
              headerColor = 'danger';
            } else if (isRanking) {
              icon = trophyOutline;
              headerText = 'Classement';
              headerColor = 'success';
            } else if (isChallengeCompletion) {
              icon = alertCircleOutline;
              headerText = 'Défi complété';
              headerColor = 'tertiary';
            }

            // Classer le message pour le CSS et les classes Tailwind
            const bubbleClassNames = [styles.chatBubble];
            let containerClasses = "w-full mb-3"; // Increased bottom margin for avatar
            
            if (isClue) {
              bubbleClassNames.push(styles.chatBubbleClue);
              containerClasses += " flex items-start pl-2 pr-16";
            } else if (isSystemMessage) {
              bubbleClassNames.push(styles.whatsAppSystem);
              containerClasses += " flex justify-center";
              
              if (isCagnotteEvent) bubbleClassNames.push(styles.chatBubbleCagnotte);
              else if (isBarRemoval) bubbleClassNames.push(styles.chatBubbleBarRemoval);
              else if (isRanking) bubbleClassNames.push(styles.chatBubbleRanking);
              else if (isChallengeCompletion) bubbleClassNames.push(styles.chatBubbleChallenge);
              else bubbleClassNames.push(styles.chatBubbleSystem);
            } else {
              // Regular user message
              containerClasses += isCurrentTeam ? " flex justify-end" : " flex justify-start";
            }

            return (
              <div key={message.id} className={containerClasses}>
                {/* Avatar du poulet pour les messages d'indices */}
                {isClue && <ChickenAvatar />}
                
                <div className={bubbleClassNames.join(' ')}>
                  {/* Messages du poulet n'ont pas besoin de l'en-tête avec "Indice du Poulet" 
                      puisque l'avatar le montre clairement */}
                  {!isClue && isSystemMessage && (
                    <MessageHeader 
                      icon={icon} 
                      text={headerText} 
                      color={headerColor} 
                    />
                  )}
                  
                  {/* Photo du message si présente */}
                  {hasPhoto && (
                    <div className={styles.messagePhoto}>
                      <IonImg 
                        src={message.photoUrl} 
                        className={styles.cluePhoto}
                      />
                    </div>
                  )}
                  
                  {/* Contenu du message */}
                  <IonText color={isClue ? "light" : "dark"} className="block mt-1">
                    {message.content}
                  </IonText>
                  
                  {/* Timestamp - style WhatsApp */}
                  <Timestamp 
                    timestamp={message.timestamp} 
                    isDark={isClue} 
                  />
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </IonList>
  );
};

export default ChatMessageList; 