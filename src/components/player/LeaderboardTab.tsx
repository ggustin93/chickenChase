import React, { useMemo, useState } from 'react';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import LeaderboardList from './LeaderboardList';
import { Team } from '../../data/types';
import './LeaderboardTab.css';

interface LeaderboardTabProps {
  leaderboard: Team[];
  currentPlayerTeamId: string;
}

type FilterType = 'all' | 'found' | 'notFound';

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ leaderboard, currentPlayerTeamId }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filtrer et trier les équipes selon le filtre actif
  const displayedTeams = useMemo(() => {
    const sortedTeams = [...leaderboard].sort((a, b) => b.score - a.score);
    
    switch (activeFilter) {
      case 'found':
        return sortedTeams.filter(team => team.foundChicken);
      case 'notFound':
        return sortedTeams.filter(team => !team.foundChicken);
      case 'all':
      default:
        return sortedTeams;
    }
  }, [leaderboard, activeFilter]);

  const handleRefresh = (event: CustomEvent) => {
    // Logique de rafraîchissement - à implémenter
    console.log('Rafraîchissement du classement...');
    
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  return (
    <IonContent className="leaderboard-tab-content">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      {/* Filtres */}
      <IonSegment 
        value={activeFilter} 
        onIonChange={e => setActiveFilter(e.detail.value as FilterType)}
      >
        <IonSegmentButton value="all">
          <IonLabel>Tous</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="found">
          <IonLabel>A trouvé</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="notFound">
          <IonLabel>Pas trouvé</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <LeaderboardList
        teams={displayedTeams}
        currentPlayerTeamId={currentPlayerTeamId}
      />
    </IonContent>
  );
};

export default LeaderboardTab; 