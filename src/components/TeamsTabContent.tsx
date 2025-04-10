import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonList,
  IonAvatar,
  IonChip,
  IonButton,
  IonNote
} from '@ionic/react';
import { 
  cashOutline, 
  peopleOutline, 
  locationOutline, 
  checkmarkCircleOutline 
} from 'ionicons/icons';

import { Team } from '../data/types';
import './TeamsTabContent.css'; // Import the CSS file

interface TeamsTabContentProps {
  teams: Team[];
  markTeamFound: (teamId: string) => void;
  gamePot: number;
}

const TeamsTabContent: React.FC<TeamsTabContentProps> = ({ teams, markTeamFound, gamePot }) => (
  // Add base class for the content area
  <div className="teams-tab-content">
    <IonHeader className="teams-header" translucent={true}>
      <IonToolbar color="light"> {/* Ensure toolbar color matches CSS if needed */}
        <IonTitle>Équipes en recherche</IonTitle>
      </IonToolbar>
    </IonHeader>

    {/* Section for subtitle (title removed) */}
    <div className="teams-title-section">
      <p>Progression des équipes</p>
    </div>
    
    {/* Section for the game pot */}
    <IonItem lines="none" className="pot-section"> {/* Use lines="none" */}
      <IonIcon icon={cashOutline} slot="start" />
      <IonLabel>Cagnotte</IonLabel>
      <IonText slot="end" className="pot-amount">{gamePot}€</IonText> 
    </IonItem>
    
    {/* Use IonList with items instead of cards */}
    <IonList lines="none" className="teams-list"> 
      {teams.map((team) => (
        <IonItem key={team.id} className="team-list-item">
          <IonAvatar slot="start" className="team-item-avatar">
            <img 
              src={team.avatarUrl} 
              alt={`${team.name} avatar`} 
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = 'https://ionicframework.com/docs/img/demos/avatar.svg'; // Improved placeholder
              }}
            />
          </IonAvatar>
          
          <IonLabel className="team-item-label"> 
            <h2>{team.name}</h2>
            {/* Combine all stats into a single IonNote for inline display */}
            <IonNote>
              <span className="members-info"> 
                <IonIcon icon={peopleOutline} />
                {team.members.length} membres
              </span>
              <span className="stat-separator">|</span>
              <span className="stats-info">
                <IonIcon icon={locationOutline} /> {team.barsVisited} bars
              </span>
              <span className="stat-separator">|</span>
              <span className="stats-info">
                 <IonIcon icon={checkmarkCircleOutline} /> {team.challengesCompleted} défis
              </span>
            </IonNote>
            
            {/* Action Area - Placed below the notes */}
            <div className="team-item-action">
              {team.foundChicken ? (
                <div className="found-message">
                  <IonIcon icon={checkmarkCircleOutline} />
                  Équipe trouvée !
                </div>
              ) : (
                <IonButton 
                  expand="block" 
                  fill="solid" 
                  className="mark-found-button" 
                  onClick={() => markTeamFound(team.id)}
                >
                  Marquer comme trouvé
                </IonButton>
              )}
            </div>
          </IonLabel>

          {/* Score Chip moved to the end slot */}
          <IonChip slot="end" className="team-item-score-chip">
            {/* Removed trophy icon based on CSS */}
            {team.score} pts
          </IonChip>
        </IonItem>
      ))}
    </IonList>
  </div>
);

export default TeamsTabContent; 