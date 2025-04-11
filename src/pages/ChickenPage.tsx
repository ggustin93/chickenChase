import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonMenuButton,
  IonButtons,
  IonToast,
  IonLoading
} from '@ionic/react';
import { 
  locationOutline, chatbubbleOutline,
  peopleOutline, ribbonOutline
} from 'ionicons/icons';

import './ChickenPage.css';

// Import custom hook
import useChickenGameState from '../hooks/useChickenGameState';

// Import extracted components
import SelectHidingSpotModal from '../components/chicken/SelectHidingSpotModal';
import MapTabContent from '../components/chicken/MapTabContent';
import ChallengesTabContent from '../components/chicken/ChallengesTabContent';
import ChatTabContent from '../components/chicken/ChatTabContent';
import CluePanel from '../components/chicken/CluePanel';

// Import team tab content
import TeamsTabContent from '../components/chicken/TeamsTabContent';

const ChickenPage: React.FC = () => {
  // Use the custom hook for game state
  const {
    gameState,
    isLoading,
    sendClue,
    handleChallengeValidation,
    markTeamFound,
    changeCurrentBar,
    sendMessage: sendGameMessage
  } = useChickenGameState();

  // UI state
  const [activeTab, setActiveTab] = useState('map');
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [showSelectBarModal, setShowSelectBarModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handler for changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowPanel(null); // Reset panels when changing tabs
  };

  // Handler for sending a clue to all teams
  const handleSendClue = (clueText: string) => {
    sendClue(clueText);
    setToastMessage(`Indice envoyé à toutes les équipes: "${clueText}"`);
    setShowToast(true);
    setShowPanel(null);
  };

  // Handler for sending a regular message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendGameMessage(newMessage);
      setNewMessage('');
    }
  };

  // Handler for changing the current bar (chicken's hiding spot)
  const handleChangeCurrentBar = (barId: string) => {
    const bar = changeCurrentBar(barId);
    if (bar) {
      setToastMessage(`Position mise à jour: ${bar.name}`);
      setShowToast(true);
    }
  };

  // Handler for marking a team as having found the chicken
  const handleMarkTeamFound = (teamId: string) => {
    markTeamFound(teamId);
    setToastMessage(`L'équipe a trouvé le poulet!`);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="warning" className="chicken-header">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle color="light" className="ion-text-center">Vue Poulet</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="ion-padding-bottom">
        {/* The active tab content */}
        {activeTab === 'map' && (
          <MapTabContent 
            gameState={gameState}
            onOpenSelectBarModal={() => setShowSelectBarModal(true)}
            onTogglePanel={setShowPanel}
          />
        )}
        
        {activeTab === 'challenges' && (
          <ChallengesTabContent 
            gameState={gameState}
            onChallengeValidation={handleChallengeValidation}
          />
        )}
        
        {activeTab === 'chat' && (
          <ChatTabContent 
            gameState={gameState}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
          />
        )}
        
        {activeTab === 'teams' && (
          <TeamsTabContent 
            gameState={gameState}
            markTeamFound={handleMarkTeamFound}
          />
        )}
        
        {/* Floating panels */}
        {showPanel === 'clue' && (
          <CluePanel 
            onClose={() => setShowPanel(null)}
            onSendClue={handleSendClue}
            previousClues={gameState.messages.filter(m => m.isClue)}
          />
        )}
        
        {/* Bar selection modal */}
        <SelectHidingSpotModal 
          isOpen={showSelectBarModal}
          barOptions={gameState.barOptions}
          currentBar={gameState.currentBar || null}
          onClose={() => setShowSelectBarModal(false)}
          onSelectBar={handleChangeCurrentBar}
        />
      </IonContent>
      
      {/* Tab bar for navigation */}
      <IonTabBar slot="bottom">
        <IonTabButton tab="map" href="#" onClick={() => handleTabChange('map')} selected={activeTab === 'map'}>
          <IonIcon icon={locationOutline} />
          <IonLabel>Carte</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="challenges" href="#" onClick={() => handleTabChange('challenges')} selected={activeTab === 'challenges'}>
          <IonIcon icon={ribbonOutline} />
          <IonLabel>Défis</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="chat" href="#" onClick={() => handleTabChange('chat')} selected={activeTab === 'chat'}>
          <IonIcon icon={chatbubbleOutline} />
          <IonLabel>Chat</IonLabel>
        </IonTabButton>
        
        <IonTabButton tab="teams" href="#" onClick={() => handleTabChange('teams')} selected={activeTab === 'teams'}>
          <IonIcon icon={peopleOutline} />
          <IonLabel>Équipes</IonLabel>
        </IonTabButton>
      </IonTabBar>
      
      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color="success"
      />
      
      {/* Loading indicator */}
      <IonLoading
        isOpen={isLoading}
        message="Chargement de la partie..."
        duration={2000}
      />
    </IonPage>
  );
};

export default ChickenPage; 