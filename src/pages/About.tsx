import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import '../theme/variables.css'; // Ensure CSS is imported if not globally applied

const About: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" color="light" text="" />
          </IonButtons>
          <IonTitle color="light" className="fantasy-title">À Propos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" color="light" text="" />
            </IonButtons>
            <IonTitle color="light" className="fantasy-title">À Propos</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontWeight: 'normal' }}>Chicken Chase</IonCardTitle>
            <p className="text-sm text-medium mt-1">Version: 1.0.0 (Placeholder)</p>
          </IonCardHeader>
          <IonCardContent>
            <p>Développé avec ❤️ pour des soirées mémorables entre amis.</p>
            {/* TODO: Add more details about the app, creators, links etc. */}
            <p className="mt-2">Plus d'informations à venir.</p>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default About; 