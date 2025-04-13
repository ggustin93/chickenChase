import React, { useMemo, useState } from 'react';
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
  IonRefresherContent,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import { 
  peopleOutline, 
  locationOutline, 
  checkmarkCircleOutline,
  ribbonOutline,
  flagOutline,
  starOutline,
  timeOutline
} from 'ionicons/icons';

import { ChickenGameState } from '../../data/types';
import './TeamsTabContent.css';

// Définition du type TeamData pour le typage correct
interface TeamData {
  id: string;
  name: string;
  foundChicken: boolean;
  barsVisited: number;
  challengesCompleted: number;
  score: number;
  members: { id: string; name: string }[];
  finishTime?: string; // Temps pour trouver le poulet
}

interface TeamsTabContentProps {
  gameState: ChickenGameState;
  markTeamFound: (teamId: string) => void;
  isLoading?: boolean;
}

type FilterType = 'all' | 'searching' | 'found';

// Loading skeleton for team items
const TeamItemSkeleton: React.FC = () => {
  return (
    <IonCard className="team-skeleton-card">
      <IonCardContent className="team-skeleton-content">
        <div className="team-skeleton-rank">
          <IonSkeletonText animated style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
        </div>
        <div className="team-skeleton-details">
          <IonSkeletonText animated style={{ width: '70%', height: '18px', marginBottom: '6px' }} />
          <div className="team-skeleton-stats">
            <IonSkeletonText animated style={{ width: '60px', height: '18px' }} />
            <IonSkeletonText animated style={{ width: '60px', height: '18px' }} />
          </div>
        </div>
        <div className="team-skeleton-score">
          <IonSkeletonText animated style={{ width: '40px', height: '24px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Empty state when no teams are found
const EmptyTeams: React.FC<{ message: string; subtitle: string }> = ({ message, subtitle }) => {
  return (
    <div className="empty-teams-container">
      <IonIcon 
        icon={peopleOutline} 
        className="empty-teams-icon"
      />
      <IonText color="medium" className="empty-teams-title">
        {message}
      </IonText>
      <IonText color="medium" className="empty-teams-subtitle">
        {subtitle}
      </IonText>
    </div>
  );
};

const TeamsTabContent: React.FC<TeamsTabContentProps> = ({ 
  gameState, 
  markTeamFound,
  isLoading = false
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filtrer et trier les équipes
  const { foundTeams, searchingTeams, sortedTeams } = useMemo(() => {
    const allTeams = [...gameState.teams];
    const found = allTeams.filter(team => team.foundChicken).sort((a, b) => b.score - a.score);
    const searching = allTeams.filter(team => !team.foundChicken).sort((a, b) => b.score - a.score);
    const sorted = [...allTeams].sort((a, b) => b.score - a.score);
    
    return { foundTeams: found, searchingTeams: searching, sortedTeams: sorted };
  }, [gameState.teams]);

  // Teams à afficher selon le filtre actif
  const displayedTeams = useMemo(() => {
    switch (activeFilter) {
      case 'found':
        return foundTeams;
      case 'searching':
        return searchingTeams;
      case 'all':
      default:
        return sortedTeams;
    }
  }, [activeFilter, foundTeams, searchingTeams, sortedTeams]);

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
        text: 'Trouvé',
        showIcon: true
      };
    }
    return {
      icon: flagOutline,
      color: 'warning',
      text: '',
      showIcon: false // Ne pas afficher l'icône pour "en chasse"
    };
  };

  // Render un team card
  const renderTeamCard = (team: TeamData, index: number) => {
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
          
          {/* Team name and status */}
          <div className="team-name-status-container">
            <h3 className="team-name fantasy-font">{team.name}</h3>
            <div className="team-status-actions">
              {team.foundChicken ? (
                <IonChip 
                  color={statusBadge.color as 'success' | 'warning' | 'tertiary'} 
                  className="team-status-chip"
                >
                  <IonIcon icon={statusBadge.icon} />
                  <IonLabel>{statusBadge.text}</IonLabel>
                </IonChip>
              ) : (
                // Bouton Marquer trouvé, placé au même endroit que le badge "Trouvé"
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
          </div>
          
          {/* Team stats */}
          <div className="team-stats">
            <div className="team-stat">
              <IonIcon icon={locationOutline} />
              <span>{team.barsVisited}</span>
            </div>
            <div className="team-stat">
              <IonIcon icon={ribbonOutline} />
              <span>{team.challengesCompleted}</span>
            </div>
            {team.foundChicken && team.finishTime && (
              <div className="team-stat">
                <IonIcon icon={timeOutline} />
                <span>{team.finishTime}</span>
              </div>
            )}
          </div>
          
          {/* Team score */}
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

  // Render filtres et liste d'équipes
  const renderTeamsList = () => {
    if (displayedTeams.length === 0) {
      let message = "Aucune équipe en jeu";
      let subtitle = "Les équipes apparaîtront ici quand des équipes rejoindront la partie";
      
      if (activeFilter === 'found') {
        message = "Aucune équipe n'a trouvé le poulet";
        subtitle = "Les équipes apparaîtront ici une fois qu'elles auront trouvé le poulet";
      } else if (activeFilter === 'searching') {
        message = "Aucune équipe en recherche";
        subtitle = "Toutes les équipes ont trouvé le poulet !";
      }
      
      return <EmptyTeams message={message} subtitle={subtitle} />;
    }

    return (
      <div className="teams-list-container">
        {displayedTeams.map((team, index) => renderTeamCard(team, index))}
      </div>
    );
  };

  return (
    <IonContent className="teams-tab-content">
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      {/* Filtres */}
      <div className="teams-filters-container">
        <IonSegment 
          value={activeFilter} 
          onIonChange={e => setActiveFilter(e.detail.value as FilterType)}
          className="teams-filter-segment"
        >
          <IonSegmentButton value="all" className="filter-segment-button">
            <IonLabel>Tous</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="searching" className="filter-segment-button">
            <IonLabel>En chasse</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="found" className="filter-segment-button">
            <IonLabel>Finito</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {isLoading ? (
        // Show skeleton loaders while loading
        <div className="teams-skeleton-list">
          <TeamItemSkeleton />
          <TeamItemSkeleton />
          <TeamItemSkeleton />
        </div>
      ) : (
        renderTeamsList()
      )}
    </IonContent>
  );
};

export default TeamsTabContent; 