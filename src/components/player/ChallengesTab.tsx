import React from 'react';
import { 
  IonBadge, IonList, IonItem, 
  IonIcon, IonLabel, IonChip 
} from '@ionic/react';
import { 
  checkmarkCircle, ellipseOutline, trophyOutline, cameraOutline, 
  timeOutline, closeCircleOutline, chevronForwardOutline,
  keyOutline
} from 'ionicons/icons';
import { Challenge, ChallengeCompletion } from '../../data/types';

interface ChallengesTabProps {
  challenges: Challenge[];
  challengeStatuses: Record<string, ChallengeCompletion['status'] | undefined>;
  onViewChallengeDetail: (challengeId: string) => void;
}

const getStatusDetails = (status: ChallengeCompletion['status'] | undefined) => {
  switch (status) {
    case 'pending':
      return { 
        icon: timeOutline, 
        iconColor: 'warning', 
        badgeColor: 'warning',
        text: 'En attente' 
      };
    case 'approved':
      return { 
        icon: checkmarkCircle, 
        iconColor: 'success', 
        badgeColor: 'success',
        text: 'Validé' 
      };
    case 'rejected':
      return { 
        icon: closeCircleOutline, 
        iconColor: 'danger', 
        badgeColor: 'danger',
        text: 'Refusé' 
      };
    default: // Not started / undefined
      return { 
        icon: ellipseOutline, 
        iconColor: 'medium', 
        badgeColor: 'medium',
        text: 'À faire' 
      };
  }
};

const ChallengesTab: React.FC<ChallengesTabProps> = ({ 
  challenges, 
  challengeStatuses,
  onViewChallengeDetail
}) => {
  return (
    <>
      <IonList lines="inset" className="ion-padding-vertical">
        {challenges.map(challenge => {
          const status = challengeStatuses[challenge.id];
          const { 
            icon: statusIcon, 
            iconColor: statusIconColor, 
            badgeColor: statusBadgeColor, 
            text: statusText 
          } = getStatusDetails(status);
          
          let endIcon = chevronForwardOutline;
          let endIconColor = 'medium';
          if (status === undefined) {
            if (challenge.type === 'unlock') {
              endIcon = keyOutline;
              endIconColor = 'primary';
            } else {
              endIcon = cameraOutline;
              endIconColor = 'primary';
            }
          }

          return (
            <IonItem 
              key={challenge.id} 
              detail={false}
              button={true}
              onClick={() => onViewChallengeDetail(challenge.id)}
              className="ion-align-items-center"
            >
              <IonIcon
                icon={statusIcon}
                color={statusIconColor}
                slot="start"
                className="text-2xl ion-margin-end"
              />
              <IonLabel className="whitespace-normal py-2">
                <h2 className={`font-semibold ${status === 'approved' ? 'line-through text-medium' : ''}`}>
                  {challenge.title}
                </h2>
                {challenge.description && (
                  <p className="text-xs text-medium mt-1">{challenge.description}</p>
                )}
                <div className="flex items-center flex-wrap mt-2 gap-1">
                  <IonChip outline color="secondary" className="m-0">
                    <IonIcon icon={trophyOutline} />
                    <IonLabel>{challenge.points} pts</IonLabel>
                  </IonChip>
                  <IonBadge color={statusBadgeColor} className="m-0">
                    {statusText}
                  </IonBadge>
                </div>
              </IonLabel>
              <IonIcon 
                 icon={endIcon}
                 slot="end" 
                 color={endIconColor}
                 className="text-xl ion-align-self-center"
              />
            </IonItem>
          );
        })}
      </IonList>
    </>
  );
};

export default ChallengesTab; 