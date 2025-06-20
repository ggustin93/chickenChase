import React from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonTitle, IonCardContent, IonButton, IonIcon, IonList, IonListHeader, IonLabel, IonItem } from '@ionic/react';
import { exitOutline, star, people, playCircleOutline, flame } from 'ionicons/icons';
import { Player, Team } from '../types/types';

interface WaitingRoomViewProps {
  players: Player[];
  teams: Team[];
  onLeaveTeam: () => void;
  onStartGame: () => void;
  currentPlayerId: string | null;
  isChickenTeam: boolean;
  gameStatus?: 'lobby' | 'in_progress' | 'finished';
}

const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  players,
  teams,
  onLeaveTeam,
  onStartGame,
  currentPlayerId,
  isChickenTeam,
  gameStatus = 'lobby'
}) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentTeam = teams.find(t => t.id === currentPlayer?.team_id);

  const hasHunterTeams = teams.some(team => !team.is_chicken_team);

  const isGameInProgress = gameStatus === 'in_progress';

  return (
    <>
      <IonCard className="ion-margin-bottom ion-text-center">
        <IonCardHeader>
          <IonCardSubtitle>Vous êtes dans l'équipe</IonCardSubtitle>
          <IonTitle color="primary">{currentTeam?.name} {currentTeam?.is_chicken_team ? '🐔' : ''}</IonTitle>
        </IonCardHeader>
        <IonCardContent>
          {isChickenTeam ? (
            <>
              <p>Vous êtes l'équipe Poulet ! Vous allez devoir vous cacher dans un bar.</p>
              <div className="flex justify-center gap-2 mt-4">
                <IonButton 
                  color="warning" 
                  size="large" 
                  expand="block"
                  onClick={onStartGame}
                  className="ion-margin-vertical"
                  disabled={!hasHunterTeams}
                >
                  <IonIcon icon={playCircleOutline} slot="start" />
                  Lancer la partie !
                </IonButton>
              </div>
            </>
          ) : (
            <p>Vous êtes une équipe de chasseurs! Vous allez devoir trouver le Poulet.</p>
          )}
          <div className="flex justify-center gap-2 mt-4">
            <IonButton fill="clear" onClick={onLeaveTeam} size="small" className="ion-margin-top">
              <IonIcon icon={exitOutline} slot="start" />
              Quitter l'équipe
            </IonButton>
            
            {isChickenTeam && !isGameInProgress && (
              <IonButton 
                color="success" 
                onClick={onStartGame}
                disabled={!hasHunterTeams}
              >
                Lancer la partie
              </IonButton>
            )}
            
            {!isChickenTeam && isGameInProgress && (
              <IonButton color="danger" routerLink={`/player/${currentPlayer?.game_id}`}>
                <IonIcon icon={flame} slot="start" />
                Rejoindre le jeu
              </IonButton>
            )}
          </div>
          {isChickenTeam && !hasHunterTeams && !isGameInProgress && (
            <p className="text-sm text-red-500 mt-2">
              Il faut au moins une équipe de chasseurs pour commencer la partie.
            </p>
          )}
          {!isChickenTeam && !isGameInProgress && (
            <p className="text-sm text-gray-500 mt-2">
              En attente que le Poulet lance la partie...
            </p>
          )}
        </IonCardContent>
      </IonCard>

      <IonList>
        <IonListHeader><IonLabel>Équipes Actuelles</IonLabel></IonListHeader>
        {teams.map(team => (
          <IonCard key={team.id} color={team.is_chicken_team ? 'light' : undefined}>
            <IonItem lines="none" color={team.is_chicken_team ? 'light' : undefined}>
              <IonIcon icon={team.is_chicken_team ? star : people} slot="start" color={team.is_chicken_team ? 'warning' : 'medium'} />
              <IonLabel><h2>{team.name}</h2></IonLabel>
            </IonItem>
            <IonCardContent>
              {players.filter(p => p.team_id === team.id).length > 0 ? (
                <IonList>
                  {players.filter(p => p.team_id === team.id).map(player => (
                    <IonItem key={player.id}><IonLabel>{player.nickname}</IonLabel></IonItem>
                  ))}
                </IonList>
              ) : (
                <p className="ion-padding-start ion-padding-bottom"><small>Personne dans cette équipe pour l'instant.</small></p>
              )}
            </IonCardContent>
          </IonCard>
        ))}
      </IonList>
    </>
  );
};

export default WaitingRoomView;