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
import { Game, Player, Team, GameStatus } from '../types/types';
import TeamSelectionView from '../components/TeamSelectionView';
import WaitingRoomView from '../components/WaitingRoomView';
import { PostgrestError } from '@supabase/supabase-js';

// Supprimer la définition redondante de GameStatus car elle est maintenant importée

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

  // Log pour déboguer le gameId
  useEffect(() => {
    console.log("Current gameId from URL params:", gameId);
    console.log("Current gameId from session:", session.gameId);
  }, [gameId, session.gameId]);

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
    
    if (game?.status === 'in_progress' || game?.status === 'chicken_hidden') {
      console.log("Game is in progress, redirecting...");
      
      // Mettre à jour la session locale avec le nouveau statut
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        gameStatus: game.status,
        isChickenTeam: isPlayerInChickenTeam
      }));
      
      // Redirection après un court délai pour permettre à localStorage de se mettre à jour
      setTimeout(() => {
        redirectToGamePage();
      }, 500);
    }
  }, [game?.status, isPlayerInChickenTeam, redirectToGamePage]);

  // Fonction pour vérifier directement le statut du jeu dans Supabase
  const checkGameStatus = useCallback(async () => {
    if (!gameId) return;
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();
      
      if (error) throw error;
      
      if (data && game?.status !== data.status) {
        const newStatus = data.status as GameStatus;
        console.log("Statut du jeu mis à jour depuis Supabase:", newStatus);
        
        // Mettre à jour l'état local
        setGame(prevGame => prevGame ? { ...prevGame, status: newStatus } : null);
        
        // Mettre à jour la session locale
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        localStorage.setItem('player-session', JSON.stringify({
          ...currentSession,
          gameStatus: newStatus
        }));
        
        // Si le jeu est en cours, rediriger
        if (newStatus === 'in_progress' || newStatus === 'chicken_hidden') {
          console.log("Jeu en cours détecté, redirection...");
          redirectToGamePage();
        }
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du statut du jeu:", err);
    }
  }, [gameId, game?.status, redirectToGamePage]);

  useEffect(() => {
    // Vérifier périodiquement le statut du jeu
    const interval = setInterval(checkGameStatus, 5000);
    
    return () => clearInterval(interval);
  }, [checkGameStatus]);

  const fetchGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si la session est valide
      if (!session || !session.playerId) {
        console.log("Session invalide ou manquante. Redirection vers l'accueil.");
        clearSession();
        history.push('/home');
        return;
      }
      
      // Récupérer les données du jeu
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId);
      
      if (gameError) throw gameError;
      
      // Vérifier si des données ont été retournées
      if (!gameData || gameData.length === 0) {
        throw new Error(`Aucune partie trouvée avec l'ID ${gameId}`);
      }
      
      const game = gameData[0];
      console.log("Game data fetched:", game);
      setGame(game);
      
      // Récupérer les joueurs
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);
      
      if (playersError) throw playersError;
      setPlayers(playersData || []);
      
      // Récupérer les équipes
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId);
      
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);
      
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      present({ 
        message: error instanceof Error ? error.message : 'Une erreur est survenue', 
        duration: 3000, 
        color: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  }, [gameId, history, session, clearSession, present]);

  useIonViewWillEnter(() => {
    fetchGameData();
  });

  useEffect(() => {
    if (!session.playerId || !session.gameId || session.gameId !== gameId) {
      console.log("Session invalide ou manquante. Redirection vers l'accueil.");
      history.push('/home');
      return;
    }

    // Canal pour écouter tous les changements pertinents (players, teams)
    const generalChannel = supabase
      .channel(`lobby-general-${gameId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}` 
      }, () => {
        console.log("Players change detected, refreshing data...");
        fetchGameData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'teams',
        filter: `game_id=eq.${gameId}` 
      }, () => {
        console.log("Teams change detected, refreshing data...");
        fetchGameData();
      })
      .subscribe();

    // Canal spécifique pour les changements de statut du jeu
    const gameStatusChannel = supabase
      .channel(`game-status-${gameId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}` 
      }, (payload) => {
        console.log("Game status change detected:", payload);
        const newStatus = payload.new.status;
        
        // Mettre à jour le statut du jeu dans la session locale
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        const updatedSession = {
          ...currentSession,
          gameStatus: newStatus
        };
        localStorage.setItem('player-session', JSON.stringify(updatedSession));
        console.log("Session mise à jour avec le nouveau statut:", updatedSession);
        
        // Mettre à jour l'état local du jeu immédiatement
        setGame(prevGame => {
          const updatedGame = prevGame ? { ...prevGame, status: newStatus } : null;
          console.log("État du jeu mis à jour:", updatedGame);
          return updatedGame;
        });
        
        // Si le jeu est en cours, préparer la redirection
        if (newStatus === 'in_progress' || newStatus === 'chicken_hidden') {
          console.log("Jeu en cours détecté, préparation de la redirection...");
          // Petit délai pour laisser le temps à l'interface de se mettre à jour
          setTimeout(() => {
            // Forcer un rafraîchissement complet des données
            fetchGameData();
          }, 500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(generalChannel);
      supabase.removeChannel(gameStatusChannel);
    };
  }, [gameId, fetchGameData, history, session]);

  const handleJoinTeam = async (teamId: string) => {
    if (!session || !session.playerId) return;
    
    try {
      // Vérifier si l'équipe existe
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId);
      
      if (teamError) throw teamError;
      
      if (!teamData || teamData.length === 0) {
        throw new Error('Équipe non trouvée');
      }
      
      // Mettre à jour le joueur
      const { error: updateError } = await supabase
        .from('players')
        .update({ team_id: teamId })
        .eq('id', session.playerId);
      
      if (updateError) throw updateError;
      
      present({ message: `Vous avez rejoint l'équipe ${teamData[0].name}`, duration: 2000, color: 'success' });
      
      // Mettre à jour la session locale
      if (teamData[0].is_chicken_team) {
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        localStorage.setItem('player-session', JSON.stringify({
          ...currentSession,
          isChickenTeam: true
        }));
      }
      fetchGameData(); // Refresh data
    } catch (error) {
      console.error('Error joining team:', error);
      present({ 
        message: error instanceof Error ? error.message : 'Une erreur est survenue', 
        duration: 3000, 
        color: 'danger' 
      });
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentPlayerId) return;
    const { error } = await supabase.from('players').update({ team_id: null }).eq('id', currentPlayerId);
    if (error) {
      present({ message: `Erreur pour quitter l'équipe: ${error.message}`, duration: 3000, color: 'danger' });
    } else {
      fetchGameData(); // Refresh data
    }
  };

  const handleBeChicken = async () => {
    if (!gameId || !session || isPlayerInTeam) {
      if (isPlayerInTeam) present({ message: 'Vous êtes déjà dans une équipe.', duration: 2000, color: 'warning'});
      return;
    }

    try {
      // Vérifier si l'équipe Chicken existe déjà
      const { data: existingChickenTeams, error: checkError } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId)
        .eq('is_chicken_team', true);

      if (checkError) throw checkError;

      // Si l'équipe Chicken existe déjà, rejoindre cette équipe
      if (existingChickenTeams && existingChickenTeams.length > 0) {
        await handleJoinTeam(existingChickenTeams[0].id);
        
        // S'assurer que le champ chicken_team_id est mis à jour dans la table games
        const { error: updateGameError } = await supabase
          .from('games')
          .update({ chicken_team_id: existingChickenTeams[0].id })
          .eq('id', gameId);
          
        if (updateGameError) {
          console.error('Erreur lors de la mise à jour du chicken_team_id:', updateGameError);
        } else {
          console.log('chicken_team_id mis à jour avec succès:', existingChickenTeams[0].id);
        }
        
        return;
      }

      // Sinon, créer l'équipe Chicken
      const { data, error: createError } = await supabase
        .from('teams')
        .insert({ name: 'Poulet', game_id: gameId, is_chicken_team: true })
        .select();

      if (createError) throw createError;
      
      if (!data || data.length === 0) {
        throw new Error('Erreur lors de la création de l\'équipe Poulet');
      }
      
      const teamData = data[0];
      
      // Mettre à jour le champ chicken_team_id dans la table games
      const { error: updateGameError } = await supabase
        .from('games')
        .update({ chicken_team_id: teamData.id })
        .eq('id', gameId);
        
      if (updateGameError) {
        console.error('Erreur lors de la mise à jour du chicken_team_id:', updateGameError);
      } else {
        console.log('chicken_team_id mis à jour avec succès:', teamData.id);
      }

      // Mettre à jour la session locale
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        isChickenTeam: true
      }));

      await handleJoinTeam(teamData.id);
    } catch (error) {
      console.error('Error becoming chicken:', error);
      present({ 
        message: error instanceof Error ? error.message : 'Une erreur est survenue', 
        duration: 3000, 
        color: 'danger' 
      });
    }
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
      console.log("Starting game with ID:", gameId);
      console.log("Current player is in chicken team:", isPlayerInChickenTeam);
      
      // Vérifier qu'il y a au moins une équipe de chasseurs
      const hunterTeams = teams.filter(team => !team.is_chicken_team);
      console.log("Hunter teams:", hunterTeams);
      if (hunterTeams.length === 0) {
        present({ 
          message: 'Il faut au moins une équipe de chasseurs pour commencer la partie', 
          duration: 3000, 
          color: 'warning' 
        });
        return;
      }

      console.log("Starting game...");
      
      // Vérifier d'abord que la partie existe
      const { data: checkData, error: checkError } = await supabase
        .from('games')
        .select('id, status')
        .eq('id', gameId);
      
      console.log("Check response:", checkData);
      
      if (checkError) {
        console.error("Error checking game:", checkError);
        throw checkError;
      }
      
      if (!checkData || checkData.length === 0) {
        console.error("Game not found with ID:", gameId);
        throw new Error(`Aucune partie trouvée avec l'ID ${gameId}`);
      }
      
      // Mettre à jour le statut de la partie dans Supabase
      console.log("Updating game status for game ID:", gameId);
      const { data, error } = await supabase
        .from('games')
        .update({ status: 'in_progress' })
        .eq('id', gameId)
        .select();

      console.log("Update response data:", data);
      console.log("Update response error:", error);

      if (error) throw error;
      
      // Vérifier si des données ont été retournées
      if (!data || data.length === 0) {
        console.error("No data returned for game ID:", gameId);
        throw new Error('Aucune partie trouvée avec cet ID');
      }
      
      const updatedGame = data[0];
      console.log("Game status updated:", updatedGame);

      // Mettre à jour la session locale avec le statut du jeu et l'information isChickenTeam
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      const updatedSession = {
        ...currentSession,
        gameId: gameId, // S'assurer que gameId est bien dans la session
        gameStatus: 'in_progress',
        isChickenTeam: true // Forcer à true puisque c'est l'équipe Chicken qui démarre la partie
      };
      localStorage.setItem('player-session', JSON.stringify(updatedSession));
      console.log("Session mise à jour:", updatedSession);

      // Mettre à jour l'état local immédiatement
      setGame(updatedGame);
      
      present({ 
        message: 'La partie commence !', 
        duration: 2000, 
        color: 'success' 
      });
      
      // Redirection directe vers la page Chicken après un court délai
      // pour laisser le temps aux autres joueurs de recevoir la mise à jour
      setTimeout(() => {
        console.log("Redirecting to chicken page:", `/chicken/${gameId}`);
        window.location.href = `/chicken/${gameId}`;
      }, 1500);

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
      const { data, error: createError } = await supabase
        .from('teams')
        .insert({ name: newTeamName, game_id: gameId, is_chicken_team: false })
        .select();

      if (createError) throw createError;
      
      if (!data || data.length === 0) {
        throw new Error('Erreur lors de la création de l\'équipe');
      }
      
      const newTeam = data[0];

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