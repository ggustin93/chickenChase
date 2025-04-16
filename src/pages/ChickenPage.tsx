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
    sendMessage: sendGameMessage,
    hideChicken
  } = useChickenGameState();

  // UI state
  const [activeTab, setActiveTab] = useState('map');
  const [showSelectBarModal, setShowSelectBarModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handler for changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Fonction pour déterminer le titre en fonction de l'onglet actif
  const getTabTitle = () => {
    switch (activeTab) {
      case 'map':
        return 'Carte';
      case 'challenges':
        return 'Défis';
      case 'chat':
        return 'Newsfeed';
      case 'teams':
        return 'Équipes';
      default:
        return 'Vue Poulet';
    }
  };

  // Handler for sending a clue to all teams
  const handleSendClue = (clueText: string) => {
    // Using photoUrl in a real implementation would send it with the clue
    sendClue(clueText);
    setToastMessage(`Indice envoyé à toutes les équipes: "${clueText}"`);
    setShowToast(true);
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

  // Handler for when chicken hides
  const handleHideChicken = () => {
    if (gameState.currentBar) {
      hideChicken(); // This updates gameState.isChickenHidden to true and resets timers
      setToastMessage(`Vous êtes maintenant caché à ${gameState.currentBar.name}! La chasse commence !`);
      setShowToast(true);
    } else {
      setToastMessage('Veuillez sélectionner un bar avant de vous cacher.');
      setShowToast(true);
    }
  };

  // Handler for bar removal (as hint)
  const handleRemoveBar = (barId: string) => {
    if (!gameState.isChickenHidden) {
      setToastMessage("Vous devez d'abord vous cacher avant de donner des indices.");
      setShowToast(true);
      return;
    }

    // Find the bar to make sure it's not the current one
    const barToRemove = gameState.barOptions.find(b => b.id === barId);
    
    if (barToRemove) {
      if (gameState.currentBar && barToRemove.id === gameState.currentBar.id) {
        setToastMessage("Vous ne pouvez pas retirer votre propre cachette!");
        setShowToast(true);
        return;
      }

      // Create a notification message
      sendClue(`Le poulet ne se cache PAS au bar "${barToRemove.name}"`);
      
      // Here you'd typically call an API to remove the bar from options
      // For now, just show a toast
      setToastMessage(`Bar "${barToRemove.name}" retiré comme indice!`);
      setShowToast(true);
    }
  };

  // Handler for sending a notification
  const handleSendNotification = (content: string, type: 'clue' | 'barRemoval' | 'cagnotteEvent') => {
    if (type === 'clue') {
      sendClue(content);
    } else if (type === 'barRemoval') {
      sendGameMessage(content);
    } else if (type === 'cagnotteEvent') {
      sendGameMessage(content);
    }
    
    setToastMessage('Notification envoyée!');
    setShowToast(true);
  };

  // Handler for pot consumption
  const handleCagnotteConsumption = (amount: number, reason: string) => {
    if (!gameState.isChickenHidden) {
      setToastMessage("Vous devez d'abord vous cacher avant d'utiliser la cagnotte.");
      setShowToast(true);
      return;
    }

    // Create a notification message
    sendGameMessage(`💰 Le poulet a dépensé ${amount}€ de la cagnotte${reason ? ` pour "${reason}"` : ''}.`);
    
    // Here you'd typically call an API to update the cagnotte amount
    // For now, just show a toast
    setToastMessage(`${amount}€ utilisés de la cagnotte!`);
    setShowToast(true);
  };

  return (
    <IonPage className="chicken-page">
      <IonHeader>
        <IonToolbar color="warning" className="chicken-header">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle color="light" className="ion-text-center page-title">{getTabTitle()}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen scrollY={activeTab !== 'map'} className="chicken-content">
        {/* The active tab content */}
        {activeTab === 'map' && (
          <MapTabContent 
            gameState={gameState}
            onOpenSelectBarModal={() => setShowSelectBarModal(true)}
            onHideChicken={handleHideChicken}
            onRemoveBar={handleRemoveBar}
            onSendNotification={handleSendNotification}
            onCagnotteConsumption={handleCagnotteConsumption}
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
            messages={gameState.messages}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            onSendClue={handleSendClue}
            isChickenPage={true}
          />
        )}
        
        {activeTab === 'teams' && (
          <TeamsTabContent 
            gameState={gameState}
            markTeamFound={handleMarkTeamFound}
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