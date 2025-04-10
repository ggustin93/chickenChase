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
  IonCardTitle,
  IonCardSubtitle,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonAvatar,
  IonChip,
  IonFooter,
  IonFab,
  IonFabButton,
  IonToggle,
  IonMenuButton,
  IonButtons,
  IonMenu,
  IonImg,
  IonThumbnail,
  IonModal,
  IonBackdrop,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSkeletonText,
  IonSpinner,
  IonToast,
  useIonViewWillEnter,
  useIonViewDidEnter,
  IonText,
  IonRouterLink,
  IonRippleEffect,
  IonLoading,
  IonNote
} from '@ionic/react';

import { 
  timeOutline, locationOutline, chatbubbleOutline, cameraOutline, alertCircleOutline, 
  peopleOutline, checkmarkCircleOutline, closeCircleOutline, imageOutline, sendOutline, 
  menuOutline, chevronDownOutline, cashOutline, ribbonOutline, arrowForwardOutline, 
  closeOutline, homeOutline, logOutOutline, settingsOutline, helpCircleOutline, 
  createOutline, createSharp, bookmarkOutline, eyeOutline, notificationsOutline,
  waterOutline, flameOutline, timerOutline, compassOutline, mapOutline, pulseOutline,
  bulbOutline, informationCircleOutline, shareOutline, trophyOutline, searchOutline
} from 'ionicons/icons';

import './ChickenPage.css';

// Import des types et données simulées
import { ChickenGameState, Bar } from '../data/types';
import { mockChickenGameState } from '../data/mock/mockData';

// Importer le composant de liste de messages
import ChatMessageList from '../components/ChatMessageList';

// Importer le nouveau composant Map
import GameMap from '../components/GameMap';

// Interface pour les props de la modale de sélection de bar
interface SelectHidingSpotModalProps {
  isOpen: boolean;
  barOptions: Bar[];
  currentBar: Bar | null;
  onClose: () => void;
  onSelectBar: (barId: string) => void;
}

// --- Modale de Sélection de Bar --- 
const SelectHidingSpotModal: React.FC<SelectHidingSpotModalProps> = (
  { isOpen, barOptions, currentBar, onClose, onSelectBar }
) => {
  const [searchTextModal, setSearchTextModal] = useState(''); // Search state specific to modal

  const filteredBars = barOptions.filter(bar => 
    !searchTextModal || bar.name.toLowerCase().includes(searchTextModal.toLowerCase())
  );

  // Clear search when modal opens or closes
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
                  onClose(); // Close modal after selection
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
  const [menuOpen, setMenuOpen] = useState(false);
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
  
  const SideMenu: React.FC = () => (
    <IonMenu side="start" menuId="first" contentId="main">
      <IonHeader>
        <IonToolbar color="primary">
          <div className="flex items-center p-3">
            <div className="bg-white rounded-full p-2 mr-3">
              <svg className="w-8 h-8" viewBox="0 0 60 60" fill="none">
                <path d="M30 10C32 4 38 5 40 8C42 11 45 11 48 9C52 6 58 12 54 16C50 20 52 24 55 25" fill="#FE8A00" stroke="white" strokeWidth="2"/>
                <circle cx="30" cy="32" r="5" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">CHICKEN CHASE</h1>
              <div className="text-white text-xs">Mode Poulet</div>
            </div>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={() => setMenuOpen(false)}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="flex-1 overflow-auto p-2">
          <div className="p-4">
            <div className="rounded-lg bg-gradient-to-r from-yellow-100 to-orange-50 p-3 mb-4">
              <div className="font-medium text-orange-800">Partie en cours</div>
              <div className="text-sm text-orange-700">{gameState.game.name}</div>
            </div>
          </div>
          
          <IonItem button detail={false} lines="none">
            <IonIcon slot="start" icon={homeOutline} color="medium" />
            <IonLabel>Tableau de bord</IonLabel>
          </IonItem>
          
          <IonItem 
            button 
            detail={false} 
            lines="none"
            onClick={() => {
              setShowPanel('challenges');
              setMenuOpen(false);
            }}
          >
            <IonIcon slot="start" icon={createOutline} color="medium" />
            <IonLabel>Gérer les défis</IonLabel>
          </IonItem>
          
          <IonItem 
            button 
            detail={false} 
            lines="none"
            onClick={() => {
              setShowPanel('clue');
              setMenuOpen(false);
            }}
          >
            <IonIcon slot="start" icon={bulbOutline} color="warning" />
            <IonLabel>Envoyer un indice</IonLabel>
          </IonItem>
          
          <IonItem button detail={false} lines="none">
            <IonIcon slot="start" icon={settingsOutline} color="medium" />
            <IonLabel>Paramètres</IonLabel>
          </IonItem>
          
          <div className="p-4 mt-4">
            <IonButton expand="block" color="danger" fill="outline">
              <IonIcon slot="start" icon={logOutOutline} />
              Quitter la partie
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );

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
      <IonItem lines="none" className="bg-gradient-to-r from-orange-100 to-yellow-50 ion-no-padding">
        <IonLabel className="ion-padding">
          <h2 className="text-lg font-bold text-orange-800">Validation des défis</h2>
          <p className="text-sm text-orange-700">Approuvez ou rejetez les preuves des équipes</p>
        </IonLabel>
      </IonItem>
      
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
                <IonText>
                  <p className="font-medium mb-3">{challenge?.title}</p>
                  <p className="text-sm text-gray-600 mb-3">{challenge?.description}</p>
                </IonText>
                
                {completion.photoUrl && (
                  <div className="my-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center" style={{ minHeight: '150px' }}>
                    <img 
                      src={completion.photoUrl} 
                      alt="Preuve défi" 
                      className="w-full max-h-60 object-cover block" 
                      onError={(e) => { 
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/600/400';
                        (e.target as HTMLImageElement).classList.add('image-error-placeholder'); 
                      }}
                    />
                  </div>
                )}
                
                {completion.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
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

  const TeamsTabContent: React.FC = () => (
    <>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Équipes en recherche</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonItem lines="full" className="bg-gradient-to-r from-orange-100 to-yellow-50 ion-no-padding">
        <IonLabel className="ion-padding">
          <h2 className="text-lg font-bold text-orange-800">Équipes en recherche</h2>
          <p className="text-sm text-orange-700">Progression des équipes</p>
        </IonLabel>
      </IonItem>
      
      <IonItem lines="full" className="bg-yellow-50">
        <IonIcon icon={cashOutline} color="warning" slot="start" />
        <IonLabel>
          <span className="font-medium">Cagnotte</span>
        </IonLabel>
        <IonText slot="end" className="font-bold">85€</IonText>
      </IonItem>
      
      <IonList>
        {gameState.teams.map((team) => (
          <IonCard key={team.id} className="m-2">
            <IonItem lines="none" className="ion-no-padding">
              <IonAvatar slot="start">
                <img 
                  src={team.avatarUrl} 
                  alt={team.name} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                  }}
                />
              </IonAvatar>
              <IonLabel>
                <h2>{team.name}</h2>
                <div className="flex items-center text-xs text-gray-500">
                  <IonIcon icon={peopleOutline} size="small" className="mr-1" />
                  <span>{team.members.length} membres</span>
                </div>
              </IonLabel>
              <IonChip color="primary" slot="end">
                <IonIcon icon={trophyOutline} />
                <IonLabel>{team.score} pts</IonLabel>
              </IonChip>
            </IonItem>
            
            <IonCardContent>
              <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
                <div className="flex items-center">
                  <IonIcon icon={locationOutline} size="small" className="mr-1" />
                  <span>{team.barsVisited} bars</span>
                </div>
                <div className="flex items-center">
                  <IonIcon icon={checkmarkCircleOutline} size="small" className="mr-1" />
                  <span>{team.challengesCompleted} défis</span>
                </div>
              </div>
              
              {team.foundChicken ? (
                <div className="mt-2 bg-green-100 text-green-800 p-3 rounded-md text-sm flex items-center">
                  <IonIcon icon={checkmarkCircleOutline} size="small" className="mr-1" />
                  A trouvé le poulet
                </div>
              ) : (
                <IonButton 
                  expand="block" 
                  fill="solid" 
                  color="primary" 
                  size="small"
                  className="mt-2"
                  onClick={() => markTeamFound(team.id)}
                >
                  Marquer comme trouvé
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        ))}
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
    <IonPage id="main">
      <SideMenu />
      <IonHeader>
        <IonToolbar color="primary" className="main-toolbar">
          <IonButtons slot="start">
            <IonMenuButton onClick={() => setMenuOpen(true)} />
          </IonButtons>
          <IonTitle>Mode Poulet</IonTitle>
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
        {activeTab === 'teams' && <TeamsTabContent />}
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