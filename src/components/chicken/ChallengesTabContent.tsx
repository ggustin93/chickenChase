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
  IonSkeletonText
} from '@ionic/react';
import { 
  checkmarkCircleOutline, closeCircleOutline, ribbonOutline,
  peopleOutline, imageOutline, timeOutline, appsOutline
} from 'ionicons/icons';
import { ChickenGameState } from '../../data/types';
import './ChallengesTabContent.css';

interface ChallengesTabContentProps {
  gameState: ChickenGameState;
  onChallengeValidation: (id: string, approve: boolean) => void;
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
      }} className="mb-3 challenge-segment" mode="ios">
        <IonSegmentButton value="pending" className="challenge-segment-btn">
          <div className="segment-content">
            <IonIcon icon={timeOutline} className="segment-icon"></IonIcon>
            {challengeCounts.pending > 0 && (
              <IonBadge color="primary" className="count-badge">{challengeCounts.pending}</IonBadge>
            )}
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="approved" className="challenge-segment-btn">
          <div className="segment-content">
            <IonIcon icon={checkmarkCircleOutline} className="segment-icon"></IonIcon>
            {challengeCounts.approved > 0 && (
              <IonBadge color="success" className="count-badge">{challengeCounts.approved}</IonBadge>
            )}
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="rejected" className="challenge-segment-btn">
          <div className="segment-content">
            <IonIcon icon={closeCircleOutline} className="segment-icon"></IonIcon>
            {challengeCounts.rejected > 0 && (
              <IonBadge color="danger" className="count-badge">{challengeCounts.rejected}</IonBadge>
            )}
          </div>
        </IonSegmentButton>
        <IonSegmentButton value="all" className="challenge-segment-btn">
          <div className="segment-content">
            <IonIcon icon={appsOutline} className="segment-icon"></IonIcon>
            {challengeCounts.total > 0 && (
              <IonBadge color="medium" className="count-badge">{challengeCounts.total}</IonBadge>
            )}
          </div>
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
                        className="validation-button"
                        onClick={() => onChallengeValidation(completion.id, true)}
                      >
                        <IonIcon icon={checkmarkCircleOutline} />
                      </IonButton>
                      <IonButton 
                        expand="block" 
                        fill="outline"
                        color="danger"
                        size="large"
                        className="validation-button"
                        onClick={() => onChallengeValidation(completion.id, false)}
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