import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonIcon,
  IonPage,
  useIonAlert,
  IonToast
} from '@ionic/react';
import { walletOutline, removeCircleOutline, checkmarkOutline } from 'ionicons/icons';
import { CagnotteSection } from '../shared/CagnotteSection';
import './CagnotteModal.css';

interface CagnotteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  amount?: number;
  onAmountChange: (value?: number) => void;
  error: string;
  onSubmit: () => void;
}

const CagnotteModal: React.FC<CagnotteModalProps> = ({
  isOpen,
  onClose,
  currentAmount,
  amount,
  onAmountChange,
  error,
  onSubmit
}) => {
  const [presentAlert] = useIonAlert();
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Assuming the initial cagnotte amount is 350€ (this should come from props in a real app)
  const initialCagnotte = 350;
  
  // Function to handle the form submit with better feedback
  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      presentAlert({
        header: 'Montant invalide',
        message: 'Veuillez entrer un montant valide supérieur à 0.',
        buttons: ['OK']
      });
      return;
    }
    
    // Confirm before submitting
    presentAlert({
      header: 'Confirmer la dépense',
      message: `Voulez-vous vraiment dépenser ${amount}€ de la cagnotte?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          role: 'confirm',
          handler: () => {
            // Show success feedback before closing
            setShowSuccessToast(true);
            
            // Submit the transaction
            onSubmit();
            
            // Reset the amount field for next use
            onAmountChange(undefined);
            
            // Close the modal after a short delay to show the success toast
            setTimeout(() => {
              onClose();
            }, 500);
          }
        }
      ]
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="cagnotte-fullscreen-modal">
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>UTILISER LA CAGNOTTE</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                ANNULER
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div className="ion-text-center ion-padding cagnotte-header">
            <IonIcon
              icon={walletOutline}
              color="primary"
              className="cagnotte-header-icon"
            />
            <h2 className="cagnotte-header-title">
              Cagnotte disponible: {currentAmount}€
            </h2>
          </div>

          {/* Cagnotte gauge visualization */}
          <div className="ion-margin-vertical">
            <CagnotteSection 
              currentAmount={currentAmount} 
              initialAmount={initialCagnotte}
              title="État de la cagnotte"
            />
          </div>
          
          <IonItem lines="full" className="ion-margin-vertical cagnotte-amount-input">
            <IonLabel position="stacked" color="medium">Montant à dépenser (€)</IonLabel>
            <IonInput
              type="number"
              placeholder="Entrer un montant"
              value={amount}
              onIonChange={e => onAmountChange(parseFloat(e.detail.value || '0'))}
              min={0}
              max={currentAmount}
              className="amount-input"
            />
          </IonItem>
          
          {error && (
            <IonText color="danger" className="ion-padding-start">
              <p className="error-message">{error}</p>
            </IonText>
          )}
          
          <div className="ion-text-center ion-padding">
            <IonText color="medium">
              <p className="notification-info">L'utilisation de la cagnotte sera notifiée à toutes les équipes.</p>
            </IonText>
          </div>
        </IonContent>
        
        <IonFooter className="ion-padding">
          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={!amount || amount <= 0 || currentAmount <= 0}
            fill="outline"
            color="primary"
            shape="round"
            size="large"
            className="validate-button"
          >
            <IonIcon slot="start" icon={removeCircleOutline} />
            VALIDER LA DÉPENSE
          </IonButton>
        </IonFooter>
        
        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message={`${amount}€ utilisés de la cagnotte!`}
          duration={1500}
          position="middle"
          color="success"
          icon={checkmarkOutline}
        />
      </IonPage>
    </IonModal>
  );
};

export default CagnotteModal; 