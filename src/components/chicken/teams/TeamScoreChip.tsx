import React from 'react';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { trophyOutline } from 'ionicons/icons';

interface TeamScoreChipProps {
  score: number;
  isFound: boolean;
}

export const TeamScoreChip: React.FC<TeamScoreChipProps> = ({ score, isFound }) => {
  return (
    <IonChip 
      slot="end" 
      color={isFound ? "success" : "primary"} 
      outline={!isFound}
      className="text-sm font-semibold score-chip" 
    >
      <IonIcon icon={trophyOutline} />
      <IonLabel className="ml-0.5">{score}</IonLabel> 
    </IonChip>
  );
};

export default TeamScoreChip; 