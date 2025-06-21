import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonTitle, IonCardContent, IonButton, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonBadge } from '@ionic/react';
import { exitOutline, star, people, playCircleOutline, flame } from 'ionicons/icons';
import { Player, Team } from '../types/types';
import { supabase } from '../lib/supabase';

interface WaitingRoomViewProps {
  players: Player[];
  teams: Team[];
  onLeaveTeam: () => void;
  onStartGame: () => void;
  currentPlayerId: string | null;
  isChickenTeam: boolean;
  gameStatus?: string;
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
  const [realGameStatus, setRealGameStatus] = useState(gameStatus);

  const hasHunterTeams = teams.some(team => !team.is_chicken_team);

  const isGameInProgress = realGameStatus === 'in_progress' || realGameStatus === 'chicken_hidden';
  const isGameStarting = realGameStatus === 'in_progress' && !isChickenTeam;
  const isChickenHidden = realGameStatus === 'chicken_hidden';
  
  // Ajouter des logs pour le débogage
  useEffect(() => {
    console.log("WaitingRoomView - Props reçus:", {
      gameStatus,
      isChickenTeam,
      isGameInProgress,
      isGameStarting,
      isChickenHidden
    });
  }, [gameStatus, isChickenTeam, isGameInProgress, isGameStarting, isChickenHidden]);

  // Vérifier le statut du jeu directement depuis Supabase
  useEffect(() => {
    if (currentPlayer?.game_id) {
      const checkGameStatus = async () => {
        try {
          // Ne pas utiliser .single() pour éviter l'erreur quand aucune ligne n'est retournée
          const { data, error } = await supabase
            .from('games')
            .select('status')
            .eq('id', currentPlayer.game_id);
          
          if (error) throw error;
          
          // Vérifier si des données ont été retournées
          if (data && data.length > 0) {
            const newStatus = data[0].status;
            
            if (newStatus !== realGameStatus) {
              console.log("Statut du jeu récupéré depuis Supabase:", newStatus);
              setRealGameStatus(newStatus);
              
              // Mettre à jour la session locale avec le nouveau statut
              const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
              localStorage.setItem('player-session', JSON.stringify({
                ...currentSession,
                gameStatus: newStatus
              }));
              
              // Si le jeu est en cours, rediriger vers la page appropriée
              if (newStatus === 'in_progress' || newStatus === 'chicken_hidden') {
                console.log("Redirection vers la page de jeu...");
                // Mettre à jour la session avec toutes les informations nécessaires
                const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
                localStorage.setItem('player-session', JSON.stringify({
                  ...currentSession,
                  gameId: currentPlayer.game_id,
                  gameStatus: newStatus,
                  isChickenTeam: isChickenTeam
                }));
                console.log("Session mise à jour avant redirection:", {
                  gameId: currentPlayer.game_id,
                  gameStatus: newStatus,
                  isChickenTeam
                });
                
                // Redirection immédiate sans délai
                window.location.href = isChickenTeam 
                  ? `/chicken/${currentPlayer.game_id}` 
                  : `/player/${currentPlayer.game_id}`;
              }
            }
          } else {
            console.warn("Aucune partie trouvée avec l'ID:", currentPlayer.game_id);
          }
        } catch (err) {
          console.error("Erreur lors de la vérification du statut du jeu:", err);
        }
      };
      
      checkGameStatus();
      
      // Vérifier périodiquement le statut du jeu
      const interval = setInterval(checkGameStatus, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentPlayer?.game_id, isChickenTeam, realGameStatus]);

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
              {!isGameInProgress && (
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
              )}
            </>
          ) : (
            <p>Vous êtes une équipe de chasseurs! Vous allez devoir trouver le Poulet.</p>
          )}
          
          <div className="flex justify-center gap-2 mt-4">
            {!isGameInProgress && (
              <IonButton fill="clear" onClick={onLeaveTeam} size="small">
                <IonIcon icon={exitOutline} slot="start" />
                Quitter l'équipe
              </IonButton>
            )}
            
            {isGameInProgress && (
              <IonButton 
                color="danger" 
                routerLink={isChickenTeam ? `/chicken/${currentPlayer?.game_id}` : `/player/${currentPlayer?.game_id}`}
                size="large"
                expand="block"
                className="animate-pulse"
              >
                <IonIcon icon={flame} slot="start" />
                {isChickenHidden ? 'La chasse est lancée ! Rejoindre' : 'Rejoindre la partie'}
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
          
          {isGameStarting && !isChickenHidden && (
            <p className="text-sm text-green-500 mt-2 font-bold">
              La partie a commencé ! Le poulet est en train de se cacher...
            </p>
          )}
          
          {isChickenHidden && (
            <p className="text-sm text-red-500 mt-2 font-bold">
              Le poulet est caché ! La chasse est lancée !
            </p>
          )}
          
          {/* Bouton de secours pour forcer la redirection si la redirection automatique échoue */}
          {(realGameStatus === 'in_progress' || realGameStatus === 'chicken_hidden') && (
            <div className="mt-4">
              <IonButton 
                color="warning" 
                expand="block"
                onClick={() => {
                  console.log("Forçage de la redirection...");
                  // Mettre à jour la session avec toutes les informations nécessaires
                  const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
                  localStorage.setItem('player-session', JSON.stringify({
                    ...currentSession,
                    gameId: currentPlayer?.game_id,
                    gameStatus: realGameStatus,
                    isChickenTeam: isChickenTeam
                  }));
                  console.log("Session mise à jour avant redirection forcée:", {
                    gameId: currentPlayer?.game_id,
                    gameStatus: realGameStatus,
                    isChickenTeam
                  });
                  
                  window.location.href = isChickenTeam 
                    ? `/chicken/${currentPlayer?.game_id}` 
                    : `/player/${currentPlayer?.game_id}`;
                }}
              >
                <IonIcon icon={flame} slot="start" />
                REJOINDRE LA PARTIE
              </IonButton>
              <p className="text-sm text-center mt-2">
                Cliquez sur le bouton ci-dessus pour rejoindre la partie en cours.
              </p>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      <IonList>
        <IonListHeader>
          <IonLabel>Équipes Actuelles</IonLabel>
          {isGameInProgress && (
            <IonBadge color="success">Partie en cours</IonBadge>
          )}
        </IonListHeader>
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