import React from 'react';
import { IonIcon, IonSkeletonText, IonItem } from '@ionic/react';
import { walletOutline } from 'ionicons/icons';
import './CagnotteSection.css';

interface CagnotteSectionProps {
  currentAmount: number;
  initialAmount: number;
  isLoading?: boolean;
  className?: string;
  title?: string;
}

export const CagnotteSection: React.FC<CagnotteSectionProps> = ({ 
  currentAmount, 
  initialAmount,
  isLoading = false,
  className = '',
  title = 'Cagnotte'
}) => {
  // Calculate percentage, ensuring initialAmount is positive
  const percentageLeft = initialAmount > 0 
    ? Math.round((currentAmount / initialAmount) * 100) 
    : 0;
  
  // Ensure percentage is within 0-100 range
  const clampedPercentage = Math.max(0, Math.min(100, percentageLeft));

  return (
    <div className={`cagnotte-container ${className}`}>
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
          <div className="cagnotte-amount">{currentAmount}€</div>
          <div className="cagnotte-info">
            <div className="cagnotte-progress-container">
              <div 
                className="cagnotte-progress-bar" 
                style={{ 
                  width: `${clampedPercentage}%`,
                  transition: 'width 0.5s ease-in-out'
                }}
              />
            </div>
            <div className="cagnotte-label">
              {percentageLeft}% restant sur {initialAmount}€
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CagnotteSection; 