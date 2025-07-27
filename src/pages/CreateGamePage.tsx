import {
  IonContent, IonPage, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonTitle, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonInput, IonButton, IonIcon,
  useIonToast, IonLoading, IonLabel, IonNote, IonToggle
} from '@ionic/react';
import { gameControllerOutline, cashOutline, peopleOutline, timeOutline } from 'ionicons/icons';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import { PostgrestError } from '@supabase/supabase-js';

interface GameConfig {
  hostNickname: string;
  cagnotteInitial: number;
  maxTeams?: number;
  gameDuration?: number;
}

const CreateGamePage: React.FC = () => {
  const [config, setConfig] = useState<GameConfig>({
    hostNickname: '',
    cagnotteInitial: 50, // En euros pour l'interface utilisateur
    maxTeams: undefined,
    gameDuration: 120
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { setSession } = useSession();
  const [present] = useIonToast();

  const handleCreateGame = async () => {
    if (!config.hostNickname.trim()) {
      present({
        message: 'Votre pseudo est requis pour créer une partie.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    if (config.cagnotteInitial < 0) {
      present({
        message: 'La cagnotte ne peut pas être négative.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      // Authentification anonyme pour obtenir un user_id
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Authentication failed.");

      // Appeler la fonction améliorée avec tous les paramètres
      const { data, error } = await supabase.rpc('create_game_and_host', {
        host_nickname: config.hostNickname.trim(),
        cagnotte_initial: config.cagnotteInitial * 100, // Convertir en centimes
        max_teams: config.maxTeams || null,
        game_duration: config.gameDuration || 120
      });

      if (error || !data) {
        console.error('Error calling create_game_and_host:', error);
        throw new Error(error?.message || "Impossible de créer la partie. Le majordome a échoué !");
      }
      
      if (!data.success) {
        throw new Error("La création de partie a échoué.");
      }

      const { game_id, player_id, join_code } = data;

      // Lier l'utilisateur authentifié au joueur créé
      const { error: updatePlayerError } = await supabase
        .from('players')
        .update({ user_id: authData.user.id })
        .eq('id', player_id);

      if (updatePlayerError) {
        console.warn('Warning updating player user_id:', updatePlayerError);
        // Ne pas faire échouer la création pour ça
      }

      // Configurer la session
      setSession({ 
        playerId: player_id, 
        gameId: game_id, 
        nickname: config.hostNickname.trim(),
        teamId: null
      });

      // Afficher le code de partie créé
      present({
        message: `Partie créée ! Code: ${join_code}`,
        duration: 4000,
        color: 'success'
      });

      // Naviguer vers le lobby
      history.push(`/lobby/${game_id}`);

    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
      let message = 'Une erreur inconnue est survenue.';
      if (error instanceof PostgrestError) {
        message = `Erreur: ${error.message}`;
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
          <IonTitle>Créer une Partie</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message={'Création de la partie...'} />
        
        <div className="flex flex-col items-center justify-center h-full">
          <IonCard className="w-full max-w-md mx-auto">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center text-2xl">
                <IonIcon icon={gameControllerOutline} /> Nouvelle Partie
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form style={{ width: '100%' }}>
                {/* Pseudo organisateur - REQUIS */}
                <IonItem className="mb-4" style={{ width: '100%' }}>
                  <IonInput
                    label="Votre pseudo (organisateur)"
                    labelPlacement="floating"
                    value={config.hostNickname}
                    onIonInput={(e) => setConfig(prev => ({ ...prev, hostNickname: e.detail.value! }))}
                    clearInput
                    required
                    placeholder="Ex: Alex"
                    style={{ width: '100%' }}
                  />
                </IonItem>

                {/* Cagnotte initiale - REQUIS */}
                <IonItem className="mb-4" style={{ width: '100%' }}>
                  <IonIcon icon={cashOutline} slot="start" />
                  <IonInput
                    label="Cagnotte initiale (€)"
                    labelPlacement="floating"
                    type="number"
                    min="0"
                    step="5"
                    value={config.cagnotteInitial}
                    onIonInput={(e) => setConfig(prev => ({ 
                      ...prev, 
                      cagnotteInitial: parseFloat(e.detail.value!) || 0 
                    }))}
                    required
                    style={{ width: '100%' }}
                  />
                  <IonNote slot="helper">Montant total pour les consommations du poulet</IonNote>
                </IonItem>

                {/* Toggle pour paramètres avancés */}
                <IonItem className="mb-4">
                  <IonLabel>Paramètres avancés</IonLabel>
                  <IonToggle 
                    checked={showAdvanced} 
                    onIonChange={(e) => setShowAdvanced(e.detail.checked)}
                  />
                </IonItem>

                {/* Paramètres avancés - OPTIONNELS */}
                {showAdvanced && (
                  <>
                    <IonItem className="mb-4" style={{ width: '100%' }}>
                      <IonIcon icon={peopleOutline} slot="start" />
                      <IonInput
                        label="Limite d'équipes (optionnel)"
                        labelPlacement="floating"
                        type="number"
                        min="1"
                        value={config.maxTeams}
                        onIonInput={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxTeams: e.detail.value ? parseInt(e.detail.value) : undefined
                        }))}
                        clearInput
                        placeholder="Illimité"
                        style={{ width: '100%' }}
                      />
                      <IonNote slot="helper">Laisser vide pour aucune limite</IonNote>
                    </IonItem>

                    <IonItem className="mb-6" style={{ width: '100%' }}>
                      <IonIcon icon={timeOutline} slot="start" />
                      <IonInput
                        label="Durée de partie (minutes)"
                        labelPlacement="floating"
                        type="number"
                        min="30"
                        max="480"
                        value={config.gameDuration}
                        onIonInput={(e) => setConfig(prev => ({ 
                          ...prev, 
                          gameDuration: parseInt(e.detail.value!) || 120
                        }))}
                        required
                        style={{ width: '100%' }}
                      />
                      <IonNote slot="helper">Recommandé: 120 minutes (2h)</IonNote>
                    </IonItem>
                  </>
                )}

                <IonButton
                  onClick={handleCreateGame}
                  expand="block"
                  size="large"
                  disabled={!config.hostNickname.trim() || loading}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  <IonIcon slot="start" icon={gameControllerOutline} />
                  Créer la Partie
                </IonButton>
              </form>

              {/* Informations d'aide */}
              <div className="ion-margin-top ion-text-center">
                <IonNote>
                  Un code de 6 caractères sera généré pour que les joueurs puissent rejoindre la partie.
                </IonNote>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateGamePage;