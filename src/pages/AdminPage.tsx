import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonToast
} from '@ionic/react';
import { 
  ribbonOutline, 
  peopleOutline, 
  settingsOutline,
  timerOutline,
  locationOutline,
  arrowBackOutline
} from 'ionicons/icons';
import useChickenGameState from '../hooks/useChickenGameState';
import ChallengesPanel from '../components/admin/ChallengesPanel';
import { Challenge } from '../data/types';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const { 
    gameState, 
    toggleChallengeStatus, 
    handleChallengeValidation,
    addChallenge
  } = useChickenGameState();

  const [activeSegment, setActiveSegment] = useState<string>('challenges');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleNewChallenge = (challenge: Omit<Challenge, 'id'>) => {
    addChallenge(challenge);
    setToastMessage('Nouveau défi ajouté avec succès!');
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Administration</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/chicken">
              <IonIcon icon={arrowBackOutline} />
              <IonLabel>Retour</IonLabel>
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
            <IonSegmentButton value="challenges">
              <IonIcon icon={ribbonOutline} />
              <IonLabel>Défis</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="teams">
              <IonIcon icon={peopleOutline} />
              <IonLabel>Équipes</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="settings">
              <IonIcon icon={settingsOutline} />
              <IonLabel>Paramètres</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {activeSegment === 'challenges' && (
          <ChallengesPanel
            challenges={gameState.challenges}
            onToggleChallengeStatus={toggleChallengeStatus}
            onChallengeValidation={handleChallengeValidation}
            onAddChallenge={handleNewChallenge}
          />
        )}

        {activeSegment === 'teams' && (
          <IonCard className="admin-card">
            <IonCardHeader>
              <IonCardTitle>Gestion des équipes</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {gameState.teams.map(team => (
                  <IonItem key={team.id}>
                    <IonLabel>
                      <h2>{team.name}</h2>
                      <p>{team.members.join(', ')}</p>
                    </IonLabel>
                    <IonBadge slot="end" color={team.foundChicken ? "success" : "medium"}>
                      {team.foundChicken ? "A trouvé" : "Cherche"}
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {activeSegment === 'settings' && (
          <IonCard className="admin-card">
            <IonCardHeader>
              <IonCardTitle>Paramètres de la partie</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="full">
                <IonItem>
                  <IonIcon icon={timerOutline} slot="start" />
                  <IonLabel>Durée de la partie</IonLabel>
                  <IonLabel slot="end">{gameState.timeLeft}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={locationOutline} slot="start" />
                  <IonLabel>Position actuelle</IonLabel>
                  <IonLabel slot="end">{gameState.currentBar?.name || 'Non défini'}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={peopleOutline} slot="start" />
                  <IonLabel>Équipes</IonLabel>
                  <IonBadge slot="end" color="primary">{gameState.teams.length}</IonBadge>
                </IonItem>
                <IonItem>
                  <IonIcon icon={ribbonOutline} slot="start" />
                  <IonLabel>Défis</IonLabel>
                  <IonBadge slot="end" color="primary">{gameState.challenges.length}</IonBadge>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color="success"
      />
    </IonPage>
  );
};

export default AdminPage; 