import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonContent,
  IonText,
  IonItem,
  IonIcon,
  IonSkeletonText
} from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';

import { ChickenGameState } from '../../data/types';
import { TeamItem } from './teams';
import CagnotteSection from '../shared/CagnotteSection';
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
  // Safely get cagnotte values, default to 0 if invalid or missing
  const initialCagnotte = typeof gameState.initialCagnotte === 'number' ? gameState.initialCagnotte : 0;
  const currentCagnotte = typeof gameState.currentCagnotte === 'number' ? gameState.currentCagnotte : 0;

  return (
    <IonContent className="teams-tab-content">
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Équipes en recherche</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <CagnotteSection 
        currentAmount={currentCagnotte} 
        initialAmount={initialCagnotte} 
        isLoading={isLoading}
      />
      
      <div className="teams-section-header">
        <h4>Équipes participantes</h4>
      </div>
      
      <IonList lines="full" className="teams-list">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            <TeamItemSkeleton />
            <TeamItemSkeleton />
            <TeamItemSkeleton />
          </>
        ) : gameState.teams.length > 0 ? (
          // Show teams when available
          gameState.teams.map((team) => (
            <TeamItem 
              key={team.id}
              team={team} 
              onMarkFound={markTeamFound} 
            />
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