import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { personOutline, settingsOutline, constructOutline } from 'ionicons/icons';
// Remove ExploreContainer import if no longer used
// import ExploreContainer from '../components/ExploreContainer';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Chicken Chase Dev</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Chicken Chase Dev</IonTitle>
          </IonToolbar>
        </IonHeader>
        {/* Replace ExploreContainer with navigation links */}
        <IonList inset={true}>
          <IonItem button routerLink="/chicken" detail={true}>
            <IonIcon icon={constructOutline} slot="start" color="warning" />
            <IonLabel>
                <h2>Mode Poulet</h2>
                <p>Accéder à l'interface du Poulet</p>
            </IonLabel>
          </IonItem>
          <IonItem button routerLink="/player" detail={true}>
            <IonIcon icon={personOutline} slot="start" color="primary" />
            <IonLabel>
                <h2>Mode Chasseur</h2>
                <p>Accéder à l'interface du Chasseur</p>
            </IonLabel>
          </IonItem>
          <IonItem button routerLink="/admin" detail={true}>
            <IonIcon icon={settingsOutline} slot="start" color="tertiary" />
            <IonLabel>
                <h2>Administration</h2>
                <p>Gérer les défis et paramètres</p>
            </IonLabel>
          </IonItem>
           {/* Add more links here for other test screens if needed */}
        </IonList>
        {/* <ExploreContainer /> */}
      </IonContent>
    </IonPage>
  );
};

export default Home;
