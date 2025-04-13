import React, { useMemo } from 'react';
import {
  IonContent,
  IonText,
  IonIcon,
  IonSkeletonText,
  IonChip,
  IonLabel,
  IonCard,
  IonCardContent,
  IonButton,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { 
  peopleOutline, 
  locationOutline, 
  checkmarkCircleOutline,
  ribbonOutline,
  flagOutline,
  starOutline
} from 'ionicons/icons';

import { ChickenGameState } from '../../data/types';
import './TeamsTabContent.css';

interface TeamsTabContentProps {
  gameState: ChickenGameState;
  markTeamFound: (teamId: string) => void;
  isLoading?: boolean;
}

// Loading skeleton for team items
const TeamItemSkeleton: React.FC = () => {
  return (
    <IonCard className="team-skeleton-card">
      <IonCardContent className="team-skeleton-content">
        <div className="team-skeleton-rank">
          <IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        </div>
        <div className="team-skeleton-details">
          <IonSkeletonText animated style={{ width: '70%', height: '20px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '50%', height: '16px', marginBottom: '8px' }} />
          <div className="team-skeleton-stats">
            <IonSkeletonText animated style={{ width: '80px', height: '24px' }} />
            <IonSkeletonText animated style={{ width: '80px', height: '24px' }} />
          </div>
        </div>
        <div className="team-skeleton-score">
          <IonSkeletonText animated style={{ width: '60px', height: '40px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Empty state when no teams are found
const EmptyTeams: React.FC = () => {
  return (
    <div className="empty-teams-container">
      <IonIcon 
        icon={peopleOutline} 
        className="empty-teams-icon"
      />
      <IonText color="medium" className="empty-teams-title">
        Aucune équipe en recherche
      </IonText>
      <IonText color="medium" className="empty-teams-subtitle">
        Les équipes apparaîtront ici lorsqu'elles rejoindront la partie
      </IonText>
    </div>
  );
};

const TeamsTabContent: React.FC<TeamsTabContentProps> = ({ 
  gameState, 
  markTeamFound,
  isLoading = false
}) => {
  // Trier les équipes par ordre décroissant de points
  const sortedTeams = useMemo(() => {
    return [...gameState.teams].sort((a, b) => b.score - a.score);
  }, [gameState.teams]);

  const handleRefresh = (event: CustomEvent) => {
    // Dans une vraie app, on pourrait rafraîchir les données ici
    console.log('Rafraîchissement des équipes...');
    
    // Simuler un délai de chargement
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  // Fonction pour déterminer les couleurs en fonction du classement
  const getRankStyle = (index: number) => {
    if (index === 0) return "rank-first"; // Or pour le 1er
    if (index === 1) return "rank-second"; // Argent pour le 2ème
    if (index === 2) return "rank-third"; // Bronze pour le 3ème
    return "rank-other"; // Gris pour les autres
  };

  // Fonction pour obtenir l'icône et la couleur du badge de statut
  const getStatusBadge = (foundChicken: boolean) => {
    if (foundChicken) {
      return {
        icon: checkmarkCircleOutline,
        color: 'success',
        text: 'Trouvé'
      };
    }
    return {
      icon: flagOutline,
      color: 'warning',
      text: 'En recherche'
    };
  };

  return (
    <IonContent className="teams-tab-content">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>


      {isLoading ? (
        // Show skeleton loaders while loading
        <div className="teams-skeleton-list">
          <TeamItemSkeleton />
          <TeamItemSkeleton />
          <TeamItemSkeleton />
        </div>
      ) : sortedTeams.length > 0 ? (
        <div className="teams-list-container">
          {sortedTeams.map((team, index) => {
            const statusBadge = getStatusBadge(team.foundChicken);
            return (
              <IonCard 
                key={team.id} 
                className={`team-card ${team.foundChicken ? 'team-found' : ''}`}
              >
                <IonCardContent className="team-card-content">
                  {/* Rank indicator */}
                  <div className={`team-rank ${getRankStyle(index)}`}>
                    <div className="rank-number">{index + 1}</div>
                  </div>
                  
                  {/* Team info */}
                  <div className="team-details">
                    <h3 className="team-name">{team.name}</h3>
                    
                    {/* Team stats */}
                    <div className="team-stats">
                      <div className="team-stat">
                        <IonIcon icon={peopleOutline} />
                        <span>{team.members.length}</span>
                      </div>
                      <div className="team-stat">
                        <IonIcon icon={locationOutline} />
                        <span>{team.barsVisited}</span>
                      </div>
                      <div className="team-stat">
                        <IonIcon icon={ribbonOutline} />
                        <span>{team.challengesCompleted}</span>
                      </div>
                    </div>
                    
                    {/* Team status */}
                    <IonChip 
                      color={statusBadge.color as 'success' | 'warning' | 'tertiary'} 
                      className="team-status-chip"
                    >
                      <IonIcon icon={statusBadge.icon} />
                      <IonLabel>{statusBadge.text}</IonLabel>
                    </IonChip>
                  </div>
                  
                  {/* Team score */}
                  <div className="team-score">
                    <div className="score-value">
                      <IonIcon icon={starOutline} />
                      {team.score}
                    </div>
                    {/* Mark found button only visible for teams that haven't found the chicken yet */}
                    {!team.foundChicken && (
                      <IonButton 
                        fill="outline" 
                        size="small" 
                        className="mark-found-button"
                        onClick={() => markTeamFound(team.id)}
                      >
                        Marquer trouvé
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })}
        </div>
      ) : (
        <EmptyTeams />
      )}
    </IonContent>
  );
};

export default TeamsTabContent; 