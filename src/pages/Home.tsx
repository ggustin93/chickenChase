import { IonContent, IonPage, IonList, IonItem, IonLabel, IonIcon, IonImg } from '@ionic/react';
import { personOutline, settingsOutline, constructOutline } from 'ionicons/icons';
// Remove ExploreContainer import if no longer used
// import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
// Import the logo
import logo from '../assets/images/logo.png';

const Home: React.FC = () => {
  return (
    <IonPage>
      {/* Remove the standard header, integrate title into content */}
      {/* <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Chicken Chase Dev</IonTitle>
        </IonToolbar>
      </IonHeader> */}
      <IonContent fullscreen color="primary" className="ion-padding">
        {/* Add the logo and title section */}
        <div className="flex flex-col items-center justify-center text-center mb-8 mt-8">
          <IonImg
            src={logo}
            alt="Chicken Chase Logo"
            style={{ width: '160px', height: '160px', margin: '0 auto 1rem' }}
            className="rounded-lg shadow-lg transform transition-transform hover:scale-105 duration-300"
          />
          <h1 
            className="text-3xl text-white ion-text-default" 
            style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}
          >
            Chicken Chase
          </h1>
          <p className="text-sm text-white ion-text-default opacity-80 mt-1">
            Menu de Développement
          </p>
        </div>

        {/* Keep the navigation list, update styling */}
        <IonList inset={true} className="bg-transparent">
          <IonItem 
            button 
            routerLink="/chicken" 
            detail={true} 
            lines="none" 
            color="light" 
            className="mx-0 mb-3 rounded-lg shadow-md opacity-90 hover:opacity-100 transition-opacity"
          >
            <IonIcon icon={constructOutline} slot="start" color="warning" />
            <IonLabel>
                <h2 style={{ fontWeight: 'normal' }}>Mode Poulet</h2>
                <p>Accéder à l'interface du Poulet</p>
            </IonLabel>
          </IonItem>
          <IonItem 
            button 
            routerLink="/player" 
            detail={true}
            lines="none" 
            color="light" 
            className="mx-0 mb-3 rounded-lg shadow-md opacity-90 hover:opacity-100 transition-opacity"
          >
            <IonIcon icon={personOutline} slot="start" color="primary" />
            <IonLabel>
                <h2 style={{ fontWeight: 'normal' }}>Mode Chasseur</h2>
                <p>Accéder à l'interface du Chasseur</p>
            </IonLabel>
          </IonItem>
          <IonItem 
            button 
            routerLink="/admin" 
            detail={true}
            lines="none" 
            color="light" 
            className="mx-0 mb-3 rounded-lg shadow-md opacity-90 hover:opacity-100 transition-opacity"
          >
            <IonIcon icon={settingsOutline} slot="start" color="tertiary" />
            <IonLabel>
                <h2 style={{ fontWeight: 'normal' }}>Administration</h2>
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
