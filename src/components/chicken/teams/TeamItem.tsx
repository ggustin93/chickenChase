import React from 'react';
import { 
  IonItem, 
  IonButton, 
  IonIcon,
  IonText
} from '@ionic/react';
import { 
  checkmarkCircleOutline,
  peopleOutline,
  locationOutline,
  trophyOutline
} from 'ionicons/icons';
import { Team } from '../../../data/types';

interface TeamItemProps {
  team: Team;
  onMarkFound: (teamId: string) => void;
}

export const TeamItem: React.FC<TeamItemProps> = ({ team, onMarkFound }) => {
  return (
    <IonItem 
      detail={false} 
      className={`team-list-item ${team.foundChicken ? 'found' : ''}`}
      lines="none"
    >
      <div className="team-item-content">
        <div className="team-item-avatar">
          <img 
            src={team.avatarUrl} 
            alt={team.name} 
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = 'https://picsum.photos/100';
            }}
          />
        </div>
        
        <div className="team-item-info">
          <div className="team-item-header">
            <h3 className="team-item-name">{team.name}</h3>
            <div className="team-item-score">
              <IonIcon icon={trophyOutline} color="secondary" />
              {team.score}
            </div>
          </div>
          
          <div className="team-item-stats">
            <div className="team-stat">
              <IonIcon icon={peopleOutline} />
              {team.members.length}
            </div>
            
            <div className="team-stat">
              <IonIcon icon={locationOutline} />
              {team.barsVisited}
            </div>
            
            <div className="team-stat">
              <IonIcon icon={checkmarkCircleOutline} />
              {team.challengesCompleted}
            </div>
          </div>
          
          <div className="team-item-action">
            {team.foundChicken ? (
              <div className="found-message">
                <IonIcon icon={checkmarkCircleOutline} />
                <IonText>Trouvé !</IonText>
              </div>
            ) : (
              <IonButton 
                expand="block"
                fill="outline"
                color="primary"
                className="mark-found-button"
                onClick={() => onMarkFound(team.id)}
              >
                Marquer trouvé
              </IonButton>
            )}
          </div>
        </div>
      </div>
    </IonItem>
  );
};

export default TeamItem; 