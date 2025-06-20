import { IonContent, IonPage, IonImg, IonButton, IonIcon, IonList, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonSpinner, useIonToast } from '@ionic/react';
import { add, logIn, gameController } from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { useEffect, useState } from 'react';
// Remove ExploreContainer import if no longer used
// import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
// Import the logo
import logo from '../assets/images/logo.png';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';

interface Game {
  id: string;
  join_code: string;
  status: string;
}

const Home: React.FC = () => {
  const router = useIonRouter();
  const { setSession } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('id, join_code, status')
        .eq('status', 'lobby');
      
      if (error) {
        console.error('Error fetching games:', error);
        present({ message: 'Could not fetch games', duration: 3000, color: 'danger' });
      } else {
        setGames(data);
      }
      setLoading(false);
    };

    fetchGames();
  }, [present]);

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      // Call the new database function, passing an empty object as the arguments
      const { data, error } = await supabase.rpc('create_game_and_host', {});

      if (error || !data || data.length === 0) {
        console.error('Error calling create_game_and_host:', error);
        throw new Error("Impossible de créer la partie. Le majordome a échoué !");
      }
      
      const { game_id, player_id } = data;

      // Set session in the context and navigate to lobby
      setSession({ playerId: player_id, gameId: game_id, nickname: 'Hôte' });
      router.push(`/lobby/${game_id}`, 'forward', 'replace');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating game';
      present({ message: errorMessage, duration: 3000, color: 'danger'});
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    router.push('/join-game', 'forward', 'replace');
  };

  const handleJoinSpecificGame = (joinCode: string) => {
    // Navigate to join page with pre-filled code
    router.push(`/join-game?code=${joinCode}`, 'forward', 'replace');
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle className="ion-text-center">Chicken Chase</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div className="home-container">
          <IonImg src={logo} className="logo-img ion-margin-bottom" />

          <div className="button-group">
            <IonButton size="large" expand="block" onClick={handleCreateGame}>
              <IonIcon slot="start" icon={add} />
              Créer une Partie
            </IonButton>
            <IonButton size="large" expand="block" fill="outline" onClick={handleJoinGame}>
              <IonIcon slot="start" icon={logIn} />
              Rejoindre avec un code
            </IonButton>
          </div>
          
          <div className="ion-margin-top">
            <h2 className="ion-text-center">Parties en cours</h2>
            {loading ? <div className="ion-text-center"><IonSpinner /></div> : (
              <IonList>
                {games.length > 0 ? games.map(game => (
                  <IonItem button key={game.id} onClick={() => handleJoinSpecificGame(game.join_code)}>
                    <IonIcon slot="start" icon={gameController} color="medium" />
                    <IonLabel>
                      <h3>Partie {game.join_code}</h3>
                      <p>En attente de joueurs...</p>
                    </IonLabel>
                  </IonItem>
                )) : <p className="ion-text-center">Aucune partie en cours. Créez-en une !</p>}
              </IonList>
            )}
          </div>
        </div>
        {/* <ExploreContainer /> */}
      </IonContent>
    </IonPage>
  );
};

export default Home;
