import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonRange,
  IonToast
} from '@ionic/react';
import { add, close } from 'ionicons/icons';
import { Challenge } from '../../data/types';
import ChallengesList from './ChallengesList';
import './ChallengesPanel.css';

interface ChallengesPanelProps {
  challenges: Challenge[];
  onToggleChallengeStatus: (id: string) => void;
  onChallengeValidation: (id: string, isApproved: boolean) => void;
  onAddChallenge: (challenge: Omit<Challenge, 'id'>) => void;
}

const ChallengesPanel: React.FC<ChallengesPanelProps> = ({
  challenges,
  onToggleChallengeStatus,
  onChallengeValidation,
  onAddChallenge
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    points: 10,
    active: true
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleInputChange = (event: CustomEvent, field: string) => {
    setNewChallenge({
      ...newChallenge,
      [field]: event.detail.value
    });
  };

  const handlePointsChange = (event: CustomEvent) => {
    setNewChallenge({
      ...newChallenge,
      points: event.detail.value as number
    });
  };

  const handleAddChallenge = () => {
    if (!newChallenge.title || !newChallenge.description) {
      setToastMessage('Veuillez remplir tous les champs requis');
      setShowToast(true);
      return;
    }

    onAddChallenge({
      ...newChallenge,
      pendingValidation: false,
      completed: false,
      teams: []
    });

    // Reset form
    setNewChallenge({
      title: '',
      description: '',
      points: 10,
      active: true
    });
    setShowAddForm(false);
    setToastMessage('Défi ajouté avec succès!');
    setShowToast(true);
  };

  return (
    <>
      <IonCard className="challenges-card">
        <IonCardHeader>
          <IonCardTitle className="card-title">
            Défis de la partie
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <IonIcon icon={showAddForm ? close : add} slot="icon-only" />
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {showAddForm ? (
            <div className="new-challenge-form">
              <h3 className="form-title">Ajouter un nouveau défi</h3>
              
              <IonItem>
                <IonLabel position="stacked">Titre</IonLabel>
                <IonInput
                  value={newChallenge.title}
                  onIonChange={(e) => handleInputChange(e, 'title')}
                  placeholder="Titre du défi"
                  required
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={newChallenge.description}
                  onIonChange={(e) => handleInputChange(e, 'description')}
                  placeholder="Description détaillée du défi"
                  rows={4}
                  required
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Points ({newChallenge.points})</IonLabel>
                <IonRange
                  min={5}
                  max={50}
                  step={5}
                  value={newChallenge.points}
                  onIonChange={handlePointsChange}
                />
              </IonItem>
              
              <div className="form-actions">
                <IonButton
                  expand="block"
                  onClick={handleAddChallenge}
                >
                  Ajouter le défi
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Annuler
                </IonButton>
              </div>
            </div>
          ) : (
            <ChallengesList 
              challenges={challenges}
              onToggleStatus={onToggleChallengeStatus}
              onValidate={onChallengeValidation}
            />
          )}
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color={toastMessage.includes('succès') ? 'success' : 'warning'}
      />
    </>
  );
};

export default ChallengesPanel; 