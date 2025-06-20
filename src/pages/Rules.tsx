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
import '../theme/variables.css'; // Ensure CSS is imported if not globally applied

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
          <IonTitle color="light" className="fantasy-title">Règles du Jeu</IonTitle>
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
            <IonTitle color="light" className="fantasy-title">Règles du Jeu</IonTitle>
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
          <p>1. Un organisateur configure la partie (zone, montant cagnotte).</p>
          <p>2. Toutes les équipes contribuent à une cagnotte commune.</p>
          <p>3. Un binôme "Poulet" est désigné aléatoirement.</p>
          <p>4. Le Poulet choisit un bar de départ et bénéficie d'une avance.</p>
          <p>5. Une fois caché, le Poulet peut utiliser la cagnotte pour ses consommations et celles des équipes qui l'ont trouvé.</p>
          <p>6. Les équipes de Chasseurs se lancent à sa recherche.</p>
          <p>7. Chaque bar visité sans succès par une équipe = une consommation (sur leurs propres fonds).</p>
          <p>8. Les équipes réalisent des défis pour gagner des points bonus.</p>
          <p>9. Au fur et à mesure que les équipes trouvent le Poulet, elles le rejoignent au bar et peuvent profiter des tournées offertes par le Poulet via la cagnotte.</p>
          <p>10. La partie se termine quand toutes les équipes ont trouvé le Poulet.</p>
        </RuleSection>

        <RuleSection title="Rôles">
          <div className="flex items-center mb-2">
            <IonIcon icon={eggOutline} color="warning" className="text-2xl mr-2" />
            <h3 className="font-semibold text-md ion-text-warning" style={{ fontWeight: 'normal' }}>Le Poulet (Binôme)</h3>
          </div>
          <ul className="list-disc list-inside pl-4 space-y-1 text-sm mb-4">
            <li>Se cache dans un bar de la zone.</li>
            <li>Utilise la cagnotte commune pour ses consommations et pour offrir des tournées aux équipes qui l'ont trouvé.</li>
            <li>Peut envoyer des indices aux Chasseurs.</li>
            <li>Valide les défis réalisés par les équipes (preuves photos).</li>
            <li>Visualise la progression des équipes.</li>
            <li>Confirme manuellement quand une équipe l'a trouvé.</li>
            <li>Peut ajouter de nouveaux défis pendant la partie !</li>
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
            <li>Une fois le Poulet trouvé, ils le rejoignent et profitent des tournées offertes.</li>
            <li>Les 3 premières équipes au classement final gagnent un prix.</li>
          </ul>
        </RuleSection>

        <RuleSection title="Points et Classement">
          <p>
            Un classement en temps réel motive les équipes. Le score final est basé sur :
          </p>
          <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
            <li>L'ordre dans lequel les équipes trouvent le Poulet (les premiers marquent plus de points).</li>
            <li>La réussite des défis (bonus de points).</li>
            <li>Le nombre de bars visités n'impacte pas directement le score, mais influence le temps pour trouver le Poulet.</li>
          </ul>
          <p className="mt-2">
            🏆 Les 3 premières équipes au classement final remportent un petit prix (à définir par l'organisateur) !
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