import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/react';
import { eggOutline, searchOutline } from 'ionicons/icons';

// Simple component to render rule sections
const RuleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <IonCard className="mb-4 shadow-sm bg-light">
    <IonCardHeader>
      <IonCardTitle className="text-lg font-semibold ion-text-primary" style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}>{title}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent className="text-sm ion-text-default">
      {children}
    </IonCardContent>
  </IonCard>
);

const Rules: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" color="light" text="" />
          </IonButtons>
          <IonTitle color="light" style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}>Règles du Jeu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding bg-light-tint">
        {/* Condensed header for larger titles on scroll */}
        <IonHeader collapse="condense">
          <IonToolbar color="primary" className="pb-3">
            {/* Back button is needed here too for condensed header behavior */}
            <IonButtons slot="start">
               <IonBackButton defaultHref="/" color="light" text="" />
            </IonButtons>
            <IonTitle color="light" style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}>Règles du Jeu</IonTitle>
          </IonToolbar>
        </IonHeader>

        <RuleSection title="Objectif du Jeu">
          <p>
            L'objectif principal de "The Chicken Chase" est de retrouver le binôme "Poulet" qui se cache dans un bar de la zone de jeu définie.
            Les équipes de "Chasseurs" doivent visiter différents bars pour le trouver, tout en relevant des défis.
            Les 3 premières équipes au classement général gagnent un prix !
          </p>
        </RuleSection>

        <RuleSection title="Déroulement d'une partie">
          <p>1. Un organisateur configure la partie (zone, heure limite).</p>
          <p>2. Toutes les équipes contribuent à une cagnotte commune.</p>
          <p>3. Un binôme "Poulet" est désigné aléatoirement.</p>
          <p>4. Le Poulet choisit un bar de départ et bénéficie d'une avance.</p>
          <p>5. Une fois caché, le Poulet peut utiliser la cagnotte pour consommer dans son bar.</p>
          <p>6. Les équipes de Chasseurs se lancent à sa recherche.</p>
          <p>7. Chaque bar visité sans succès par une équipe = une consommation (sur leurs propres fonds).</p>
          <p>8. Les équipes réalisent des défis pour gagner des points bonus.</p>
          <p>9. Quand une équipe trouve le Poulet, elle partage la cagnotte restante avec lui.</p>
          <p>10. La partie se termine quand toutes les équipes ont trouvé le Poulet ou à l'heure limite.</p>
        </RuleSection>

        <RuleSection title="Rôles">
          <div className="flex items-center mb-2">
            <IonIcon icon={eggOutline} color="warning" className="text-2xl mr-2" />
            <h3 className="font-semibold text-md ion-text-warning" style={{ fontWeight: 'normal' }}>Le Poulet (Binôme)</h3>
          </div>
          <ul className="list-disc list-inside pl-4 space-y-1 text-sm mb-4">
            <li>Se cache dans un bar de la zone.</li>
            <li>Peut utiliser la cagnotte commune pour consommer.</li>
            <li>Peut envoyer des indices aux Chasseurs.</li>
            <li>Valide les défis réalisés par les équipes (preuves photos).</li>
            <li>Visualise la progression des équipes.</li>
            <li>Partage la cagnotte restante avec les équipes qui le trouvent.</li>
          </ul>

          <div className="flex items-center mb-2">
            <IonIcon icon={searchOutline} color="secondary" className="text-2xl mr-2" />
            <h3 className="font-semibold text-md ion-text-secondary" style={{ fontWeight: 'normal' }}>Les Chasseurs (En Équipes)</h3>
          </div>
          <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
            <li>Contribuent à la cagnotte initiale.</li>
            <li>Utilisent la carte pour localiser les bars.</li>
            <li>Doivent visiter les bars pour trouver le Poulet (et consommer à chaque bar erroné sur leurs fonds propres !).</li>
            <li>Réalisent des défis pour le fun et les points bonus.</li>
            <li>Communiquent au sein de leur équipe via le chat.</li>
            <li>Les 3 premières équipes à trouver le Poulet gagnent un prix.</li>
            <li>La dernière équipe paie une tournée générale.</li>
          </ul>
        </RuleSection>

        <RuleSection title="Points et Classement">
          <p>
            Un classement en temps réel motive les équipes. Des points sont attribués pour :
          </p>
          <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
            <li>Le nombre de bars visités (malus implicite).</li>
            <li>La réussite des défis (bonus).</li>
            <li>Un malus est appliqué à la dernière équipe à trouver le Poulet (elle offre la tournée générale !).</li>
          </ul>
          <p className="mt-2">
            ✨ Les 3 premières équipes à trouver le Poulet remportent un petit prix (à définir par l'organisateur).
          </p>
        </RuleSection>

        <RuleSection title="Important : Modération">
          <p className="ion-text-danger font-medium">
            Ce jeu implique la consommation d'alcool. Jouez de manière responsable.
          </p>
        </RuleSection>

      </IonContent>
    </IonPage>
  );
};

export default Rules; 