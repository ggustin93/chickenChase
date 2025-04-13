import React from 'react';
import { 
  IonList, 
  IonCard, 
  IonCardContent, 
  IonIcon,
  IonChip,
  IonLabel
} from '@ionic/react';
import { mapOutline, checkmarkCircleOutline, starOutline, timeOutline } from 'ionicons/icons';
import { Team } from '../../data/types';
import './LeaderboardList.css';

interface LeaderboardListProps {
  teams: Team[];
  currentPlayerTeamId: string;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ teams, currentPlayerTeamId }) => {

  // Fonction pour déterminer les couleurs en fonction du classement
  const getRankStyle = (index: number) => {
    if (index === 0) return "rank-first"; // Or pour le 1er
    if (index === 1) return "rank-second"; // Argent pour le 2ème
    if (index === 2) return "rank-third"; // Bronze pour le 3ème
    return "rank-other"; // Gris pour les autres
  };

  const renderTeamCard = (team: Team, index: number) => {
    const isPlayerTeam = team.id === currentPlayerTeamId;
    
    return (
      <IonCard 
        key={team.id} 
        className={`team-card ${isPlayerTeam ? 'player-team-card' : ''}`}
      >
        <IonCardContent className="team-card-content">
          {/* Rang */}
          <div className={`team-rank ${getRankStyle(index)}`}>
            <div className="rank-number">{index + 1}</div>
          </div>
          
          {/* Nom d'équipe et statut */}
          <div className="team-name-status-container">
            <h3 className="team-name fantasy-font">{team.name} {isPlayerTeam && <span className="player-indicator">(Vous)</span>}</h3>
            
            {/* Pour les équipes terminées, on pourrait ajouter un badge */}
            {team.foundChicken && (
              <IonChip color="success" className="team-status-chip">
                <IonIcon icon={checkmarkCircleOutline} />
                <IonLabel>Trouvé</IonLabel>
              </IonChip>
            )}
          </div>
          
          {/* Statistiques */}
          <div className="team-stats">
            <div className="team-stat">
              <IonIcon icon={mapOutline} />
              <span>{team.barsVisited}</span>
            </div>
            <div className="team-stat">
              <IonIcon icon={checkmarkCircleOutline} />
              <span>{team.challengesCompleted}</span>
            </div>
            {team.foundChicken && (
              <div className="team-stat">
                <IonIcon icon={timeOutline} />
                <span>Terminé</span>
              </div>
            )}
          </div>
          
          {/* Score */}
          <div className="team-score">
            <div className="score-value">
              <IonIcon icon={starOutline} />
              <span>{team.score}</span>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  return (
    <div className="teams-list-container">
      {teams.map((team, index) => renderTeamCard(team, index))}
    </div>
  );
};

export default LeaderboardList; 