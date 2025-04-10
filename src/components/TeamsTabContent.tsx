import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonIcon,
  IonLabel,
  IonText,
  IonList,
  IonAvatar,
  IonNote,
  IonButton,
  IonChip
} from '@ionic/react';
import { 
  cashOutline, peopleOutline, locationOutline, 
  checkmarkCircleOutline, trophyOutline 
} from 'ionicons/icons';

import { ChickenGameState } from '../data/types'; // Adjust path if necessary

interface TeamsTabContentProps {
  gameState: ChickenGameState;
  markTeamFound: (teamId: string) => void;
}

const TeamsTabContent: React.FC<TeamsTabContentProps> = ({ gameState, markTeamFound }) => {
  // Safely get cagnotte values, default to 0 if invalid or missing
  const initialCagnotte = typeof gameState.initialCagnotte === 'number' ? gameState.initialCagnotte : 0;
  const currentCagnotte = typeof gameState.currentCagnotte === 'number' ? gameState.currentCagnotte : 0;

  // Calculate percentage, ensuring initialCagnotte is positive
  const percentage = initialCagnotte > 0 ? (currentCagnotte / initialCagnotte) * 100 : 0;
  // Ensure percentage is within 0-100 range
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Équipes en recherche</IonTitle>
        </IonToolbar>
      </IonHeader>
      {/* Cagnotte Section with Progress Bar */}
      <IonItem lines="none" className="cagnotte-section bg-white px-4 py-4 border-b border-gray-200 flex items-center">
        <IonIcon icon={cashOutline} color="warning" slot="start" className="text-3xl mr-4 text-yellow-600 flex-shrink-0"/>
        <IonLabel className="font-medium text-lg text-gray-800 flex-shrink-0 mr-5">
          Cagnotte
        </IonLabel>
        {/* Container for Amount and Progress Bar */}
        <div className="flex-grow flex items-center justify-end space-x-4">
          <IonText className="font-bold text-xl text-yellow-700 flex-shrink-0">
            {/* Display the validated current amount */}
            {currentCagnotte}€
          </IonText>
          {/* Progress Bar using dynamic values */}
          <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
            <div 
              className="h-full bg-yellow-500 rounded-full"
              style={{
                // Use the clamped percentage
                width: `${clampedPercentage}%`,
                transition: 'width 0.5s ease-in-out',
              }}
            ></div>
          </div>
        </div>
      </IonItem>
      
      <IonList lines="full">
        {gameState.teams.map((team) => (
          <IonItem 
            key={team.id} 
            detail={false} 
            className={`team-item ${team.foundChicken ? 'team-found' : ''}`}
            style={team.foundChicken ? {
              '--background': 'rgba(45, 211, 111, 0.08)', // Slightly subtler green background
              '--border-color': 'rgba(45, 211, 111, 0.2)'
            } : {}}
          >
            <IonAvatar slot="start" className="w-10 h-10"> 
              <img 
                src={team.avatarUrl} 
                alt={team.name} 
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/100';
                }}
              />
            </IonAvatar>
            
            <IonLabel className="ion-text-wrap py-1"> 
              <h2 className="font-semibold text-base mb-0.5">{team.name}</h2> 
              {/* Use flex with gap for consistent spacing */}
              <IonNote color="medium" className="text-xs block leading-tight flex"> 
                <span className="inline-flex items-center mr-4">
                  <IonIcon icon={peopleOutline} size="small" className="mr-1"/>
                  {team.members.length}
                </span>
                <span className="inline-flex items-center mr-4">
                  <IonIcon icon={locationOutline} size="small" className="mr-1"/>
                  {team.barsVisited}
                </span>
                <span className="inline-flex items-center">
                  <IonIcon icon={checkmarkCircleOutline} size="small" className="mr-1"/>
                  {team.challengesCompleted}
                </span>
              </IonNote>
              
              <div className="mt-1.5"> 
                {team.foundChicken ? (
                  <IonChip color="success" outline={false} className="h-6 text-xs font-medium"> 
                    <IonIcon icon={checkmarkCircleOutline} size="small"/>
                    <IonLabel>Trouvé !</IonLabel>
                  </IonChip>
                ) : (
                  <IonButton 
                    fill="outline" 
                    color="primary" 
                    size="small"
                    className="h-7 text-xs font-semibold mark-found-button" 
                    onClick={() => markTeamFound(team.id)}
                  >
                    Marquer trouvé
                  </IonButton>
                )}
              </div>
            </IonLabel>
            
            <IonChip 
              slot="end" 
              color={team.foundChicken ? "success" : "primary"} 
              outline={!team.foundChicken}
              className="text-sm font-semibold score-chip" 
            >
              <IonIcon icon={trophyOutline} />
              <IonLabel className="ml-0.5">{team.score}</IonLabel> 
            </IonChip>
            
          </IonItem>
        ))}
      </IonList>
    </>
  );
};

export default TeamsTabContent; 