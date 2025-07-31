/**
 * Simple Cagnotte Actions Component for Chicken Team
 * Clean UX with quick action buttons only
 */

import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonText,
  IonToast,
  IonSpinner
} from '@ionic/react';
import {
  cashOutline,
  removeOutline,
  restaurantOutline
} from 'ionicons/icons';
// Real-time cagnotte data now comes from parent component via props
import './SimpleCagnotteActions.css';

interface SimpleCagnotteActionsProps {
  gameId: string;
  playerId?: string;
  // Real-time cagnotte data passed from parent
  currentAmount: number; // in cents
  loading: boolean;
  error: string | null;
  quickOperation: (operation: string) => Promise<any>;
}

const SimpleCagnotteActions: React.FC<SimpleCagnotteActionsProps> = ({
  gameId,
  playerId = 'chicken',
  currentAmount,
  loading,
  error,
  quickOperation
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  const centsToEuros = (cents: number) => cents / 100;

  const getQuickOperationName = (amount: number): string => {
    switch (amount) {
      case 5: return 'spend_5';
      case 10: return 'spend_10';
      case 15: return 'spend_15';
      case 20: return 'spend_20';
      case 30: return 'spend_30';
      case 50: return 'spend_50';
      default: throw new Error(`Unsupported amount: ${amount}`);
    }
  };

  const handleQuickAction = async (amount: number) => {
    setOperationLoading(amount.toString());
    try {
      const operationName = getQuickOperationName(amount);
      await quickOperation(operationName);
      setToastMessage(`${amount}€ dépensés de la cagnotte`);
      setShowToast(true);
    } catch (error) {
      console.error('Error executing cagnotte operation:', error);
      setToastMessage('Erreur lors de l\'opération');
      setShowToast(true);
    } finally {
      setOperationLoading(null);
    }
  };

  if (loading) {
    return (
      <IonCard className="simple-cagnotte-loading">
        <IonCardContent className="ion-text-center">
          <IonSpinner name="crescent" color="primary" />
          <p>Chargement de la cagnotte...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className="simple-cagnotte-container">
      {/* Error Display */}
      {error && (
        <IonCard color="danger">
          <IonCardContent>
            <IonText color="light">
              <p>⚠️ {error}</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      )}

      {/* Current Amount Display */}
      <IonCard className="cagnotte-display-card">
        <IonCardHeader>
          <IonCardTitle className="ion-text-center">
            <IonIcon icon={cashOutline} className="cagnotte-icon" />
            <span className="cagnotte-amount">{centsToEuros(currentAmount).toFixed(2)}€</span>
          </IonCardTitle>
        </IonCardHeader>
      </IonCard>

      {/* Quick Action Buttons */}
      <IonCard className="quick-actions-card">
        <IonCardHeader>
          <IonCardTitle className="actions-title">
            <IonIcon icon={restaurantOutline} />
            Actions rapides
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            {/* First Row - Small amounts */}
            <IonRow>
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="success"
                  onClick={() => handleQuickAction(5)}
                  disabled={operationLoading === '5' || centsToEuros(currentAmount) < 5}
                  className="quick-action-btn"
                >
                  {operationLoading === '5' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      5€
                    </>
                  )}
                </IonButton>
              </IonCol>
              
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="warning"
                  onClick={() => handleQuickAction(10)}
                  disabled={operationLoading === '10' || centsToEuros(currentAmount) < 10}
                  className="quick-action-btn"
                >
                  {operationLoading === '10' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      10€
                    </>
                  )}
                </IonButton>
              </IonCol>
              
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="tertiary"
                  onClick={() => handleQuickAction(15)}
                  disabled={operationLoading === '15' || centsToEuros(currentAmount) < 15}
                  className="quick-action-btn"
                >
                  {operationLoading === '15' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      15€
                    </>
                  )}
                </IonButton>
              </IonCol>
            </IonRow>
            
            {/* Second Row - Larger amounts */}
            <IonRow>
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="primary"
                  onClick={() => handleQuickAction(20)}
                  disabled={operationLoading === '20' || centsToEuros(currentAmount) < 20}
                  className="quick-action-btn"
                >
                  {operationLoading === '20' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      20€
                    </>
                  )}
                </IonButton>
              </IonCol>
              
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="secondary"
                  onClick={() => handleQuickAction(30)}
                  disabled={operationLoading === '30' || centsToEuros(currentAmount) < 30}
                  className="quick-action-btn"
                >
                  {operationLoading === '30' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      30€
                    </>
                  )}
                </IonButton>
              </IonCol>
              
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="danger"
                  onClick={() => handleQuickAction(50)}
                  disabled={operationLoading === '50' || centsToEuros(currentAmount) < 50}
                  className="quick-action-btn"
                >
                  {operationLoading === '50' ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={removeOutline} slot="start" />
                      50€
                    </>
                  )}
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Toast for feedback */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color={toastMessage.includes('Erreur') ? 'danger' : 'success'}
      />
    </div>
  );
};

export default SimpleCagnotteActions;