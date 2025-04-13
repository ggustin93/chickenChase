import React, { useMemo } from 'react';
import {
  IonList,
  IonContent,
  IonText,
  IonItem,
  IonIcon,
  IonSkeletonText,
  IonBadge
} from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';

import { ChickenGameState } from '../../data/types';
import { TeamItem } from './teams';
import './TeamsTabContent.css';

interface TeamsTabContentProps {
  gameState: ChickenGameState;
  markTeamFound: (teamId: string) => void;
  isLoading?: boolean;
}

// Loading skeleton for team items
const TeamItemSkeleton: React.FC = () => {
  return (
    <IonItem>
      <div slot="start" className="w-10 h-10 rounded-full overflow-hidden">
        <IonSkeletonText animated style={{ height: '100%' }} />
      </div>
      <IonText>
        <h2>
          <IonSkeletonText animated style={{ width: '150px', height: '16px' }} />
        </h2>
        <p>
          <IonSkeletonText animated style={{ width: '120px', height: '14px' }} />
        </p>
        <div className="mt-1.5">
          <IonSkeletonText animated style={{ width: '80px', height: '24px' }} />
        </div>
      </IonText>
      <div slot="end">
        <IonSkeletonText animated style={{ width: '60px', height: '30px' }} />
      </div>
    </IonItem>
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

  return (
    <IonContent className="teams-tab-content">
      <IonList lines="full" className="teams-list">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            <TeamItemSkeleton />
            <TeamItemSkeleton />
            <TeamItemSkeleton />
          </>
        ) : sortedTeams.length > 0 ? (
          // Show teams when available, sorted by score
          sortedTeams.map((team, index) => (
            <div 
              key={team.id} 
              className={`team-item-wrapper ${team.foundChicken ? 'found-wrapper' : ''}`}
            >
              <div className="team-rank">
                <IonBadge color={index < 3 ? "warning" : "medium"} className="rank-badge">
                  {index + 1}
                </IonBadge>
              </div>
              <TeamItem 
                team={team} 
                onMarkFound={markTeamFound} 
              />
            </div>
          ))
        ) : (
          // Show empty state when no teams
          <EmptyTeams />
        )}
      </IonList>
    </IonContent>
  );
};

export default TeamsTabContent; 