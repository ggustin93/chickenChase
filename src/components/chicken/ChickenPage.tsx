import React, { useState } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonLoading } from '@ionic/react';
import { useChickenGameState } from '../../hooks/useChickenGameState';
import MapTabContent from './MapTabContent';
import ChatTabContent from './ChatTabContent';
import ChallengesTabContent from './ChallengesTabContent';
import './ChickenPage.css';

enum ChickenTab {
  Map = 'map',
  Chat = 'chat',
  Challenges = 'challenges',
}

const ChickenPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ChickenTab>(ChickenTab.Map);
  const { 
    gameState, 
    isLoading, 
    sendClue,
    hideChicken,
    handleChallengeValidation,
    addChallenge
  } = useChickenGameState();

  const renderTabContent = () => {
    switch (activeTab) {
      case ChickenTab.Map:
        return (
          <MapTabContent 
            gameState={gameState} 
            onHideChicken={hideChicken}
          />
        );
      case ChickenTab.Chat:
        return (
          <ChatTabContent
            messages={gameState.messages}
            newMessage=""
            onNewMessageChange={() => {}}
            onSendMessage={() => {}}
            onSendClue={sendClue}
            isChickenPage={true}
          />
        );
      case ChickenTab.Challenges:
        return (
          <ChallengesTabContent 
            gameState={gameState} 
            handleChallengeValidation={handleChallengeValidation}
            addChallenge={addChallenge}
          />
        );
      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/games" />
          </IonButtons>
          <IonTitle>Le Poulet</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as ChickenTab)}>
            <IonSegmentButton value={ChickenTab.Map}>
              <IonLabel>Carte</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={ChickenTab.Chat}>
              <IonLabel>Chat</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value={ChickenTab.Challenges}>
              <IonLabel>Défis</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonLoading isOpen={isLoading} message="Chargement du jeu..." />
        {!isLoading && renderTabContent()}
      </IonContent>
    </IonPage>
  );
};

export default ChickenPage; 