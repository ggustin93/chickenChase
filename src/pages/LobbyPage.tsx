import {
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, useIonToast, IonSpinner, IonChip, IonLabel
} from '@ionic/react';
import { useIonViewWillEnter } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logOut, personCircle, person, people } from 'ionicons/icons';
import { useSession } from '../contexts/SessionContext';
import { PostgrestError, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Game, Player, Team } from '../types/types';
import WaitingRoomView from '../components/WaitingRoomView';
import ImprovedLobbyView from '../components/ImprovedLobbyView';
import '../styles/lobby-improvements.css';
import '../styles/mobile-responsive.css';

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
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    if (!gameId || isRedirecting) return;
    
    try {
      setIsRedirecting(true);
      
      // Récupérer la session courante
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      const isChickenTeam = currentPlayerTeam?.is_chicken_team || false;
      
      // Mettre à jour la session locale pour indiquer que le jeu est en cours
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        gameId: gameId,
        gameStatus: 'in_progress',
        isChickenTeam: isChickenTeam
      }));
      
      // Déterminer la page de destination
      const targetPath = isChickenTeam ? `/chicken/${gameId}` : `/player/${gameId}`;
      console.log(`Redirecting to ${isChickenTeam ? 'chicken' : 'player'} page: ${targetPath}`);
      
      // Utiliser window.location.href pour une redirection directe
      window.location.href = targetPath;
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
      setIsRedirecting(false);
    }
  }, [gameId, currentPlayerTeam, isRedirecting]);

  useEffect(() => {
    console.log("Game status changed:", game?.status);
    console.log("Is player in chicken team:", isPlayerInChickenTeam);
    
    if ((game?.status === 'in_progress' || game?.status === 'chicken_hidden') && !isRedirecting) {
      console.log("Game is in progress, redirecting...");
      
      // Mettre à jour la session locale avec le nouveau statut
      const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
      localStorage.setItem('player-session', JSON.stringify({
        ...currentSession,
        gameId: gameId, // S'assurer que gameId est bien dans la session
        gameStatus: game.status,
        isChickenTeam: isPlayerInChickenTeam
      }));
      
      // Redirection immédiate pour éviter les problèmes de synchronisation
      redirectToGamePage();
    }
  }, [game?.status, isPlayerInChickenTeam, redirectToGamePage, gameId, isRedirecting]);

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
      
      // Vérifier si le jeu est déjà en cours après avoir récupéré les données
      if (game.status === 'in_progress' || game.status === 'chicken_hidden') {
        // Mettre à jour la session avec le statut actuel
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        const isChickenTeam = teamsData?.some(team => 
          team.is_chicken_team && team.id === playersData?.find(p => p.id === session.playerId)?.team_id
        ) || false;
        
        localStorage.setItem('player-session', JSON.stringify({
          ...currentSession,
          gameId: gameId,
          gameStatus: game.status,
          isChickenTeam: isChickenTeam
        }));
        
        // Ne pas rediriger immédiatement - laisser le useEffect s'en charger
      }
      
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

    // Tentative d'authentification silencieuse pour améliorer Realtime
    const ensureAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const { data: authData } = await supabase.auth.signInAnonymously();
          if (authData.user) {
            console.log("✅ Auth silencieuse réussie pour Realtime");
          }
        } else {
          console.log("✅ Utilisateur déjà authentifié");
        }
      } catch (error) {
        console.log("⚠️ Auth silencieuse échouée, Realtime peut être limité");
      }
    };
    ensureAuth();

    // Plus de polling automatique - remplacé par bouton refresh manuel

    const handlePlayerChanges = (payload: RealtimePostgresChangesPayload<Player>) => {
      console.log('Player change received:', payload);
      const { eventType, new: newPlayer, old: oldPlayer } = payload;
      
      switch (eventType) {
        case 'INSERT':
          setPlayers(currentPlayers => [...currentPlayers, newPlayer]);
          break;
        case 'UPDATE':
          setPlayers(currentPlayers => 
            currentPlayers.map(p => p.id === newPlayer.id ? newPlayer : p)
          );
          break;
        case 'DELETE':
          if (oldPlayer?.id) {
            setPlayers(currentPlayers => currentPlayers.filter(p => p.id !== oldPlayer.id));
          }
          break;
        default:
          break;
      }
    };

    const handleTeamChanges = (payload: RealtimePostgresChangesPayload<Team>) => {
      console.log('Team change received:', payload);
      const { eventType, new: newTeam, old: oldTeam } = payload;

      switch (eventType) {
        case 'INSERT':
          setTeams(currentTeams => [...currentTeams, newTeam]);
          break;
        case 'UPDATE':
          setTeams(currentTeams => 
            currentTeams.map(t => t.id === newTeam.id ? newTeam : t)
          );
          break;
        case 'DELETE':
          if (oldTeam?.id) {
            setTeams(currentTeams => currentTeams.filter(t => t.id !== oldTeam.id));
          }
          break;
        default:
          break;
      }
    };

    // Canal unifié pour les changements de joueurs et d'équipes
    const generalChannel = supabase
      .channel(`lobby-updates-${gameId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}` 
      }, handlePlayerChanges)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'teams',
        filter: `game_id=eq.${gameId}` 
      }, handleTeamChanges)
      .subscribe((status) => {
        console.log('📡 General Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected successfully!');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Realtime connection error - falling back to polling');
        }
      });

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
        const newStatus = (payload.new as Game).status;
        
        const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
        const updatedSession = { ...currentSession, gameStatus: newStatus };
        localStorage.setItem('player-session', JSON.stringify(updatedSession));
        
        setGame(prevGame => {
          if (prevGame) return { ...prevGame, status: newStatus };
          return null;
        });
        
        // La redirection est gérée par le premier useEffect qui observe game.status
      })
      .subscribe((status) => {
        console.log('📡 Game Status Realtime status:', status);
      });

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
      setIsRedirecting(true); // Empêcher les redirections multiples
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
        setIsRedirecting(false);
        return;
      }

      console.log("Starting game...");
      
      // Vérifier d'abord que la partie existe
      const { data: checkData, error: checkError } = await supabase
        .from('games')
        .select('id, status, chicken_team_id')
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
      
      // Vérifier que le chicken_team_id est correctement défini
      const existingGame = checkData[0];
      if (!existingGame.chicken_team_id) {
        console.log("Le chicken_team_id n'est pas défini, mise à jour...");
        // Mettre à jour le chicken_team_id avec l'ID de l'équipe du joueur actuel
        const { error: updateChickenError } = await supabase
          .from('games')
          .update({ chicken_team_id: currentPlayerTeam?.id })
          .eq('id', gameId);
          
        if (updateChickenError) {
          console.error("Erreur lors de la mise à jour du chicken_team_id:", updateChickenError);
          // Continuer malgré l'erreur, car ce n'est pas bloquant
        } else {
          console.log("chicken_team_id mis à jour avec succès:", currentPlayerTeam?.id);
        }
      }

      // Utiliser la nouvelle fonction RPC pour mettre à jour le statut du jeu
      const { data: updateData, error } = await supabase
        .rpc('update_game_status', { 
          game_id: gameId,
          new_status: 'in_progress'
        });

      console.log("Update response data:", updateData);
      console.log("Update response error:", error);

      if (error) throw error;
      
      // Vérifier si la mise à jour a réussi
      if (!updateData || !updateData.success) {
        console.error("La mise à jour du statut a échoué:", updateData);
        throw new Error('Erreur lors de la mise à jour du statut du jeu');
      }
      
      console.log("Game status updated:", updateData);

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
      setGame(prev => prev ? {...prev, status: 'in_progress'} : null);
      
      present({ 
        message: 'La partie commence !', 
        duration: 2000, 
        color: 'success' 
      });
      
      // Redirection directe vers la page Chicken sans délai
      console.log("Redirecting to chicken page:", `/chicken/${gameId}`);
      window.location.href = `/chicken/${gameId}`;

    } catch (error) {
      console.error('Error starting game:', error);
      present({ 
        message: error instanceof Error ? error.message : 'Une erreur est survenue', 
        duration: 3000, 
        color: 'danger' 
      });
      setIsRedirecting(false);
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

  const handleCopyCode = async () => {
    if (game?.join_code) {
      try {
        await navigator.clipboard.writeText(game.join_code);
        present({ 
          message: `Code ${game.join_code} copié !`, 
          duration: 2000, 
          color: 'success' 
        });
      } catch (err) {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = game.join_code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        present({ 
          message: `Code ${game.join_code} copié !`, 
          duration: 2000, 
          color: 'success' 
        });
      }
    }
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
            <IonButton fill="clear" size="small">
              <IonIcon icon={personCircle} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {/* Nom d'utilisateur déplacé sous le header */}
        <div className="user-info-bar">
          <IonChip color="light">
            <IonIcon icon={personCircle} />
            <IonLabel>{session.nickname}</IonLabel>
          </IonChip>
          {/* Quick stats visible seulement dans waiting room */}
          {currentPlayerTeam && (
            <div className="quick-stats">
              <div className="quick-stat">
                <IonIcon icon={person} />
                <span>{players.length}</span>
              </div>
              <div className="quick-stat">
                <IonIcon icon={people} />
                <span>{teams.length}</span>
              </div>
            </div>
          )}
        </div>
      </IonHeader>
      {/* Interface améliorée pour la sélection d'équipe */}
      {!currentPlayerTeam ? (
        <ImprovedLobbyView
          game={game}
          teams={teams}
          players={players}
          currentPlayer={currentPlayer}
          onJoinTeam={handleJoinTeam}
          onBeChicken={handleBeChicken}
          onCreateTeam={handleCreateTeam}
          newTeamName={newTeamName}
          setNewTeamName={setNewTeamName}
          onCopyCode={handleCopyCode}
          onRefresh={fetchGameData}
          loading={false}
        />
      ) : (
        /* Interface d'attente une fois dans une équipe */
        <IonContent fullscreen className="ion-padding">
          <WaitingRoomView
            players={players}
            teams={teams}
            onLeaveTeam={handleLeaveTeam}
            onStartGame={handleStartGame}
            currentPlayerId={currentPlayerId}
            isChickenTeam={isPlayerInChickenTeam}
            gameStatus={game?.status}
            onRefresh={fetchGameData}
          />
        </IonContent>
      )}
    </IonPage>
  );
};

export default LobbyPage; 