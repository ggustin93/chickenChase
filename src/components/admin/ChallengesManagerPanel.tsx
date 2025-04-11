import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonTextarea,
  IonChip
} from '@ionic/react';
import { closeOutline, ribbonOutline, addOutline } from 'ionicons/icons';
import { Challenge } from '../../data/types';

interface ChallengesManagerPanelProps {
  onClose: () => void;
  challenges: Challenge[];
  onToggleChallengeStatus: (id: string) => void;
  hideHeader?: boolean;
  onAddChallenge?: (challenge: Omit<Challenge, 'id'>) => void;
}

const ChallengesManagerPanel: React.FC<ChallengesManagerPanelProps> = ({ 
  onClose, 
  challenges,
  onToggleChallengeStatus,
  hideHeader = false,
  onAddChallenge
}) => {
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    points: 50,
  });

  const handleAddChallenge = () => {
    if (!newChallenge.title || !newChallenge.description) return;
    
    if (onAddChallenge) {
      onAddChallenge({
        title: newChallenge.title,
        description: newChallenge.description,
        points: newChallenge.points,
        active: true,
        completed: false,
        teams: []
      });
      
      // Reset form
      setNewChallenge({
        title: '',
        description: '',
        points: 50,
      });
    }
  };

  const handleInputChange = (field: string, value: string | number | null | undefined) => {
    setNewChallenge(prev => ({
      ...prev,
      [field]: field === 'points' ? parseInt(String(value || '0'), 10) : String(value || '')
    }));
  };

  return (
    <IonCard className="challenges-manager-panel">
      {!hideHeader && (
        <IonCardHeader>
          <div className="flex justify-between items-center">
            <IonCardTitle className="text-lg font-bold">
              <IonIcon icon={ribbonOutline} className="mr-2" />
              Gérer les défis
            </IonCardTitle>
            <IonButton fill="clear" onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </div>
        </IonCardHeader>
      )}
      
      <IonCardContent>
        <div className="new-challenge-form">
          <div className="form-title">
            <IonIcon icon={addOutline} /> Ajouter un défi
          </div>
          
          <IonItem>
            <IonLabel position="floating">Titre du défi</IonLabel>
            <IonInput
              value={newChallenge.title}
              onIonInput={e => handleInputChange('title', e.detail.value)}
              placeholder="Ex: Photo avec un inconnu"
            ></IonInput>
          </IonItem>
          
          <IonItem className="mt-3">
            <IonLabel position="floating">Description</IonLabel>
            <IonTextarea
              value={newChallenge.description}
              onIonInput={e => handleInputChange('description', e.detail.value)}
              placeholder="Ex: Trouvez quelqu'un qui porte un vêtement rouge et prenez un selfie avec cette personne."
              rows={3}
            ></IonTextarea>
          </IonItem>
          
          <IonItem className="mt-3">
            <IonLabel position="floating">Points</IonLabel>
            <IonInput
              type="number"
              value={newChallenge.points}
              onIonInput={e => handleInputChange('points', e.detail.value)}
            ></IonInput>
          </IonItem>
          
          <IonButton 
            expand="block" 
            className="mt-4"
            onClick={handleAddChallenge}
            disabled={!newChallenge.title || !newChallenge.description}
          >
            <IonIcon icon={addOutline} slot="start" />
            Créer le défi
          </IonButton>
        </div>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">Défis actuels</h3>
        
        <IonList>
          {challenges.map(challenge => (
            <IonItem key={challenge.id} className="mb-2">
              <IonLabel>
                <h2 className="font-semibold">{challenge.title}</h2>
                <p className="text-sm text-gray-600">{challenge.description}</p>
                <div className="flex items-center mt-1">
                  <IonChip color="primary" className="text-xs">
                    {challenge.points} points
                  </IonChip>
                </div>
              </IonLabel>
              <IonToggle
                checked={challenge.active}
                onIonChange={() => onToggleChallengeStatus(challenge.id)}
              />
            </IonItem>
          ))}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};

export default ChallengesManagerPanel; 