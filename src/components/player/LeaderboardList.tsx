import React from 'react';
import { IonList, IonItem, IonLabel, IonAvatar, IonChip, IonIcon, IonNote } from '@ionic/react';
import { mapOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Team } from '../../data/types'; // Correct import path

interface LeaderboardListProps {
  teams: Team[];
  currentPlayerTeamId: string;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ teams, currentPlayerTeamId }) => {

  // Sort teams by score descending
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const getRankColor = (index: number): string => {
    if (index === 0) return 'warning'; // Gold for 1st
    if (index === 1) return 'medium';  // Silver for 2nd
    if (index === 2) return 'tertiary';// Bronze for 3rd
    return 'light'; // Default for others
  };

  const getRankTextColor = (index: number): string => {
     if (index === 0) return 'warning-contrast';
     if (index === 1) return 'medium-contrast';
     if (index === 2) return 'tertiary-contrast';
     return 'medium';
  };

  return (
    <IonList lines="full" className="leaderboard-list"> {/* Add class for potential specific styling */}
      {sortedTeams.map((team, index) => {
        const isPlayerTeam = team.id === currentPlayerTeamId;
        const rankColor = getRankColor(index);
        const rankTextColor = getRankTextColor(index);

        return (
          <IonItem
            key={team.id}
            detail={false}
            color={isPlayerTeam ? 'light' : undefined} // Utiliser light au lieu de primary pour l'équipe courante
            className={`leaderboard-item ${isPlayerTeam ? 'player-team' : ''}`}
            style={isPlayerTeam ? {
              '--background': 'rgba(255, 244, 229, 0.8)', // Fond légèrement orangé
              'borderLeft': '4px solid var(--ion-color-primary)',
              'fontWeight': 'bold'
            } : {}}
          >
            {/* Rank Number - More prominent */}
            <div
              slot="start"
              className={`rank-badge ion-text-center ${isPlayerTeam ? '' : `ion-color-${rankColor} ion-color-contrast-${rankTextColor}`}`}
              style={{
                 width: '36px',
                 height: '36px',
                 borderRadius: '50%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 fontWeight: 'bold',
                 fontSize: '1rem',
                 marginRight: '12px',
                 backgroundColor: isPlayerTeam ? 'var(--ion-color-primary)' : undefined,
                 color: isPlayerTeam ? 'white' : undefined,
              }}
             >
              {index + 1}
            </div>

            {/* Avatar */}
            <IonAvatar slot="start" className="leaderboard-avatar">
              <img
                  src={team.avatarUrl || `https://source.unsplash.com/random/100x100/?animal&sig=${team.id}`}
                  alt={team.name}
                  onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg')}
              />
            </IonAvatar>

            {/* Team Info */}
            <IonLabel className="leaderboard-label">
              <h2 className={`truncate ${isPlayerTeam ? 'font-bold' : ''}`} style={isPlayerTeam ? { color: 'var(--ion-color-primary)' } : {}}>
                {team.name} {isPlayerTeam ? '(Vous)' : ''}
              </h2>
              <IonNote color={isPlayerTeam ? 'primary' : 'medium'} className="ion-text-nowrap">
                <IonIcon icon={mapOutline} size="small" className="align-middle mr-1" /> {team.barsVisited} bars
                <span className="mx-2">|</span>
                <IonIcon icon={checkmarkCircleOutline} size="small" className="align-middle mr-1" /> {team.challengesCompleted} défis
              </IonNote>
            </IonLabel>

            {/* Score Chip */}
            <IonChip 
              slot="end" 
              color={isPlayerTeam ? 'primary' : 'medium'} 
              className="leaderboard-score-chip"
              style={isPlayerTeam ? { fontWeight: 'bold' } : {}}
            >
              {team.score}
            </IonChip>
          </IonItem>
        );
      })}
    </IonList>
  );
};

export default LeaderboardList; 