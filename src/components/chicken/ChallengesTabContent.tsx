import React, { useState, useMemo, useRef } from 'react';
import {
  IonButton,
  IonIcon,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonText,
  IonSkeletonText,
  IonLabel,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonChip,
  IonThumbnail,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonImg
} from '@ionic/react';
import { 
  checkmarkCircleOutline, closeCircleOutline, ribbonOutline,
  peopleOutline, imageOutline, timeOutline, eyeOutline,
  closeOutline, thumbsUpOutline, thumbsDownOutline
} from 'ionicons/icons';
import { ChickenGameState, Challenge, ChallengeCompletion } from '../../data/types';
import './ChallengesTabContent.css';

interface ChallengesTabContentProps {
  gameState: ChickenGameState;
  onChallengeValidation?: (id: string, approve: boolean) => void;
  toggleChallengeStatus?: (id: string) => void;
  handleChallengeValidation?: (id: string, approve: boolean) => void;
  addChallenge?: (challenge: Omit<Challenge, 'id'>) => Challenge;
}

// Helper function to get status details
const getStatusDetails = (status: ChallengeCompletion['status']) => {
  switch (status) {
    case 'pending':
      return { 
        icon: timeOutline, 
        color: 'warning', 
        text: 'En attente' 
      };
    case 'approved':
      return { 
        icon: checkmarkCircleOutline, 
        color: 'success', 
        text: 'Validé' 
      };
    case 'rejected':
      return { 
        icon: closeCircleOutline, 
        color: 'danger', 
        text: 'Refusé' 
      };
  }
};

const ChallengesTabContent: React.FC<ChallengesTabContentProps> = ({
  gameState,
  onChallengeValidation
}) => {
  const [submissionFilter, setSubmissionFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const slidingItemsRef = useRef<{ [key: string]: HTMLIonItemSlidingElement | null }>({});
  
  // Calculate challenge counts by status
  const challengeCounts = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
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
    return completion.status === submissionFilter;
  });

  const handleImageLoad = (id: string) => {
    setImageLoading(prev => ({...prev, [id]: false}));
  };

  const handleApprove = (id: string) => {
    slidingItemsRef.current[id]?.closeOpened();
    onChallengeValidation?.(id, true);
  };
  
  const handleReject = (id: string) => {
    slidingItemsRef.current[id]?.closeOpened();
    onChallengeValidation?.(id, false);
  };
  
  const openImageModal = (url: string) => {
    setSelectedImage(url);
  };

  // Helper to get a consistent Picsum image based on challenge ID
  const getPicsumUrl = (id: string, width: number, height: number) => {
    // Use the ID as a seed for consistent images
    return `https://picsum.photos/seed/${id}/${width}/${height}`;
  };

  return (
    <>
      <IonSegment value={submissionFilter} onIonChange={e => {
        const value = e.detail.value as string;
        if (value === 'pending' || value === 'approved' || value === 'rejected') {
          setSubmissionFilter(value as 'pending' | 'approved' | 'rejected');
        }
      }}>
        <IonSegmentButton value="pending">
          <IonIcon icon={timeOutline} />
          <IonLabel>En attente</IonLabel>
          {challengeCounts.pending > 0 && (
            <IonBadge color="warning">{challengeCounts.pending}</IonBadge>
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
        <IonList lines="inset" className="ion-padding-vertical">
          {filteredCompletions.map(completion => {
            const challenge = gameState.challenges.find(c => c.id === completion.challengeId);
            const team = gameState.teams.find(t => t.id === completion.teamId);
            const statusDetails = getStatusDetails(completion.status);
            
            // Use Picsum for missing images, or keep actual photo if present
            const photoUrl = completion.photoUrl || getPicsumUrl(completion.id, 200, 200);
            // For the modal, we'll use a larger version of the same image
            const modalPhotoUrl = completion.photoUrl || getPicsumUrl(completion.id, 800, 600);
            
            return (
              <IonItemSliding 
                key={completion.id}
                ref={(ref) => { slidingItemsRef.current[completion.id] = ref; }}
              >
                {/* Swipe left options - only for pending items */}
                {completion.status === 'pending' && (
                  <IonItemOptions side="start">
                    <IonItemOption color="danger" onClick={() => handleReject(completion.id)}>
                      <IonIcon slot="icon-only" icon={thumbsDownOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                )}
                
                <IonItem lines="full" className="challenge-item">
                  <IonThumbnail slot="start" className="challenge-thumb" onClick={() => openImageModal(modalPhotoUrl)}>
                    {imageLoading[completion.id] !== false ? (
                      <IonSkeletonText animated />
                    ) : (
                      <img 
                        src={photoUrl}
                        alt="Preuve" 
                        onLoad={() => handleImageLoad(completion.id)}
                      />
                    )}
                  </IonThumbnail>
                  
                  <IonLabel className="ion-text-wrap">
                    <h2>{challenge?.title || "Défi inconnu"}</h2>
                    
                    <div className="challenge-meta">
                      <IonChip outline color="primary" className="team-chip">
                        <IonIcon icon={peopleOutline} />
                        <IonLabel>{team?.name || "Équipe inconnue"}</IonLabel>
                      </IonChip>
                      
                      <IonChip outline color="warning">
                        <IonIcon icon={ribbonOutline} />
                        <IonLabel>{challenge?.points || 0} pts</IonLabel>
                      </IonChip>
                      
                      <IonBadge color={statusDetails.color} className="status-badge">
                        <IonIcon icon={statusDetails.icon} />
                        &nbsp;{statusDetails.text}
                      </IonBadge>
                    </div>
                  </IonLabel>
                  
                  <IonButton 
                    fill="clear" 
                    slot="end" 
                    onClick={() => openImageModal(modalPhotoUrl)}
                  >
                    <IonIcon slot="icon-only" icon={eyeOutline} />
                  </IonButton>
                </IonItem>
                
                {/* Swipe right options - only for pending items */}
                {completion.status === 'pending' && (
                  <IonItemOptions side="end">
                    <IonItemOption color="success" onClick={() => handleApprove(completion.id)}>
                      <IonIcon slot="icon-only" icon={thumbsUpOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                )}
              </IonItemSliding>
            );
          })}
        </IonList>
      )}
      
      {/* Image preview modal */}
      <IonModal isOpen={!!selectedImage} onDidDismiss={() => setSelectedImage(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Photo preuve</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedImage(null)}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedImage && (
            <div className="modal-image-container">
              <IonImg src={selectedImage} alt="Preuve photo" />
              
              {/* Show validation buttons in modal if it's a pending challenge */}
              {submissionFilter === 'pending' && (
                <div className="modal-validation-buttons">
                  <IonButton 
                    expand="block" 
                    color="success"
                    onClick={() => {
                      const completion = filteredCompletions.find(c => {
                        const modalUrl = c.photoUrl || getPicsumUrl(c.id, 800, 600);
                        return modalUrl === selectedImage;
                      });
                      if (completion) {
                        onChallengeValidation?.(completion.id, true);
                        setSelectedImage(null);
                      }
                    }}
                  >
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Valider
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    color="danger"
                    onClick={() => {
                      const completion = filteredCompletions.find(c => {
                        const modalUrl = c.photoUrl || getPicsumUrl(c.id, 800, 600);
                        return modalUrl === selectedImage;
                      });
                      if (completion) {
                        onChallengeValidation?.(completion.id, false);
                        setSelectedImage(null);
                      }
                    }}
                  >
                    <IonIcon slot="start" icon={closeCircleOutline} />
                    Refuser
                  </IonButton>
                </div>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default ChallengesTabContent; 