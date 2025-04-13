import React, { useState, useMemo } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonRippleEffect,
  IonText,
  IonSkeletonText,
  IonLabel
} from '@ionic/react';
import { 
  checkmarkCircleOutline, closeCircleOutline, ribbonOutline,
  peopleOutline, imageOutline, timeOutline, appsOutline
} from 'ionicons/icons';
import { ChickenGameState, Challenge } from '../../data/types';
import './ChallengesTabContent.css';

interface ChallengesTabContentProps {
  gameState: ChickenGameState;
  onChallengeValidation?: (id: string, approve: boolean) => void;
  toggleChallengeStatus?: (id: string) => void;
  handleChallengeValidation?: (id: string, approve: boolean) => void;
  addChallenge?: (challenge: Omit<Challenge, 'id'>) => Challenge;
}

const ChallengesTabContent: React.FC<ChallengesTabContentProps> = ({
  gameState,
  onChallengeValidation
}) => {
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  
  // Calculate challenge counts by status
  const challengeCounts = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: gameState.challengeCompletions.length
    };
    
    gameState.challengeCompletions.forEach(completion => {
      if (completion.status === 'pending') counts.pending++;
      if (completion.status === 'approved') counts.approved++;
      if (completion.status === 'rejected') counts.rejected++;
    });
    
    return counts;
  }, [gameState.challengeCompletions]);
  
  // Filter challenge completions based on selected filter
  const filteredCompletions = gameState.challengeCompletions.filter(completion => {
    if (submissionFilter === 'all') return true;
    return completion.status === submissionFilter;
  });

  const handleImageLoad = (id: string) => {
    setImageLoading(prev => ({...prev, [id]: false}));
  };

  return (
    <>
      <IonSegment value={submissionFilter} onIonChange={e => {
        const value = e.detail.value as string;
        if (value === 'pending' || value === 'approved' || value === 'rejected' || value === 'all') {
          setSubmissionFilter(value);
        }
      }}>
        <IonSegmentButton value="pending">
          <IonIcon icon={timeOutline} />
          <IonLabel>En attente</IonLabel>
          {challengeCounts.pending > 0 && (
            <IonBadge color="primary">{challengeCounts.pending}</IonBadge>
          )}
        </IonSegmentButton>
        <IonSegmentButton value="approved">
          <IonIcon icon={checkmarkCircleOutline} />
          <IonLabel>Approuvés</IonLabel>
          {challengeCounts.approved > 0 && (
            <IonBadge color="success">{challengeCounts.approved}</IonBadge>
          )}
        </IonSegmentButton>
        <IonSegmentButton value="rejected">
          <IonIcon icon={closeCircleOutline} />
          <IonLabel>Refusés</IonLabel>
          {challengeCounts.rejected > 0 && (
            <IonBadge color="danger">{challengeCounts.rejected}</IonBadge>
          )}
        </IonSegmentButton>
        <IonSegmentButton value="all">
          <IonIcon icon={appsOutline} />
          <IonLabel>Tous</IonLabel>
          {challengeCounts.total > 0 && (
            <IonBadge color="medium">{challengeCounts.total}</IonBadge>
          )}
        </IonSegmentButton>
      </IonSegment>
      
      {filteredCompletions.length === 0 ? (
        <div className="empty-state">
          <IonIcon icon={imageOutline} className="empty-icon" />
          <IonText color="medium">
            <h5>Aucun défi {
              submissionFilter === 'pending' ? 'en attente' : 
              submissionFilter === 'approved' ? 'validé' : 
              submissionFilter === 'rejected' ? 'refusé' : ''
            } pour l'instant.</h5>
            {submissionFilter === 'pending' && (
              <p className="hint">Les équipes peuvent soumettre des défis avec des preuves photos.</p>
            )}
          </IonText>
        </div>
      ) : (
        <IonList lines="none" className="challenge-list">
          {filteredCompletions.map(completion => {
            const challenge = gameState.challenges.find(c => c.id === completion.challengeId);
            const team = gameState.teams.find(t => t.id === completion.teamId);
            
            return (
              <IonCard key={completion.id} className="challenge-card ion-activatable ripple-parent">
                <IonRippleEffect></IonRippleEffect>
                <IonCardHeader className="card-header">
                  <div className="title-points-container">
                    <IonCardTitle className="challenge-title">
                      {challenge?.title || "Défi inconnu"}
                    </IonCardTitle>
                    <IonBadge color="warning" className="points-badge">
                      <IonIcon icon={ribbonOutline} className="points-icon" />
                      {challenge?.points || 0} pts
                    </IonBadge>
                  </div>
                  <div className="team-container">
                    <IonIcon icon={peopleOutline} className="team-icon" />
                    <IonText color="primary" className="team-name">
                      {team?.name || "Équipe inconnue"}
                    </IonText>
                  </div>
                </IonCardHeader>
                <IonCardContent className="card-content">
                  {completion.photoUrl && (
                    <div className="proof-container">
                      {imageLoading[completion.id] !== false && (
                        <div className="skeleton-container">
                          <IonSkeletonText animated style={{ height: '200px', width: '100%' }} />
                        </div>
                      )}
                      <img 
                        src={completion.photoUrl} 
                        alt="Preuve photo" 
                        className="proof-image"
                        onLoad={() => handleImageLoad(completion.id)}
                        style={{ display: imageLoading[completion.id] === false ? 'block' : 'none' }}
                      />
                    </div>
                  )}
                  
                  {completion.status === 'pending' && (
                    <div className="validation-buttons">
                      <IonButton 
                        expand="block" 
                        color="success"
                        size="large"
                        className="validation-button approve-button"
                        onClick={() => onChallengeValidation?.(completion.id, true)}
                      >
                        <IonIcon icon={checkmarkCircleOutline} />
                      </IonButton>
                      <IonButton 
                        expand="block" 
                        color="danger"
                        size="large"
                        className="validation-button reject-button"
                        onClick={() => onChallengeValidation?.(completion.id, false)}
                      >
                        <IonIcon icon={closeCircleOutline} />
                      </IonButton>
                    </div>
                  )}
                  
                  {completion.status === 'approved' && (
                    <div className="status-badge approved">
                      <IonBadge color="success" className="status-badge-large">
                        <IonIcon icon={checkmarkCircleOutline} className="status-icon" />
                        Validé
                      </IonBadge>
                    </div>
                  )}
                  
                  {completion.status === 'rejected' && (
                    <div className="status-badge rejected">
                      <IonBadge color="danger" className="status-badge-large">
                        <IonIcon icon={closeCircleOutline} className="status-icon" />
                        Refusé
                      </IonBadge>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            );
          })}
        </IonList>
      )}
    </>
  );
};

export default ChallengesTabContent; 