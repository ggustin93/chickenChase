import React from 'react';
import {
  IonContent, IonCard, IonCardContent, IonButton, IonIcon, IonChip,
  IonInput, IonText, IonGrid, IonRow, IonCol,
  IonBadge, IonRippleEffect, IonSkeletonText, IonFab, IonFabButton
} from '@ionic/react';
import { 
  star, people, personAdd, add, copy, share, trophy, 
  checkmarkCircle, alertCircle, time, person, refresh
} from 'ionicons/icons';
import { Player, Team, Game } from '../types/types';
import '../styles/modern-lobby.css';

interface ImprovedLobbyViewProps {
  game: Game | null;
  teams: Team[];
  players: Player[];
  currentPlayer: Player | undefined;
  onJoinTeam: (teamId: string) => void;
  onBeChicken: () => void;
  onCreateTeam: () => void;
  newTeamName: string;
  setNewTeamName: (name: string) => void;
  onCopyCode: () => void;
  onRefresh?: () => void;
  loading: boolean;
}

const ImprovedLobbyView: React.FC<ImprovedLobbyViewProps> = ({
  game,
  teams,
  players,
  currentPlayer,
  onJoinTeam,
  onBeChicken,
  onCreateTeam,
  newTeamName,
  setNewTeamName,
  onCopyCode,
  onRefresh,
  loading
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const chickenTeam = teams.find(team => team.is_chicken_team);
  const hunterTeams = teams.filter(team => !team.is_chicken_team);
  const playersWithoutTeam = players.filter(p => !p.team_id);
  
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Petit délai pour le feedback visuel
    }
  };
  
  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.team_id === teamId);
  };

  if (loading) {
    return <LobbySkeletonLoader />;
  }

  return (
    <IonContent className="lobby-content-modern">
      {/* Header moderne avec information de partie */}
      <div className="modern-lobby-header">
        <div className="header-content">
          
          {/* Code de partie - Élément principal centré */}
          <div className="game-code-section">
            <IonText className="code-label">Code de la partie</IonText>
            <div className="game-code-display" onClick={onCopyCode}>
              <span className="code-text">{game?.join_code}</span>
              <IonButton 
                fill="clear" 
                size="small"
                onClick={onCopyCode}
                className="copy-button"
              >
                <IonIcon icon={copy} />
                Copier
              </IonButton>
            </div>
          </div>

          {/* Statistiques simplifiées - Layout horizontal */}
          <div className="simple-stats-row">
            <div className="stat-simple">
              <IonIcon icon={person} />
              <span>{players.length} joueur{players.length > 1 ? 's' : ''}</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-simple">
              <IonIcon icon={people} />
              <span>{teams.length} équipe{teams.length > 1 ? 's' : ''}</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-simple">
              <IonIcon icon={time} />
              <span>{game?.game_duration || 120} min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="modern-content-area">
        {/* Section Équipe Poulet */}
        {!chickenTeam ? (
          <ChickenTeamCallToAction onBeChicken={onBeChicken} />
        ) : (
          <ChickenTeamDisplay 
            team={chickenTeam} 
            players={getTeamPlayers(chickenTeam.id)}
            onJoinChicken={!currentPlayer?.team_id ? onBeChicken : undefined}
            isCurrentPlayerInChicken={currentPlayer?.team_id === chickenTeam.id}
          />
        )}

        {/* Section Équipes Chasseurs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Équipes Chasseurs</h2>
            <IonChip color="hunter" outline>
              <IonText>{hunterTeams.length} équipes</IonText>
            </IonChip>
          </div>

          {hunterTeams.length > 0 ? (
            <div className="space-y-3">
              {hunterTeams.map(team => (
                <HunterTeamCard
                  key={team.id}
                  team={team}
                  players={getTeamPlayers(team.id)}
                  onJoinTeam={onJoinTeam}
                  isCurrentPlayerTeam={currentPlayer?.team_id === team.id}
                  maxTeams={undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyTeamsState />
          )}
        </div>

        {/* Section Création d'équipe */}
        <CreateTeamSection
          newTeamName={newTeamName}
          setNewTeamName={setNewTeamName}
          onCreateTeam={onCreateTeam}
        />

        {/* Joueurs sans équipe */}
        {playersWithoutTeam.length > 0 && (
          <PlayersWithoutTeamSection players={playersWithoutTeam} />
        )}
      </div>

      {/* Floating Action Buttons */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton size="small" color="secondary">
          <IonIcon icon={share} />
        </IonFabButton>
      </IonFab>
      
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
    </IonContent>
  );
};

// Composants auxiliaires pour une meilleure modularité

const LobbySkeletonLoader: React.FC = () => (
  <IonContent>
    <div className="p-4 space-y-4">
      <IonSkeletonText animated style={{ width: '60%', height: '2rem' }} />
      <IonSkeletonText animated style={{ width: '40%', height: '1.5rem' }} />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <IonSkeletonText key={i} animated style={{ width: '100%', height: '4rem' }} />
        ))}
      </div>
    </div>
  </IonContent>
);

const ChickenTeamCallToAction: React.FC<{ onBeChicken: () => void }> = ({ onBeChicken }) => (
  <IonCard className="card-elevated mb-6 overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-300 opacity-90"></div>
    <IonCardContent className="text-center py-6 relative z-10">
      <div className="mb-3">
        <IonIcon 
          icon={star} 
          className="text-5xl text-amber-600" 
        />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        Devenir l'Équipe Poulet
      </h3>
      <p className="text-gray-800 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
        Soyez la cible de tous les chasseurs et menez le jeu !
      </p>
      <div className="flex justify-center items-center gap-2 mb-4">
        <IonBadge color="light" className="text-gray-800 font-medium px-3">
          🎯 Haute Récompense
        </IonBadge>
      </div>
      <IonButton 
        size="default" 
        expand="block"
        onClick={onBeChicken}
        className="mx-4"
        fill="solid"
        style={{
          '--background': '#f59e0b',
          '--background-hover': '#d97706',
          '--color': '#1f2937',
          '--border-radius': '12px',
          fontWeight: '600'
        }}
      >
        <IonIcon icon={star} slot="start" />
        Rejoindre l'Équipe Poulet
        <IonRippleEffect />
      </IonButton>
    </IonCardContent>
  </IonCard>
);

const ChickenTeamDisplay: React.FC<{ 
  team: Team; 
  players: Player[];
  onJoinChicken?: () => void;
  isCurrentPlayerInChicken?: boolean;
}> = ({ team, players, onJoinChicken, isCurrentPlayerInChicken }) => (
  <IonCard className="team-card team-chicken mb-6">
    <IonCardContent>
      <div className="team-header">
        <div className="team-title">
          <IonIcon icon={star} className="team-icon" />
          <h3>{team.name}</h3>
          <div className="team-badge">Équipe Poulet</div>
        </div>
        <div className="flex items-center gap-2">
          <IonChip color="chicken" outline>
            <IonText>{players.length} membre{players.length > 1 ? 's' : ''}</IonText>
          </IonChip>
          {onJoinChicken && (
            <IonButton 
              size="small" 
              color="chicken"
              fill="outline"
              onClick={onJoinChicken}
            >
              <IonIcon icon={personAdd} slot="start" />
              Rejoindre
            </IonButton>
          )}
        </div>
      </div>
      
      {players.length > 0 && (
        <div className="team-members">
          {players.map(player => (
            <div key={player.id} className={`member-chip ${isCurrentPlayerInChicken && player.id === player.id ? 'current-player' : ''}`}>
              <IonIcon icon={trophy} size="small" />
              {player.nickname}
              {isCurrentPlayerInChicken && <span className="you-badge"> (Vous)</span>}
            </div>
          ))}
        </div>
      )}
    </IonCardContent>
  </IonCard>
);

const HunterTeamCard: React.FC<{
  team: Team;
  players: Player[];
  onJoinTeam: (teamId: string) => void;
  isCurrentPlayerTeam: boolean;
  maxTeams?: number;
}> = ({ team, players, onJoinTeam, isCurrentPlayerTeam, maxTeams }) => (
  <IonCard className={`team-card team-hunter ${isCurrentPlayerTeam ? 'border-2 border-blue-500' : ''}`}>
    <IonCardContent>
      <div className="team-header">
        <div className="team-title">
          <IonIcon icon={people} className="team-icon" />
          <h4>{team.name}</h4>
          {isCurrentPlayerTeam && (
            <IonBadge color="success">
              <IonIcon icon={checkmarkCircle} />
              Votre équipe
            </IonBadge>
          )}
        </div>
        
        {!isCurrentPlayerTeam && (
          <div className="button-theme">
            <IonButton 
              fill="outline" 
              size="small"
              onClick={() => onJoinTeam(team.id)}
              className="btn-secondary"
              color="hunter"
            >
              <IonIcon icon={personAdd} slot="start" />
              Rejoindre
            </IonButton>
          </div>
        )}
      </div>
      
      {players.length > 0 && (
        <div className="team-members">
          {players.map(player => (
            <div key={player.id} className="member-chip">
              {player.nickname}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <IonIcon icon={person} />
        <span>{players.length} membre{players.length > 1 ? 's' : ''}</span>
        {maxTeams && (
          <>
            <span>•</span>
            <span>Max: {maxTeams}</span>
          </>
        )}
      </div>
    </IonCardContent>
  </IonCard>
);

const EmptyTeamsState: React.FC = () => (
  <div className="empty-state-enhanced">
    <div className="flex justify-center mb-4">
      <IonIcon icon={people} className="text-6xl" />
    </div>
    <h3 className="text-lg font-medium mb-2 text-gray-700">Aucune équipe chasseur créée</h3>
    <p className="text-sm opacity-75 leading-relaxed">Soyez le premier à créer votre équipe et rejoignez l'aventure !</p>
  </div>
);

const CreateTeamSection: React.FC<{
  newTeamName: string;
  setNewTeamName: (name: string) => void;
  onCreateTeam: () => void;
}> = ({ newTeamName, setNewTeamName, onCreateTeam }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      onCreateTeam();
    }
  };

  return (
    <IonCard className="mb-6 shadow-sm">
      <IonCardContent>
        <div className="flex items-center gap-2 mb-4">
          <IonIcon icon={add} className="text-green-500" />
          <h3 className="text-lg font-medium text-gray-800">Créer une Nouvelle Équipe</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="form-enhanced space-y-4">
          <IonInput
            value={newTeamName}
            placeholder="Ex: Les Ninjas, Team Alpha..."
            onIonInput={(e) => setNewTeamName(e.detail.value!)}
            fill="outline"
            shape="round"
            maxlength={25}
            counter={true}
            className="w-full"
            helperText="Choisissez un nom accrocheur pour votre équipe"
          />
          
          <IonButton
            type="submit"
            expand="block"
            shape="round"
            disabled={!newTeamName.trim()}
            className="btn-success mt-4"
          >
            <IonIcon icon={add} slot="start" />
            Créer l'Équipe
          </IonButton>
        </form>
      </IonCardContent>
    </IonCard>
  );
};

const PlayersWithoutTeamSection: React.FC<{ players: Player[] }> = ({ players }) => (
  <IonCard>
    <IonCardContent>
      <div className="flex items-center gap-2 mb-3">
        <IonIcon icon={alertCircle} className="text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">Joueurs sans Équipe</h3>
        <IonBadge color="warning">{players.length}</IonBadge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {players.map(player => (
          <IonChip key={player.id} color="medium" outline>
            {player.nickname}
          </IonChip>
        ))}
      </div>
    </IonCardContent>
  </IonCard>
);

export default ImprovedLobbyView;