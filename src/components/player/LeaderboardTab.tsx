import React, { useMemo, useState } from 'react';
import { 
  IonContent, 
  IonRefresher, 
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge
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

  // Calculate counts for badges
  const counts = useMemo(() => {
    const allCount = leaderboard.length;
    const foundCount = leaderboard.filter(team => team.foundChicken).length;
    const notFoundCount = allCount - foundCount;
    return { allCount, foundCount, notFoundCount };
  }, [leaderboard]);

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
        className="leaderboard-segment"
      >
        <IonSegmentButton value="all" className="segment-button-with-badge">
          <div className="segment-button-inner">
            <IonLabel>Tous</IonLabel>
            <IonBadge color="medium" className="segment-badge">{counts.allCount}</IonBadge>
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="found" className="segment-button-with-badge">
          <div className="segment-button-inner">
            <IonLabel>A trouvé</IonLabel>
            <IonBadge color="success" className="segment-badge">{counts.foundCount}</IonBadge>
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="notFound" className="segment-button-with-badge">
          <div className="segment-button-inner">
            <IonLabel>Pas trouvé</IonLabel>
            <IonBadge color="warning" className="segment-badge">{counts.notFoundCount}</IonBadge>
          </div>
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