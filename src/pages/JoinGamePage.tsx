import {
  IonContent, IonPage, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonTitle, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonInput, IonButton, IonIcon,
  useIonToast, IonLoading
} from '@ionic/react';
import { logInOutline } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import { PostgrestError } from '@supabase/supabase-js';

const JoinGamePage: React.FC = () => {
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { setSession } = useSession();
  const [present] = useIonToast();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    if (code) {
      setJoinCode(code.toUpperCase());
    }
  }, [location.search]);

  const handleJoinGame = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim() || !nickname.trim()) {
      present({
        message: 'Le code de la partie et le pseudo sont requis.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Trouver l'ID de la partie avec le code
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('id')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (gameError || !gameData) {
        throw new Error("Partie non trouvée ou code invalide.");
      }
      const game_id = gameData.id;

      // 2. Vérifier si le pseudo est déjà utilisé dans cette partie
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', game_id)
        .eq('nickname', nickname)
        .maybeSingle();
        
      if (existingPlayer) {
        throw new Error("Ce pseudo est déjà utilisé dans cette partie. Veuillez en choisir un autre.");
      }

      // 3. Créer le nouveau joueur dans cette partie
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: game_id, nickname: nickname })
        .select('id')
        .single();

      if (playerError) {
        // Vérifier spécifiquement l'erreur de conflit
        if (playerError.code === '23505') {
          throw new Error("Ce pseudo est déjà utilisé dans cette partie. Veuillez en choisir un autre.");
        }
        throw playerError;
      }
      
      if (!playerData) {
        throw new Error("Impossible de créer le joueur.");
      }
      const player_id = playerData.id;

      // 4. Mettre à jour la session dans le contexte
      setSession({ playerId: player_id, gameId: game_id, nickname });
      
      // 5. Redirection avec un court délai pour s'assurer que la session est bien mise à jour
      // et utiliser history au lieu de router pour une navigation plus fiable
      setTimeout(() => {
        console.log("Redirection vers le lobby...", game_id);
        history.replace(`/lobby/${game_id}`);
      }, 100);

    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre une partie:', error);
      let message = 'Une erreur inconnue est survenue.';
      if (error instanceof PostgrestError) {
        if (error.code === '23505') {
          message = 'Ce pseudo est déjà utilisé dans cette partie. Veuillez en choisir un autre.';
        } else {
          message = `Erreur: ${error.message}`;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      present({
        message: message,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Rejoindre une Partie</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message={'Recherche de la partie...'} />
        <div className="flex flex-col items-center justify-center h-full">
          <IonCard className="w-full max-w-md mx-auto">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center text-2xl">Entrez les informations</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleJoinGame} style={{ width: '100%' }}>
                <IonItem className="mb-4" style={{ width: '100%' }}>
                  <IonInput
                    label="Code de la partie"
                    labelPlacement="floating"
                    value={joinCode}
                    onIonInput={(e) => setJoinCode(e.detail.value!)}
                    maxlength={6}
                    clearInput
                    required
                    autocapitalize="characters"
                    onIonChange={(e) => setJoinCode(e.detail.value!.toUpperCase())}
                    style={{ width: '100%' }}
                  ></IonInput>
                </IonItem>
                <IonItem className="mb-6" style={{ width: '100%' }}>
                  <IonInput
                    label="Votre surnom"
                    labelPlacement="floating"
                    value={nickname}
                    onIonInput={(e) => setNickname(e.detail.value!)}
                    clearInput
                    required
                    style={{ width: '100%' }}
                  ></IonInput>
                </IonItem>
                <IonButton
                  onClick={handleJoinGame}
                  type="submit"
                  expand="block"
                  size="large"
                  disabled={!joinCode || !nickname || loading}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  <IonIcon slot="start" icon={logInOutline} />
                  C'est Parti !
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JoinGamePage; 