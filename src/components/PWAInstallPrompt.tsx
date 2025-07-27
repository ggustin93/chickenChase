import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  isPlatform
} from '@ionic/react';
import { 
  close, 
  shareOutline, 
  addCircleOutline, 
  downloadOutline,
  phonePortraitOutline,
  checkmarkCircle
} from 'ionicons/icons';
import { usePWAInstall } from '../hooks/usePWAInstall';
import '../styles/pwa-install-prompt.css';

export const PWAInstallPrompt: React.FC = () => {
  const { 
    isInstallable, 
    isInstalled, 
    promptInstall, 
    getInstallInstructions,
    isIOS,
    isAndroid 
  } = usePWAInstall();
  
  const [showModal, setShowModal] = useState(false);
  const [hasBeenPrompted, setHasBeenPrompted] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted
    const prompted = localStorage.getItem('pwa-install-prompted');
    if (prompted) {
      setHasBeenPrompted(true);
    }

    // Show prompt after a delay for iOS or if installable on other platforms
    if (!isInstalled && !prompted) {
      const timer = setTimeout(() => {
        if (isIOS || isInstallable) {
          setShowModal(true);
          localStorage.setItem('pwa-install-prompted', 'true');
          setHasBeenPrompted(true);
        }
      }, 15000); // Show after 15 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstalled, isInstallable, isIOS]);

  const handleInstall = async () => {
    if (isInstallable && !isIOS) {
      const success = await promptInstall();
      if (success) {
        setShowModal(false);
      }
    }
  };

  const instructions = getInstallInstructions();

  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Floating install button for returning users */}
      {hasBeenPrompted && !showModal && (
        <div className="pwa-install-fab">
          <IonButton
            fill="solid"
            color="primary"
            onClick={() => setShowModal(true)}
            className="pwa-install-fab-button"
          >
            <IonIcon icon={downloadOutline} slot="start" />
            Installer
          </IonButton>
        </div>
      )}

      <IonModal 
        isOpen={showModal} 
        onDidDismiss={() => setShowModal(false)}
        className="pwa-install-modal"
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Installer Chicken Chase</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <IonCard className="install-benefits-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={phonePortraitOutline} className="title-icon" />
                Profitez de l'expérience complète !
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Accès rapide depuis l'écran d'accueil</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Mode plein écran immersif</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Fonctionne hors ligne</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                  <IonLabel>Notifications en temps réel</IonLabel>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {isIOS ? (
            <IonCard className="install-instructions-card ios-instructions">
              <IonCardHeader>
                <IonCardTitle>Comment installer sur iOS</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="ios-install-steps">
                  <div className="install-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <IonIcon icon={shareOutline} className="step-icon" />
                      <IonText>
                        <p>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari</p>
                      </IonText>
                    </div>
                  </div>
                  
                  <div className="install-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <IonIcon icon={addCircleOutline} className="step-icon" />
                      <IonText>
                        <p>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong></p>
                      </IonText>
                    </div>
                  </div>
                  
                  <div className="install-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <IonIcon icon={checkmarkCircle} className="step-icon" />
                      <IonText>
                        <p>Appuyez sur <strong>"Ajouter"</strong> en haut à droite</p>
                      </IonText>
                    </div>
                  </div>
                </div>

                <div className="ios-visual-hint">
                  <IonIcon icon={shareOutline} color="primary" />
                  <IonText color="medium">
                    <p className="hint-text">Le bouton partage se trouve ici ↓</p>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard className="install-instructions-card">
              <IonCardHeader>
                <IonCardTitle>{instructions.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  {instructions.steps.map((step, index) => (
                    <IonItem key={index}>
                      <div className="step-number" slot="start">{index + 1}</div>
                      <IonLabel>{step}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
                
                {isInstallable && (
                  <IonButton 
                    expand="block" 
                    color="primary" 
                    size="large"
                    onClick={handleInstall}
                    className="install-now-button"
                  >
                    <IonIcon icon={downloadOutline} slot="start" />
                    Installer maintenant
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          )}

          <div className="install-later-section">
            <IonButton 
              fill="clear" 
              color="medium" 
              onClick={() => setShowModal(false)}
            >
              Peut-être plus tard
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};