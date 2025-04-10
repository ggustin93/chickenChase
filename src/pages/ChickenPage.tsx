import React, { useState, useEffect } from 'react';
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
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonAvatar,
  IonChip,
  IonFooter,
  IonToggle,
  IonMenuButton,
  IonButtons,
  IonThumbnail,
  IonModal,
  IonSearchbar,
  IonToast,
  IonLoading,
  IonText,
} from '@ionic/react';

import { 
  timeOutline, locationOutline, chatbubbleOutline,
  peopleOutline, checkmarkCircleOutline, closeCircleOutline, imageOutline, sendOutline,
  chevronDownOutline, ribbonOutline,
  closeOutline,
  createOutline, createSharp,
  timerOutline,
  bulbOutline, trophyOutline,
} from 'ionicons/icons';

import './ChickenPage.css';

import { ChickenGameState, Bar } from '../data/types';
import { mockChickenGameState } from '../data/mock/mockData';

import ChatMessageList from '../components/ChatMessageList';
import GameMap from '../components/GameMap';
import TeamsTabContent from '../components/TeamsTabContent';

interface SelectHidingSpotModalProps {
  isOpen: boolean;
  barOptions: Bar[];
  currentBar: Bar | null;
  onClose: () => void;
  onSelectBar: (barId: string) => void;
}

const SelectHidingSpotModal: React.FC<SelectHidingSpotModalProps> = (
  { isOpen, barOptions, currentBar, onClose, onSelectBar }
) => {
  const [searchTextModal, setSearchTextModal] = useState('');

  const filteredBars = barOptions.filter(bar => 
    !searchTextModal || bar.name.toLowerCase().includes(searchTextModal.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTextModal('');
    }
  }, [isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Choisir ma cachette</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Rechercher un bar..."
            value={searchTextModal}
            onIonChange={e => setSearchTextModal(e.detail.value || '')}
            className="modal-search-bar"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="full">
          {filteredBars.map(bar => {
            const isCurrent = currentBar?.id === bar.id;
            return (
              <IonItem 
                key={bar.id} 
                button 
                onClick={() => {
                  onSelectBar(bar.id);
                  onClose();
                }}
                detail={false} 
                color={isCurrent ? 'light' : undefined}
              >
                <IonThumbnail slot="start" className="bar-thumbnail-modal">
                  <img 
                    alt={bar.name} 
                    src={bar.photoUrl || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'} 
                    onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/thumbnail.svg')} 
                  />
                </IonThumbnail>
                <IonLabel className="ion-text-wrap">
                  <h2 className={isCurrent ? 'font-bold' : ''}>{bar.name}</h2> 
                  <p className="text-xs text-medium">{bar.address}</p>
                </IonLabel>
                {isCurrent && (
                  <IonIcon slot="end" icon={checkmarkCircleOutline} color="success" />
                )}
              </IonItem>
            );
          })}
          {filteredBars.length === 0 && (
            <IonItem lines="none">
              <IonLabel className="ion-text-center ion-padding">
                <p className="text-medium">Aucun bar correspondant trouvé.</p>
              </IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

const ChickenPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [showSelectBarModal, setShowSelectBarModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingClue, setIsSendingClue] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [gameState, setGameState] = useState<ChickenGameState>(mockChickenGameState);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const sendClue = (clueText: string) => {
    setToastMessage(`Indice envoyé à toutes les équipes: "${clueText}"`);
    setShowToast(true);
    setShowPanel(null);
  };

  const handleChallengeValidation = (id: string, approve: boolean) => {
    setGameState(prevState => {
      const updatedCompletions = prevState.challengeCompletions.map(completion => 
        completion.id === id ? { ...completion, status: approve ? 'approved' as const : 'rejected' as const } : completion
      );
      return { ...prevState, challengeCompletions: updatedCompletions };
    });
    setToastMessage(`Défi ${approve ? 'approuvé' : 'rejeté'} avec succès`);
    setShowToast(true);
  };

  const markTeamFound = (teamId: string) => {
    setGameState(prevState => {
      const updatedTeams = prevState.teams.map(team => 
        team.id === teamId ? { ...team, foundChicken: true } : team
      );
      return { ...prevState, teams: updatedTeams };
    });
    setToastMessage(`L'équipe a trouvé le poulet!`);
    setShowToast(true);
  };

  const changeCurrentBar = (barId: string) => {
    const bar = gameState.barOptions.find(b => b.id === barId);
    if (bar) {
      setGameState(prevState => ({ ...prevState, currentBar: bar }));
      setToastMessage(`Position mise à jour: ${bar.name}`);
      setShowToast(true);
    }
  };

  const toggleChallengeStatus = (id: string) => {
    setGameState(prevState => {
      const updatedChallenges = prevState.challenges.map(challenge => 
        challenge.id === id ? {...challenge, active: !challenge.active} : challenge
      );
      return { ...prevState, challenges: updatedChallenges };
    });
  };
  
  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: `message-${Date.now()}`,
        gameId: gameState.game.id,
        userId: 'user-5',
        sender: 'Vous',
        content: newMessage,
        timestamp: new Date().toISOString(),
        isClue: isSendingClue
      };
      setGameState(prevState => ({ ...prevState, messages: [...prevState.messages, newMsg] }));
      setNewMessage('');
      setIsSendingClue(false);
    }
  };
  
  const MapTabContent: React.FC = () => {
    const mapCenter: [number, number] = gameState.currentBar 
      ? [gameState.currentBar.latitude, gameState.currentBar.longitude] 
      : [48.87, 2.34];
    const mapZoom = 14;

    return (
      <div className="map-tab-container">
        <div className="map-view">
          <GameMap
            bars={gameState.barOptions}
            currentBar={gameState.currentBar}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        <div className="position-info-action">
          <IonItem lines="none" className="current-bar-display">
            <IonIcon icon={locationOutline} slot="start" color="primary" />
            <IonLabel>
              <h2>Position Actuelle</h2>
              {gameState.currentBar ? (
                <p>{gameState.currentBar.name}</p>
              ) : (
                <p className="text-medium">Aucune cachette sélectionnée</p>
              )}
            </IonLabel>
          </IonItem>
          <IonButton 
            expand="block" 
            fill="outline"
            onClick={() => setShowSelectBarModal(true)} 
            className="select-position-button"
          >
            Choisir / Changer ma cachette
          </IonButton>
        </div>
      </div>
    );
  };

  const ChallengesTabContent: React.FC = () => (
    <>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Validation des défis</IonTitle>
          <IonButtons slot="end">
            <IonButton color="primary" onClick={() => setShowPanel('challenges')}>
              <IonIcon slot="icon-only" icon={createOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      
      <IonList>
        {gameState.challengeCompletions.map(completion => {
          const challenge = gameState.challenges.find(c => c.id === completion.challengeId);
          const team = gameState.teams.find(t => t.id === completion.teamId);
          
          return (
            <IonCard key={completion.id} className="m-2">
              <IonCardHeader>
                <IonItem lines="none" className="ion-no-padding">
                  <IonAvatar slot="start">
                    <img 
                      src={team?.avatarUrl || 'https://via.placeholder.com/40'} 
                      alt={team?.name} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                      }}
                    />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{team?.name}</h2>
                    <p className="text-xs text-gray-500">
                      {new Date(completion.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </IonLabel>
                  {completion.status === 'approved' && (
                    <IonChip color="success" slot="end">
                      <IonIcon icon={checkmarkCircleOutline} />
                      <IonLabel>Approuvé</IonLabel>
                    </IonChip>
                  )}
                  {completion.status === 'rejected' && (
                    <IonChip color="danger" slot="end">
                      <IonIcon icon={closeCircleOutline} />
                      <IonLabel>Rejeté</IonLabel>
                    </IonChip>
                  )}
                  {completion.status === 'pending' && (
                    <IonChip color="warning" slot="end">
                      <IonIcon icon={timerOutline} />
                      <IonLabel>En attente</IonLabel>
                    </IonChip>
                  )}
                </IonItem>
              </IonCardHeader>
              
              <IonCardContent>
                <IonText className="mb-3">
                  <div className="flex justify-between items-start">
                    <p className="font-medium flex-1 mr-2">{challenge?.title}</p>
                    {challenge && (
                      <IonChip outline color="primary" className="ml-auto flex-shrink-0">
                        <IonIcon icon={trophyOutline} />
                        <IonLabel>{challenge.points} pts</IonLabel>
                      </IonChip>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{challenge?.description}</p>
                </IonText>
                
                {completion.photoUrl && (
                  <div className="my-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center challenge-proof-container" style={{ minHeight: '150px' }}> 
                    <img 
                      src={completion.photoUrl}
                      alt="Preuve défi" 
                      className="w-full max-h-60 object-cover block rounded-md challenge-proof-image"
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p class="text-center text-sm">Impossible de charger l'image de preuve.</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                )}
                
                {completion.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <IonButton expand="block" color="success" onClick={() => handleChallengeValidation(completion.id, true)}>
                      <IonIcon slot="start" icon={checkmarkCircleOutline} />
                      Approuver
                    </IonButton>
                    <IonButton expand="block" color="danger" onClick={() => handleChallengeValidation(completion.id, false)}>
                      <IonIcon slot="start" icon={closeCircleOutline} />
                      Rejeter
                    </IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          );
        })}
        
        {gameState.challengeCompletions.length === 0 && (
          <div className="p-5 text-center">
            <IonIcon icon={imageOutline} color="medium" size="large" />
            <p className="text-gray-500 mt-2">Aucun défi à valider pour le moment</p>
          </div>
        )}
      </IonList>
    </>
  );

  const ChatTabContent: React.FC = () => (
    <>
      <IonHeader>
        <IonToolbar color="light"> 
          <IonTitle>Chat de partie</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowPanel('clue')} color="warning"> 
              <IonIcon icon={bulbOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <ChatMessageList 
        messages={gameState.messages} 
        currentTeamName="Vous"
      />
    </>
  );
  
  const CluePanel: React.FC = () => (
    <IonModal isOpen={showPanel === 'clue'} onDidDismiss={() => setShowPanel(null)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Envoyer un indice</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowPanel(null)}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="bg-yellow-50 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <IonIcon icon={bulbOutline} color="warning" className="mr-2" size="large" />
            <h2 className="text-lg font-bold text-orange-800">Envoi d'indice</h2>
          </div>
          <p className="text-sm text-orange-700">
            Cet indice sera envoyé à toutes les équipes de chasseurs. Utilisez cette fonctionnalité pour guider les équipes qui sont loin de votre position ou pour relancer l'intérêt de la chasse.
          </p>
        </div>
        
        <IonItem className="mb-4">
          <IonLabel position="stacked">Votre indice</IonLabel>
          <IonInput placeholder="Ex: Le poulet aime les cocktails..." />
        </IonItem>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Indices précédents</h3>
          <IonList lines="full">
            {gameState.messages.filter(m => m.isClue).map((clue, index) => (
              <IonItem key={index}>
                <IonIcon icon={bulbOutline} slot="start" color="warning" />
                <IonLabel>
                  <h2>{clue.content}</h2>
                  <p className="text-xs text-gray-500">
                    {new Date(clue.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
      <IonFooter>
        <div className="p-4 border-t border-gray-200">
          <IonButton expand="block" color="warning" onClick={() => sendClue("Le poulet préfère les bars avec terrasse!")}>
            <IonIcon slot="start" icon={bulbOutline} />
            Envoyer l'indice
          </IonButton>
          <p className="text-xs text-gray-500 text-center mt-2">
            L'indice sera visible par toutes les équipes
          </p>
        </div>
      </IonFooter>
    </IonModal>
  );
  
  const ChallengesManagerPanel: React.FC = () => (
    <IonModal isOpen={showPanel === 'challenges'} onDidDismiss={() => setShowPanel(null)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Gestion des défis</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowPanel(null)}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="text-sm text-gray-500 mb-4">
          Personnalisez les défis disponibles pour toutes les équipes.
          Vous pouvez activer ou désactiver des défis selon l'ambiance du jeu.
        </p>
        
        <IonList>
          {gameState.challenges.map(challenge => (
            <IonItem key={challenge.id} lines="full">
              <IonLabel>
                <p className={challenge.active ? 'text-gray-900' : 'text-gray-500'}>
                  {challenge.title}
                </p>
                <IonChip color="primary" outline>
                  {challenge.points} points
                </IonChip>
              </IonLabel>
              <IonToggle
                checked={challenge.active}
                onIonChange={() => toggleChallengeStatus(challenge.id)}
                slot="end"
              />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
      <IonFooter>
        <div className="p-4 border-t border-gray-200">
          <IonButton expand="block" color="primary">
            <IonIcon slot="start" icon={createSharp} />
            Enregistrer les modifications
          </IonButton>
          <p className="text-xs text-gray-500 text-center mt-2">
            Les changements seront synchronisés avec le jeu
          </p>
        </div>
      </IonFooter>
    </IonModal>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary" className="main-toolbar">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" />
          </IonButtons>
          <IonTitle>🐔 Mode Poulet</IonTitle>
          <div slot="end" className="time-chip">
            <IonIcon icon={timeOutline} />
            <span>{gameState.timeLeft}</span>
          </div>
        </IonToolbar>
        
        <IonToolbar className="stats-toolbar">
          <div className="stats-container">
            <div className="stat-item">
              <IonIcon icon={peopleOutline} size="small" />
              <span>{gameState.teams.length} équipes</span>
            </div>
            <div className="stat-item">
              <IonIcon icon={locationOutline} size="small" />
              <span>{gameState.barOptions.length} bars</span>
            </div>
            <div className="game-selector">
              <span>Partie #{gameState.game.id.split('-')[1]}</span>
              <IonIcon icon={chevronDownOutline} size="small" />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className={activeTab === 'chat' ? 'chat-content-padding' : ''} scrollY={activeTab !== 'map'}>
        {activeTab === 'map' && <MapTabContent />}
        {activeTab === 'challenges' && <ChallengesTabContent />}
        {activeTab === 'chat' && <ChatTabContent />}
        {activeTab === 'teams' && <TeamsTabContent gameState={gameState} markTeamFound={markTeamFound} />}
      </IonContent>
      
      <ChallengesManagerPanel />
      <CluePanel />
      
      <SelectHidingSpotModal 
        isOpen={showSelectBarModal}
        barOptions={gameState.barOptions}
        currentBar={gameState.currentBar || null}
        onClose={() => setShowSelectBarModal(false)}
        onSelectBar={changeCurrentBar}
      />
      
      <IonLoading isOpen={isLoading} message="Chargement..." />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color="dark"
      />
      
      {activeTab === 'chat' && (
        <IonFooter>
          <IonToolbar className="chat-input-toolbar p-2">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="chat-input-form">
              <IonInput
                placeholder="Message..."
                value={newMessage}
                onIonChange={(e) => setNewMessage(e.detail.value || '')}
                className="chat-input pl-3"
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
      )}
      
      <IonTabBar slot="bottom">
        <IonTabButton tab="map" selected={activeTab === 'map'} onClick={() => setActiveTab('map')}>
          <IonIcon icon={locationOutline} />
          <IonLabel>Position</IonLabel>
        </IonTabButton>
        <IonTabButton tab="challenges" selected={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')}>
          <IonIcon icon={checkmarkCircleOutline} />
          <IonLabel>Défis</IonLabel>
        </IonTabButton>
        <IonTabButton tab="chat" selected={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
          <IonIcon icon={chatbubbleOutline} />
          <IonLabel>Chat</IonLabel>
        </IonTabButton>
        <IonTabButton tab="teams" selected={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
          <IonIcon icon={ribbonOutline} />
          <IonLabel>Équipes</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
};

export default ChickenPage; 