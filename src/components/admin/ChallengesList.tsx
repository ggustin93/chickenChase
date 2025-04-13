import React from 'react';
import {
  IonList,
  IonItem,
  IonBadge,
  IonToggle,
  IonButton
} from '@ionic/react';
import { Challenge } from '../../data/types';
import './ChallengesList.css';

interface ChallengesListProps {
  challenges: Challenge[];
  onToggleStatus: (id: string) => void;
  onValidate: (id: string, isApproved: boolean) => void;
}

const ChallengesList: React.FC<ChallengesListProps> = ({
  challenges,
  onToggleStatus,
  onValidate
}) => {
  return (
    <IonList>
      {challenges.map(challenge => (
        <IonItem key={challenge.id} className="challenge-item">
          <div className="challenge-content">
            <div className="challenge-header">
              <h2>{challenge.title}</h2>
              <IonBadge color="primary">{challenge.points} points</IonBadge>
            </div>
            <p>{challenge.description}</p>

            <div className="challenge-actions">
              <IonToggle
                checked={challenge.active}
                onIonChange={() => onToggleStatus(challenge.id)}
                labelPlacement="start"
              >
                {challenge.active ? 'Actif' : 'Inactif'}
              </IonToggle>

              {challenge.pendingValidation && (
                <div className="validation-buttons">
                  <IonButton 
                    color="success" 
                    size="small"
                    onClick={() => onValidate(challenge.id, true)}
                  >
                    Approuver
                  </IonButton>
                  <IonButton 
                    color="danger" 
                    size="small"
                    onClick={() => onValidate(challenge.id, false)}
                  >
                    Refuser
                  </IonButton>
                </div>
              )}
            </div>
          </div>
        </IonItem>
      ))}
    </IonList>
  );
};

export default ChallengesList; 