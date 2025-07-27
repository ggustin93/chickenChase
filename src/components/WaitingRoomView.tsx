import React, { useEffect, useState } from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonTitle, IonCardContent, IonButton, IonIcon, IonList, IonListHeader, IonLabel, IonItem, IonBadge, IonFab, IonFabButton } from '@ionic/react';
import { exitOutline, star, people, playCircleOutline, flame, refresh } from 'ionicons/icons';
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
  onRefresh?: () => void;
  onNavigate?: (path: string) => void;
}

const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  players,
  teams,
  onLeaveTeam,
  onStartGame,
  currentPlayerId,
  isChickenTeam,
  gameStatus = 'lobby',
  onRefresh,
  onNavigate
}) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentTeam = teams.find(t => t.id === currentPlayer?.team_id);
  const [realGameStatus, setRealGameStatus] = useState(gameStatus);
  const [refreshing, setRefreshing] = useState(false);

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

  // Real-time subscription pour le statut du jeu et les changements d'équipes/joueurs
  useEffect(() => {
    if (!currentPlayer?.game_id) return;
    
    const gameId = currentPlayer.game_id;
    
    // Fonction pour vérifier le statut du jeu
    const checkGameStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('status')
          .eq('id', gameId);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newStatus = data[0].status;
          
          if (newStatus !== realGameStatus) {
            console.log("🎮 Statut du jeu mis à jour:", newStatus);
            setRealGameStatus(newStatus);
            
            // Mettre à jour la session locale
            const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
            localStorage.setItem('player-session', JSON.stringify({
              ...currentSession,
              gameStatus: newStatus
            }));
            
            // Redirection si le jeu commence
            if (newStatus === 'in_progress' || newStatus === 'chicken_hidden') {
              console.log("🚀 Redirection vers la page de jeu...");
              localStorage.setItem('player-session', JSON.stringify({
                ...currentSession,
                gameId: gameId,
                gameStatus: newStatus,
                isChickenTeam: isChickenTeam
              }));
              
              if (onNavigate) {
                onNavigate(isChickenTeam ? `/chicken/${gameId}` : `/player/${gameId}`);
              }
            }
          }
        }
      } catch (err) {
        console.error("❌ Erreur lors de la vérification du statut:", err);
      }
    };
    
    // Vérification initiale
    checkGameStatus();
    
    // Real-time subscription pour les changements de statut de jeu
    const gameStatusChannel = supabase
      .channel(`waiting-game-status-${gameId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}` 
      }, (payload) => {
        console.log("📡 Changement de statut de jeu détecté:", payload);
        const newStatus = (payload.new as any).status;
        setRealGameStatus(newStatus);
        
        // Mettre à jour session et rediriger si nécessaire
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        localStorage.setItem('player-session', JSON.stringify({
          ...currentSession,
          gameStatus: newStatus
        }));
        
        if (newStatus === 'in_progress' || newStatus === 'chicken_hidden') {
          console.log("🚀 Redirection automatique via Realtime");
          localStorage.setItem('player-session', JSON.stringify({
            ...currentSession,
            gameId: gameId,
            gameStatus: newStatus,
            isChickenTeam: isChickenTeam
          }));
          
          if (onNavigate) {
            onNavigate(isChickenTeam ? `/chicken/${gameId}` : `/player/${gameId}`);
          }
        }
      })
      .subscribe((status) => {
        console.log('📡 WaitingRoom Realtime status:', status);
      });
    
    // Polling de secours (moins fréquent)
    const interval = setInterval(checkGameStatus, 30000);
    
    return () => {
      supabase.removeChannel(gameStatusChannel);
      clearInterval(interval);
    };
  }, [currentPlayer?.game_id, isChickenTeam, realGameStatus]);

  // Fonction de refresh manuelle
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
      // Aussi vérifier le statut du jeu
      if (currentPlayer?.game_id) {
        const { data, error } = await supabase
          .from('games')
          .select('status')
          .eq('id', currentPlayer.game_id);
        
        if (!error && data && data.length > 0) {
          const newStatus = data[0].status;
          if (newStatus !== realGameStatus) {
            console.log('🔄 Statut mis à jour via refresh:', newStatus);
            setRealGameStatus(newStatus);
          }
        }
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <>
      {/* Bouton refresh mobile-optimisé */}
      {onRefresh && (
        <IonFab vertical="top" horizontal="end" slot="fixed" className="mobile-refresh-fab">
          <IonFabButton 
            size="small" 
            color="light" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-button-mobile"
          >
            <IonIcon 
              icon={refresh} 
              className={refreshing ? 'refresh-spinning' : ''}
            />
          </IonFabButton>
        </IonFab>
      )}
      
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
                  
                  if (onNavigate && currentPlayer?.game_id) {
                    onNavigate(isChickenTeam ? `/chicken/${currentPlayer.game_id}` : `/player/${currentPlayer.game_id}`);
                  }
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