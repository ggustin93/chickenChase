import { 
  IonContent, IonPage, IonButton, IonIcon, IonCard, IonCardContent, 
  useIonToast, IonSkeletonText, IonText, IonChip, IonImg, IonAlert 
} from '@ionic/react';
import { add, logIn, gameController, time, person, refresh } from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import '../styles/modern-lobby.css';
import '../styles/ux-enhancements.css';
import logo from '../assets/images/logo.png';

interface Game {
  id: string;
  join_code: string;
  status: string;
}

const Home: React.FC = () => {
  const router = useIonRouter();
  const { session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showSessionAlert, setShowSessionAlert] = useState(false);
  const [sessionGame, setSessionGame] = useState<Game | null>(null);
  const [present] = useIonToast();

  // Vérifier la session existante au chargement
  useEffect(() => {
    const checkExistingSession = async () => {
      if (session.playerId && session.gameId) {
        try {
          // Vérifier que la partie et le joueur existent toujours
          const [{ data: gameData, error: gameError }, { data: playerData, error: playerError }] = await Promise.all([
            supabase.from('games').select('*').eq('id', session.gameId).single(),
            supabase.from('players').select('*').eq('id', session.playerId).single()
          ]);

          if (!gameError && !playerError && gameData && playerData) {
            // La session est valide, proposer de reprendre
            setSessionGame(gameData);
            setShowSessionAlert(true);
          } else {
            // Session invalide, la nettoyer
            present({
              message: 'Session expirée. Veuillez rejoindre une nouvelle partie.',
              duration: 3000,
              color: 'warning'
            });
          }
        } catch (error) {
          console.error('Error checking session:', error);
        }
      }
      setCheckingSession(false);
    };

    checkExistingSession();
  }, [session, present]);

  const handleResumeGame = () => {
    if (sessionGame) {
      // Rediriger vers la page appropriée selon le statut
      if (sessionGame.status === 'lobby') {
        router.push(`/lobby/${sessionGame.id}`, 'forward', 'replace');
      } else if (sessionGame.status === 'in_progress' || sessionGame.status === 'chicken_hidden') {
        // Déterminer la page selon le rôle (poulet ou chasseur)
        // Pour l'instant on va vers la page joueur générique
        router.push(`/player/${sessionGame.id}`, 'forward', 'replace');
      } else {
        present({
          message: 'Cette partie est terminée.',
          duration: 3000,
          color: 'warning'
        });
      }
    }
    setShowSessionAlert(false);
  };

  const handleNewSession = () => {
    // Nettoyer la session actuelle
    localStorage.removeItem('player-session');
    setShowSessionAlert(false);
    present({
      message: 'Session effacée. Vous pouvez maintenant créer ou rejoindre une nouvelle partie.',
      duration: 3000,
      color: 'success'
    });
  };

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

  const handleCreateGame = () => {
    router.push('/create-game', 'forward', 'replace');
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
      <IonContent className="lobby-content-modern">
        {/* Alert pour session existante */}
        <IonAlert
          isOpen={showSessionAlert}
          onDidDismiss={() => setShowSessionAlert(false)}
          header="Session existante détectée"
          message={`Vous étiez connecté à la partie ${sessionGame?.join_code}. Voulez-vous la reprendre ou commencer une nouvelle session ?`}
          buttons={[
            {
              text: 'Nouvelle session',
              role: 'destructive',
              handler: handleNewSession
            },
            {
              text: 'Reprendre',
              role: 'confirm',
              handler: handleResumeGame
            }
          ]}
        />

        {/* Indicateur de chargement session */}
        {checkingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-600">Vérification de la session...</p>
            </div>
          </div>
        )}

        {/* Header compact avec branding optimisé */}
        <div className="modern-lobby-header header-enhanced" style={{ background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' }}>
          <div className="header-content" style={{ padding: '1.5rem 1.5rem 2rem' }}>
            <div className="text-center">
              {/* Branding compact */}
              <div className="mb-3">
                <h1 
                  className="text-2xl font-bold text-white mb-3 title-enhanced"
                  style={{ 
                    fontFamily: "var(--ion-font-fantasy)", 
                    fontWeight: 'normal',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}
                >
                  CHICKEN CHASE
                </h1>
                <IonImg
                  src={logo}
                  alt="Chicken Chase Logo"
                  style={{ 
                    maxWidth: '100px', 
                    width: '50%', 
                    height: 'auto', 
                    margin: '0 auto',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                    transition: 'transform 0.3s ease-in-out'
                  }}
                  className="rounded-md shadow-sm logo-enhanced hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal avec espacement affiné */}
        <div className="ion-padding" style={{ paddingTop: '2rem' }}>
          <div className="space-y-4 max-w-lg mx-auto w-full">
            {/* CTA Principal - Créer une Partie */}
            <IonCard className="card-elevated card-enhanced cta-primary-enhanced card-interactive-enhanced ripple-enhanced">
              <IonCardContent className="text-center py-6">
                <IonButton 
                  size="large" 
                  expand="block"
                  onClick={handleCreateGame}
                  className="button-enhanced focus-enhanced"
                  fill="solid"
                  color="primary"
                  style={{
                    '--border-radius': '16px',
                    fontWeight: '700',
                    height: '60px',
                    fontSize: '1.2rem'
                  }}
                >
                  <IonIcon icon={add} slot="start" />
                  Créer une Partie
                </IonButton>
                <p className="enhanced-text-muted text-xs mt-2 leading-relaxed">
                  Lancez une nouvelle aventure et invitez vos amis.
                </p>
              </IonCardContent>
            </IonCard>

            {/* CTA Secondaire - Rejoindre */}
            <IonCard className="card-elevated card-enhanced cta-secondary-enhanced card-interactive-enhanced ripple-enhanced">
              <IonCardContent className="text-center py-6">
                <IonButton 
                  size="large" 
                  expand="block"
                  onClick={handleJoinGame}
                  className="button-enhanced focus-enhanced"
                  fill="outline"
                  color="dark"
                  style={{
                    '--border-radius': '16px',
                    fontWeight: '700',
                    height: '60px',
                    fontSize: '1.2rem'
                  }}
                >
                  <IonIcon icon={logIn} slot="start" />
                  Rejoindre une Partie
                </IonButton>
                <p className="enhanced-text-muted text-xs mt-2 leading-relaxed">
                  Utilisez un code pour accéder à une partie existante.
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Lien discret vers Parties en cours */}
          {games.length > 0 && (
            <div className="text-center mt-8 pb-2">
              <button 
                onClick={() => {
                  const element = document.getElementById('parties-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="enhanced-text-secondary text-base underline hover:text-orange-500 transition-colors duration-300"
              >
                Voir les parties en cours ({games.length})
              </button>
            </div>
          )}
          
          {/* Section Parties en cours - avec marge ajustée */}
          <div id="parties-section" className="mt-8">
            {loading ? (
              <GameListSkeleton />
            ) : games.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="section-title-enhanced">Parties en cours</h2>
                  <IonChip 
                    color="medium" 
                    outline
                    className="transition-all duration-300 hover:scale-105"
                    style={{ 
                      '--background': 'rgba(251, 146, 60, 0.1)',
                      '--color': '#ea580c',
                      fontWeight: '600'
                    }}
                  >
                    <IonText>{games.length} partie{games.length > 1 ? 's' : ''}</IonText>
                  </IonChip>
                </div>
                <div className="game-list-enhanced">
                  {games.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onJoin={() => handleJoinSpecificGame(game.join_code)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="pt-8">
                <EmptyGamesState />
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

// Composants auxiliaires pour une meilleure modularité

const GameListSkeleton: React.FC = () => (
  <div className="game-list-enhanced">
    {[1, 2, 3].map(i => (
      <IonCard key={i} className="card-elevated card-spacing-enhanced">
        <IonCardContent className="content-spacing-enhanced">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <IonSkeletonText 
                animated 
                style={{ width: '48px', height: '48px', borderRadius: '12px' }} 
                className="skeleton-enhanced"
              />
              <div>
                <IonSkeletonText 
                  animated 
                  style={{ width: '140px', height: '18px', borderRadius: '4px', marginBottom: '8px' }} 
                  className="skeleton-enhanced"
                />
                <IonSkeletonText 
                  animated 
                  style={{ width: '200px', height: '16px', borderRadius: '4px' }} 
                  className="skeleton-enhanced"
                />
              </div>
            </div>
            <IonSkeletonText 
              animated 
              style={{ width: '90px', height: '36px', borderRadius: '18px' }} 
              className="skeleton-enhanced"
            />
          </div>
        </IonCardContent>
      </IonCard>
    ))}
  </div>
);

const GameCard: React.FC<{
  game: Game;
  onJoin: () => void;
}> = ({ game, onJoin }) => (
  <IonCard 
    className="card-elevated game-card-enhanced card-enhanced card-interactive-enhanced ripple-enhanced card-spacing-enhanced" 
    onClick={onJoin}
  >
    <IonCardContent className="content-spacing-enhanced">
      <div className="team-header">
        <div className="team-title">
          <IonIcon icon={gameController} className="team-icon text-orange-500 icon-enhanced text-3xl" />
          <div>
            <h4 className="text-lg enhanced-text-primary">Partie {game.join_code}</h4>
            <p className="enhanced-text-secondary mt-1">En attente de joueurs...</p>
          </div>
        </div>
        
        <div className="button-theme">
          <IonButton 
            fill="outline" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="btn-secondary button-enhanced focus-enhanced"
            color="dark"
            style={{
              '--border-radius': '12px',
              fontWeight: '600',
              height: '40px'
            }}
          >
            <IonIcon icon={logIn} slot="start" />
            Rejoindre
          </IonButton>
        </div>
      </div>
      
      <div className="flex items-center gap-3 enhanced-text-muted mt-4 text-sm">
        <div className="flex items-center gap-1">
          <IonIcon icon={time} className="text-base" />
          <span>Lobby ouvert</span>
        </div>
        <span className="opacity-50">•</span>
        <div className="flex items-center gap-1">
          <IonIcon icon={person} className="text-base" />
          <span>En attente</span>
        </div>
      </div>
    </IonCardContent>
  </IonCard>
);

const EmptyGamesState: React.FC = () => (
  <div className="empty-state-enhanced content-spacing-enhanced">
    <div className="flex justify-center mb-6">
      <IonIcon icon={gameController} className="text-7xl text-gray-400 opacity-60" />
    </div>
    <h3 className="enhanced-text-primary text-xl mb-3 text-center">Aucune partie en cours</h3>
    <p className="enhanced-text-secondary text-center leading-relaxed max-w-sm mx-auto">
      Soyez le premier à créer une partie et invitez vos amis à vous rejoindre pour commencer l'aventure !
    </p>
  </div>
);

export default Home;
