import React, { useEffect, useState } from 'react';
import { IonIcon, IonSkeletonText, IonItem } from '@ionic/react';
import { walletOutline } from 'ionicons/icons';
import './CagnotteSection.css';

interface CagnotteSectionProps {
  currentAmount: number;
  initialAmount: number;
  isLoading?: boolean;
  className?: string;
  title?: string;
  onConsumption?: (amount: number, reason: string) => void;
}

export const CagnotteSection: React.FC<CagnotteSectionProps> = ({ 
  currentAmount, 
  initialAmount,
  isLoading = false,
  className = '',
  title = 'Cagnotte'
}) => {
  // État local pour assurer une animation fluide des valeurs
  const [displayAmount, setDisplayAmount] = useState(currentAmount);
  
  // Mettre à jour l'affichage quand currentAmount change
  useEffect(() => {
    setDisplayAmount(currentAmount);
  }, [currentAmount]);
  
  // Calculate percentage, ensuring initialAmount is positive
  const percentageLeft = initialAmount > 0 
    ? Math.round((displayAmount / initialAmount) * 100) 
    : 0;
  
  // Ensure percentage is within 0-100 range
  const clampedPercentage = Math.max(0, Math.min(100, percentageLeft));
  
  // Format the remaining amount text to be more compact if needed
  const formatRemainingText = () => {
    if (window.innerWidth <= 320) {
      return `${percentageLeft}% / ${initialAmount}€`;
    }
    return `${percentageLeft}% restant sur ${initialAmount}€`;
  };

  return (
    <div 
      className={`cagnotte-container ${className}`} 
      style={{width: '100%'}}
    >
      {isLoading ? (
        <IonItem lines="none" className="cagnotte-skeleton">
          <IonSkeletonText animated style={{ width: '100%', height: '80px' }} />
        </IonItem>
      ) : (
        <div className="cagnotte-card">
          <div className="cagnotte-header">
            <IonIcon icon={walletOutline} />
            <h3>{title}</h3>
          </div>
          <div className="cagnotte-amount">{displayAmount}€</div>
          <div className="cagnotte-info">
            <div className="cagnotte-progress-container">
              <div 
                className="cagnotte-progress-bar" 
                style={{ 
                  width: `${clampedPercentage}%`,
                  transition: 'width 0.5s ease-in-out'
                }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clampedPercentage}
                role="progressbar"
              />
            </div>
            <div className="cagnotte-label" aria-label={`${percentageLeft}% restant sur ${initialAmount}€`}>
              {formatRemainingText()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CagnotteSection; 