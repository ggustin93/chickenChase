import {
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonCard, IonCardContent, useIonToast, 
  IonSpinner, IonChip, IonListHeader
} from '@ionic/react';
import { useIonViewWillEnter } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logOut, personCircle } from 'ionicons/icons';
import { useSession } from '../contexts/SessionContext';
import { Game, Player, Team } from '../types/types';
import TeamSelectionView from '../components/TeamSelectionView';
import WaitingRoomView from '../components/WaitingRoomView';
import { PostgrestError } from '@supabase/supabase-js';

const LobbyPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const history = useHistory();
  const { session, clearSession } = useSession();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [present] = useIonToast();

  const currentPlayerId = session.playerId;
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentPlayerTeam = teams.find(team => team.id === currentPlayer?.team_id);
  const isPlayerInTeam = !!currentPlayer?.team_id;
  const isPlayerInChickenTeam = currentPlayerTeam?.is_chicken_team || false;

  // Fonction pour rediriger vers la page appropriée
  const redirectToGamePage = useCallback(() => {
    if (!gameId) return;
    
    // Récupérer la session courante
    const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
    const isChickenTeam = currentPlayerTeam?.is_chicken_team || false;
    
    // Mettre à jour la session locale pour indiquer que le jeu est en cours
    localStorage.setItem('player-session', JSON.stringify({
      ...currentSession,
      gameStatus: 'in_progress',
      isChickenTeam: isChickenTeam
    }));
    
    if (isChickenTeam) {
      console.log("Redirecting to chicken page:", `/chicken/${gameId}`);
      // Utiliser window.location.href pour une redirection directe
      window.location.href = `/chicken/${gameId}`;
    } else {
      console.log("Redirecting to player page:", `/player/${gameId}`);
      window.location.href = `/player/${gameId}`;
    }
  }, [gameId, currentPlayerTeam]);

  useEffect(() => {
    console.log("Game status changed:", game?.status);
    console.log("Is player in chicken team:", isPlayerInChickenTeam);
    
    if (game?.status === 'in_progress') {
      console.log("Game is in progress, redirecting...");
      redirectToGamePage();
    }
  }, [game, redirectToGamePage]);

  const handleDataChange = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      const { data: gameData, error: gameError } = await supabase.from('games').select('*').eq('id', gameId).single();
      if (gameError) throw gameError;
      console.log("Game data fetched:", gameData);
      setGame(gameData);

      const { data: playersData, error: playersError } = await supabase.from('players').select('*').eq('game_id', gameId);
      if (playersError) throw playersError;
      setPlayers(playersData);

      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').eq('game_id', gameId);
      if (teamsError) throw teamsError;
      setTeams(teamsData);
      
      // Mettre à jour la session avec l'information isChickenTeam
      const currentPlayer = playersData.find(p => p.id === session.playerId);
      const currentTeam = teamsData.find(t => t.id === currentPlayer?.team_id);
      const isChickenTeam = currentTeam?.is_chicken_team || false;
      
      // Si le jeu est en cours, mettre à jour la session locale
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        isChickenTeam,
        gameStatus: gameData.status
      }));

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        present({ message: `Erreur: ${err.message}`, duration: 3000, color: 'danger' });
      } else {
        setError("An unknown error occurred");
        present({ message: "Une erreur inconnue est survenue", duration: 3000, color: 'danger' });
      }
    } finally {
      setLoading(false);
    }
  }, [gameId, present, session.playerId]);

  useIonViewWillEnter(() => {
    handleDataChange();
  });

  useEffect(() => {
    if (!session.playerId || !session.gameId || session.gameId !== gameId) {
      console.log("Session invalide ou manquante. Redirection vers l'accueil.");
      history.push('/home');
      return;
    }

    const channel = supabase
      .channel(`lobby-updates-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        console.log("Database change detected, refreshing data...");
        handleDataChange();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, handleDataChange, history, session]);

  const handleJoinTeam = async (teamId: string) => {
    if (!currentPlayerId) return;
    const { error } = await supabase.from('players').update({ team_id: teamId }).eq('id', currentPlayerId);
    if (error) {
      present({ message: `Erreur pour rejoindre l'équipe: ${error.message}`, duration: 3000, color: 'danger' });
    } else {
      // Vérifier si c'est l'équipe Chicken
      const { data: teamData } = await supabase.from('teams').select('*').eq('id', teamId).single();
      if (teamData) {
        // Mettre à jour la session locale avec l'information isChickenTeam
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        localStorage.setItem('player-session', JSON.stringify({
          ...currentSession,
          isChickenTeam: teamData.is_chicken_team || false
        }));
      }
      handleDataChange(); // Refresh data
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentPlayerId) return;
    const { error } = await supabase.from('players').update({ team_id: null }).eq('id', currentPlayerId);
    if (error) {
      present({ message: `Erreur pour quitter l'équipe: ${error.message}`, duration: 3000, color: 'danger' });
    } else {
      handleDataChange(); // Refresh data
    }
  };

  const handleBeChicken = async () => {
    if (!currentPlayerId || !gameId) return;

    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ game_id: gameId, name: 'Chicken Team', is_chicken_team: true })
      .select()
      .single();

    if (teamError) {
      present({ message: `Erreur: ${teamError.message}`, duration: 3000, color: 'danger' });
      return;
    }

    // Mettre à jour la session locale avec l'information isChickenTeam
    const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
    localStorage.setItem('player-session', JSON.stringify({
      ...currentSession,
      isChickenTeam: true
    }));

    await handleJoinTeam(teamData.id);
  };

  const handleStartGame = async () => {
    if (!gameId || !isPlayerInChickenTeam) {
      present({ 
        message: 'Seule l\'équipe Poulet peut lancer la partie', 
        duration: 3000, 
        color: 'warning' 
      });
      return;
    }

    try {
      // Vérifier qu'il y a au moins une équipe de chasseurs
      const hunterTeams = teams.filter(team => !team.is_chicken_team);
      if (hunterTeams.length === 0) {
        present({ 
          message: 'Il faut au moins une équipe de chasseurs pour commencer la partie', 
          duration: 3000, 
          color: 'warning' 
        });
        return;
      }

      console.log("Starting game...");
      
      // Mettre à jour le statut de la partie dans Supabase
      const { error } = await supabase
        .from('games')
        .update({ status: 'in_progress' })
        .eq('id', gameId);

      if (error) throw error;
      
      // Vérifier que la mise à jour a bien été effectuée
      const { data: updatedGame, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (fetchError) throw fetchError;
      
      console.log("Game status updated:", updatedGame);

      // Mettre à jour la session locale avec le statut du jeu et l'information isChickenTeam
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        gameStatus: 'in_progress',
        isChickenTeam: true // Forcer à true puisque c'est l'équipe Chicken qui démarre la partie
      }));

      present({ 
        message: 'La partie commence !', 
        duration: 2000, 
        color: 'success' 
      });
      
      // Mettre à jour l'état local
      setGame(updatedGame);
      
      // Redirection directe vers la page Chicken
      setTimeout(() => {
        console.log("Redirecting to chicken page:", `/chicken/${gameId}`);
        window.location.href = `/chicken/${gameId}`;
      }, 1000);

    } catch (error) {
      console.error('Error starting game:', error);
      present({ 
        message: error instanceof Error ? error.message : 'Une erreur est survenue', 
        duration: 3000, 
        color: 'danger' 
      });
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      present({ message: 'Veuillez entrer un nom d\'équipe.', duration: 2000, color: 'warning'});
      return;
    }
    if (!session || isPlayerInTeam) {
      if(isPlayerInTeam) present({ message: 'Vous êtes déjà dans une équipe.', duration: 2000, color: 'warning'});
      return;
    }
    
    try {
      // Create new team
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({ name: newTeamName, game_id: gameId, is_chicken_team: false })
        .select()
        .single();

      if (createError || !newTeam) throw createError;

      await handleJoinTeam(newTeam.id);
      
      present({ message: `Équipe "${newTeamName}" créée !`, duration: 2000, color: 'success' });
      setNewTeamName('');

    } catch (error) {
      console.error('Error creating team:', error);
      const pgError = error as PostgrestError;
      let message = 'Une erreur est survenue.';
      if (pgError && pgError.code === '23505') {
        message = 'Ce nom d\'équipe est déjà pris.';
      } else if (error instanceof Error) {
        message = error.message;
      }
      present({ message, duration: 3000, color: 'danger' });
    }
  };

  const handleLeaveLobby = () => {
    clearSession();
    history.push('/home');
  };

  if (loading) return (
    <IonPage>
      <IonHeader>
        <IonToolbar><IonTitle>Chargement...</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-text-center ion-padding">
        <IonSpinner name="bubbles" />
      </IonContent>
    </IonPage>
  );

  if (error) return (
    <IonPage><IonContent><p>Erreur: {error}</p></IonContent></IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
            <IonButton onClick={handleLeaveLobby}>
              <IonIcon icon={logOut} />
            </IonButton>
          </IonButtons>
          <IonTitle>Lobby</IonTitle>
          <IonButtons slot="end">
            <IonChip color="light">
              <IonIcon icon={personCircle} />
              <IonLabel>{session.nickname}</IonLabel>
            </IonChip>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="text-center mb-4">
          <h2>Joueurs dans le Lobby</h2>
          <p>Code de la partie: <strong>{game?.join_code}</strong></p>
          <p><small>Status: {game?.status}</small></p>
        </div>

        {currentPlayerTeam ? (
          <WaitingRoomView
            players={players}
            teams={teams}
            onLeaveTeam={handleLeaveTeam}
            onStartGame={handleStartGame}
            currentPlayerId={currentPlayerId}
            isChickenTeam={isPlayerInChickenTeam}
            gameStatus={game?.status}
          />
        ) : (
          <TeamSelectionView
            teams={teams}
            players={players}
            onJoinTeam={handleJoinTeam}
            onBeChicken={handleBeChicken}
            isChickenTeamCreated={teams.some(t => t.is_chicken_team)}
            onHandleCreateTeam={handleCreateTeam}
            newTeamName={newTeamName}
            setNewTeamName={setNewTeamName}
          />
        )}

        <IonListHeader>
          <IonLabel>Joueurs sans équipe</IonLabel>
        </IonListHeader>
        {players.length > 0 ? (
          <IonList inset={true}>
            {players.filter(p => !p.team_id).map((player) => (
              <IonItem key={player.id}>
                <IonLabel>{player.nickname}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <IonCard>
            <IonCardContent>
              <p className="ion-text-center">Personne n'est disponible pour le moment.</p>
            </IonCardContent>
          </IonCard>
        )}

      </IonContent>
    </IonPage>
  );
};

export default LobbyPage; 