import React from 'react';
import { IonList, IonItem, IonIcon } from '@ionic/react';
import { mapOutline, checkmarkCircleOutline, trophyOutline } from 'ionicons/icons';
import { Team } from '../../data/types'; // Correct import path
import './LeaderboardList.css'; // Import the new CSS

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
            lines="none" // Remove default lines, use CSS border if needed
            detail={false}
            className={`leaderboard-item ${isPlayerTeam ? 'player-team' : ''}`}
            // Remove inline style for background, handle in CSS
          >
            <div className="leaderboard-item-content">
              {/* Rank Number */}
              <div
                className={`leaderboard-item-rank ion-text-center ${isPlayerTeam ? '' : `ion-color-${rankColor} ion-color-contrast-${rankTextColor}`}`}
                style={{
                  backgroundColor: isPlayerTeam ? 'var(--ion-color-primary)' : undefined,
                  color: isPlayerTeam ? 'white' : undefined,
                  // Other styles are in CSS
                }}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="leaderboard-item-avatar">
                <img
                  src={team.avatarUrl || `https://source.unsplash.com/random/100x100/?animal&sig=${team.id}`}
                  alt={team.name}
                  onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/avatar.svg')}
                />
              </div>

              {/* Team Info */}
              <div className="leaderboard-item-info">
                <div className="leaderboard-item-header">
                  <h3 className={`leaderboard-item-name ${isPlayerTeam ? 'player-team-name' : ''}`}>
                    {team.name} {isPlayerTeam ? '(Vous)' : ''}
                  </h3>
                  {/* Score - Replaces IonChip */}
                  <div className={`leaderboard-item-score ${isPlayerTeam ? 'player-team-score' : ''}`}>
                    <IonIcon icon={trophyOutline} />
                    {team.score}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="leaderboard-item-stats">
                  <div className="leaderboard-stat">
                    <IonIcon icon={mapOutline} /> {team.barsVisited} bars
                  </div>
                  <div className="leaderboard-stat">
                    <IonIcon icon={checkmarkCircleOutline} /> {team.challengesCompleted} défis
                  </div>
                </div>
              </div>
            </div>
          </IonItem>
        );
      })}
    </IonList>
  );
};

export default LeaderboardList; 