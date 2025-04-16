import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonNote,
  IonCard
} from '@ionic/react';
import { businessOutline, mailOutline, callOutline, checkmarkCircleOutline } from 'ionicons/icons';

const Partner: React.FC = () => {
  const [barName, setBarName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] =useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Formulaire soumis:', { barName, contactName, email, phone, message });
    // TODO: Envoyer les données à un backend ou à une API (ex: Supabase function, Formspree)
    setSubmitted(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" color="light" text="" />
          </IonButtons>
          <IonTitle color="light" style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}>Bar Partenaire</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {/* The condensed header is not redundant - it's used for iOS large title effect when scrolling */}
        <IonHeader collapse="condense">
          <IonToolbar color="primary">
            <IonButtons slot="start">
               <IonBackButton defaultHref="/" color="light" text="" />
            </IonButtons>
            <IonTitle color="light" style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}>Bar Partenaire</IonTitle>
          </IonToolbar>
        </IonHeader>

        {!submitted ? (
          <IonCard className="ion-padding">
            <form onSubmit={handleSubmit}>
              <p className="mb-4">
                Vous souhaitez que votre établissement devienne un point d'intérêt pour les parties de Chicken Chase ?
                Remplissez ce formulaire et nous vous recontacterons !
              </p>
              <IonList lines="full" className="ion-no-margin ion-no-padding">
                <IonItem>
                  <IonIcon icon={businessOutline} slot="start" color="medium" />
                  <IonInput
                    label="Nom du bar"
                    labelPlacement="stacked"
                    value={barName}
                    placeholder="Le Perchoir Joyeux"
                    onIonInput={(e) => setBarName(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Nom du contact"
                    labelPlacement="stacked"
                    value={contactName}
                    placeholder="Jeanne Dupont"
                    onIonInput={(e) => setContactName(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonItem>
                  <IonIcon icon={mailOutline} slot="start" color="medium" />
                  <IonInput
                    label="Email"
                    labelPlacement="stacked"
                    type="email"
                    value={email}
                    placeholder="contact@perchoir.fr"
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonItem>
                  <IonIcon icon={callOutline} slot="start" color="medium" />
                  <IonInput
                    label="Téléphone (Optionnel)"
                    labelPlacement="stacked"
                    type="tel"
                    value={phone}
                    placeholder="01 23 45 67 89"
                    onIonInput={(e) => setPhone(e.detail.value!)}
                  />
                </IonItem>
                <IonItem>
                  <IonTextarea
                    label="Votre message (Optionnel)"
                    labelPlacement="stacked"
                    value={message}
                    placeholder="Pourquoi votre bar serait un excellent partenaire..."
                    onIonInput={(e) => setMessage(e.detail.value!)}
                    rows={4}
                  />
                </IonItem>
              </IonList>
              <IonButton type="submit" expand="block" fill="outline" className="mt-6">
                Envoyer la demande
              </IonButton>
              <IonNote className="ion-text-center ion-padding-top block">
                Nous reviendrons vers vous rapidement pour discuter des modalités.
              </IonNote>
            </form>
          </IonCard>
        ) : (
          <div className="ion-text-center ion-padding">
            <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '64px' }} />
            <h2 style={{ fontWeight: 'normal' }}>Demande Envoyée !</h2>
            <p>Merci pour votre intérêt ! Nous avons bien reçu votre demande et nous vous contacterons prochainement.</p>
            <IonButton expand="block" routerLink="/" routerDirection="back" className="mt-4">
              Retour à l'accueil
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Partner; 