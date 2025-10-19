import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
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
  IonLoading,
  IonButton,
  IonSpinner
} from '@ionic/react';
import { 
  locationOutline, chatbubbleOutline,
  peopleOutline, ribbonOutline, cashOutline, warningOutline
} from 'ionicons/icons';

import './ChickenPage.css';

// Import custom hooks
import useChickenGameState from '../hooks/useChickenGameState';
import { useRealtimeCagnotte } from '../hooks/useRealtimeCagnotte';

// Import services
import { messageService } from '../services';

// Import extracted components
import SelectHidingSpotModal from '../components/chicken/SelectHidingSpotModal';
import MapTabContent from '../components/chicken/MapTabContent';
import ChallengesTabContent from '../components/chicken/ChallengesTabContent';
import ChatTabContent from '../components/chicken/ChatTabContent';
import TeamsTabContent from '../components/chicken/TeamsTabContent';
import FinishGameButton from '../components/chicken/FinishGameButton';
import SimpleCagnotteActions from '../components/cagnotte/SimpleCagnotteActions';

const ChickenPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { session } = useSession();

  // PWA navigation hack removed - replaced with defensive rendering patterns

  // Use the custom hook for game state
  const {
    gameState,
    isLoading,
    error,
    sendClue,
    handleChallengeValidation,
    markTeamFound,
    changeCurrentBar,
    sendMessage: sendGameMessage,
    hideChicken,
    finishGame
  } = useChickenGameState(gameId);

  // Real-time cagnotte management - stays active across all tabs
  const {
    current: cagnotteCurrentCents,
    initial: cagnotteInitialCents,
    loading: cagnotteLoading,
    error: cagnotteError,
    updateCagnotte,
    resetCagnotte,
    quickOperation,
    transactions
  } = useRealtimeCagnotte(gameId);

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
      case 'cagnotte':
        return 'Cagnotte';
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
  const handleChangeCurrentBar = async (barId: string) => {
    const bar = await changeCurrentBar(barId);
    if (bar) {
      setToastMessage(`Position mise à jour: ${bar.name}`);
      setShowToast(true);
      setShowSelectBarModal(false); // Fermer le modal après sélection
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
  const handleCagnotteConsumption = async (amount: number, reason: string) => {
    if (!gameState.isChickenHidden) {
      setToastMessage("Vous devez d'abord vous cacher avant d'utiliser la cagnotte.");
      setShowToast(true);
      return;
    }

    if (!gameId) {
      setToastMessage("Erreur: ID de partie manquant.");
      setShowToast(true);
      return;
    }

    try {
      // Create a notification message in the database for all players to see
      const messageContent = `💰 Le poulet a dépensé ${amount}€ de la cagnotte${reason ? ` pour "${reason}"` : ''}.`;
      
      // Save the message to database so all players can see it in their chat
      const result = await messageService.createSystemMessage(gameId, messageContent, {
        isCagnotteEvent: true,
        amount: amount * 100 // Convert to cents for database storage
      });

      if (result.success) {
        // Also add to local state for immediate UI update
        sendGameMessage(messageContent);
        setToastMessage(`${amount}€ utilisés de la cagnotte!`);
      } else {
        console.error('Failed to create cagnotte message:', result.error);
        setToastMessage('Erreur lors de la notification de dépense.');
      }
    } catch (error) {
      console.error('Error creating cagnotte message:', error);
      setToastMessage('Erreur lors de la notification de dépense.');
    }
    
    setShowToast(true);
  };

  // Effect to notify when bars are loaded from database
  React.useEffect(() => {
    console.log('🔧 DEBUG: gameState.barOptions:', gameState.barOptions);
    console.log('🔧 DEBUG: gameState.barOptions.length:', gameState.barOptions.length);
    console.log('🔧 DEBUG: error:', error);
    
    if (gameState.barOptions.length > 0 && !error) {
      const databaseBarsCount = gameState.barOptions.length;
      console.log(`✅ ${databaseBarsCount} bars loaded from Supabase database`);
    } else if (gameState.barOptions.length === 0) {
      console.log('⚠️ No bars found in gameState.barOptions');
    }
  }, [gameState.barOptions, error]);

  // --- Defensive Rendering for PWA Stability ---  
  // Loading state - prevent white screen during game data fetch
  if (isLoading) {
    return (
      <IonPage className="chicken-page">
        <IonHeader>
          <IonToolbar color="warning">
            <IonTitle className="ion-text-center">Chargement...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <IonSpinner name="crescent" color="warning" />
            <p style={{ color: 'var(--ion-color-medium)', fontSize: '1.1rem' }}>
              Chargement de votre partie poulet...
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Error boundary - handle any critical errors
  if (!gameState || !gameId || error) {
    return (
      <IonPage className="chicken-page">
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle className="ion-text-center">Erreur</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <IonIcon 
              icon={warningOutline} 
              style={{ fontSize: '4rem', color: 'var(--ion-color-danger)' }} 
            />
            <h2 style={{ color: 'var(--ion-color-danger)' }}>
              Impossible de charger la partie
            </h2>
            <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center', maxWidth: '300px' }}>
              {!gameId ? 'ID de partie manquant' : 
               error ? `Erreur lors du chargement: ${error}` :
               'Erreur lors du chargement des données de la partie'}
            </p>
            <IonButton 
              color="primary" 
              routerLink="/home"
              style={{ marginTop: '10px' }}
            >
              Retour à l'accueil
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="chicken-page">
      <IonHeader>
        <IonToolbar color="warning" className="chicken-header">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle color="light" className="ion-text-center page-title">{getTabTitle()}</IonTitle>
          <IonButtons slot="end">
            <FinishGameButton 
              onFinishGame={finishGame}
              isChickenHidden={gameState.isChickenHidden || false}
            />
          </IonButtons>
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
        
        {activeTab === 'cagnotte' && (
          <div className="cagnotte-tab-content">
            <SimpleCagnotteActions 
              gameId={gameId!}
              playerId={session.playerId || 'unknown'}
              currentAmount={cagnotteCurrentCents}
              loading={cagnotteLoading}
              error={cagnotteError}
              quickOperation={quickOperation}
            />
          </div>
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
        
        <IonTabButton tab="cagnotte" href="#" onClick={() => handleTabChange('cagnotte')} selected={activeTab === 'cagnotte'}>
          <IonIcon icon={cashOutline} />
          <IonLabel>Cagnotte</IonLabel>
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