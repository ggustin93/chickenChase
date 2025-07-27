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

  const handleJoinGame = async (e?: React.FormEvent) => {
    e?.preventDefault(); // Empêcher la soumission normale du formulaire
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
      const gameId = gameData.id;

      // 2. Vérifier si le pseudo est déjà utilisé dans cette partie
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', gameId)
        .eq('nickname', nickname)
        .maybeSingle();
        
      if (existingPlayer) {
        throw new Error("Ce pseudo est déjà utilisé dans cette partie. Veuillez en choisir un autre.");
      }

      // 3. Créer le nouveau joueur dans cette partie
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: gameId, nickname: nickname.trim() })
        .select()
        .single();

      if (playerError) throw playerError;
      
      if (!playerData) {
        throw new Error("Impossible de créer le joueur.");
      }

      // Tentative d'authentification anonyme (optionnelle)
      try {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (!authError && authData.user) {
          // Lier l'utilisateur authentifié au joueur si l'auth réussit
          await supabase
            .from('players')
            .update({ user_id: authData.user.id })
            .eq('id', playerData.id);
        }
      } catch (authError) {
        console.warn('Auth not available, continuing without:', authError);
        // Continue sans authentification - le jeu fonctionnera quand même
      }

      setSession({
        playerId: playerData.id,
        nickname: playerData.nickname,
        gameId: gameId,
        teamId: null
      });
      
      history.push(`/lobby/${gameId}`);

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
              <form onSubmit={(e) => handleJoinGame(e)} style={{ width: '100%' }}>
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