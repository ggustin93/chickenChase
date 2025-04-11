import React from 'react';
import { 
  IonHeader, IonToolbar, IonTitle, IonBadge, IonList, IonItem, 
  IonIcon, IonLabel, IonChip, IonButton 
} from '@ionic/react';
import { checkmarkCircle, ellipseOutline, trophyOutline, cameraOutline } from 'ionicons/icons';
import { Challenge } from '../../data/types';

interface ChallengesTabProps {
  challenges: Challenge[];
  completedChallenges: Challenge[];
  onChallengeAttempt: (challengeId: string) => void;
}

const ChallengesTab: React.FC<ChallengesTabProps> = ({ 
  challenges, 
  completedChallenges,
  onChallengeAttempt
}) => {
  return (
    <>
      
      <IonList lines="inset">
        {challenges.map(challenge => {
          const isCompleted = completedChallenges.some(cc => cc.id === challenge.id);
          return (
            <IonItem 
              key={challenge.id} 
              detail={false} 
              button={!isCompleted} 
              onClick={() => !isCompleted && onChallengeAttempt(challenge.id)}
            >
              <IonIcon
                icon={isCompleted ? checkmarkCircle : ellipseOutline}
                color={isCompleted ? 'success' : 'medium'}
                slot="start"
                className="text-xl mt-1 self-start"
              />
              <IonLabel className="whitespace-normal py-2">
                <h2 className={isCompleted ? 'line-through text-medium' : ''}>{challenge.title}</h2>
                {challenge.description && <p className="text-xs text-medium mt-1">{challenge.description}</p>}
                <IonChip outline color="secondary" className="mt-1">
                  <IonIcon icon={trophyOutline} />
                  <IonLabel>{challenge.points} pts</IonLabel>
                </IonChip>
              </IonLabel>
              {!isCompleted && (
                <IonButton fill="clear" size="small" slot="end" aria-label="Compléter le défi">
                  <IonIcon icon={cameraOutline} className="text-xl" />
                </IonButton>
              )}
            </IonItem>
          );
        })}
      </IonList>
    </>
  );
};

export default ChallengesTab; 