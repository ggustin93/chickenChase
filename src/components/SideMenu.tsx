import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonButton,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
  closeOutline,
  homeOutline,
  logOutOutline,
  personOutline,
  constructOutline, // Using construct for Chicken Mode
} from 'ionicons/icons';

interface SideMenuProps {
  gameName: string;
  mode: 'chicken' | 'player';
  onQuitGame: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ gameName, mode, onQuitGame }) => {
  const isChickenMode = mode === 'chicken';
  const isPlayerMode = mode === 'player';
  
  // Function to close menu
  const closeMenu = () => {
    menuController.close('main-menu');
  };

  return (
    <IonMenu side="start" menuId="main-menu" contentId="main-content" swipeGesture={true} type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <div className="flex items-center p-3">
            {/* Simplified Logo/Icon */}
            <div className="bg-white rounded-full p-1 mr-3">
              <IonIcon icon={isChickenMode ? constructOutline : personOutline} color="primary" className="text-2xl" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">CHICKEN CHASE</h1>
              <div className="text-white text-xs font-semibold">
                {isChickenMode ? 'Mode Poulet' : 'Mode Chasseur'}
              </div>
            </div>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={closeMenu}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          {/* Game Info Section */}
          <div className="p-4">
            <div className="rounded-lg bg-gradient-to-r from-yellow-100 to-orange-50 p-3 mb-2">
              <div className="font-medium text-orange-800">Partie en cours</div>
              <div className="text-sm text-orange-700">{gameName}</div>
            </div>
          </div>

          {/* Section: General Navigation */}
          <IonListHeader className="font-semibold">Navigation</IonListHeader>
          <IonItem button detail={false} routerLink="/home" onClick={closeMenu}>
            <IonIcon slot="start" icon={homeOutline} color="medium" />
            <IonLabel>Tableau de bord</IonLabel>
          </IonItem>
          
          {/* Mode Switching Section */}
          <IonListHeader className="font-semibold mt-2">Changer de mode</IonListHeader>
          {/* Link to Chicken Page */}
          <IonItem
            button
            detail={false}
            routerLink={!isChickenMode ? "/chicken" : undefined}
            onClick={!isChickenMode ? closeMenu : undefined}
            color={isChickenMode ? 'light' : undefined}
            disabled={isChickenMode}
          >
            <IonIcon slot="start" icon={constructOutline} color={isChickenMode ? 'primary' : 'medium'} />
            <IonLabel className={isChickenMode ? 'font-medium' : ''}>Mode Poulet</IonLabel>
          </IonItem>
          {/* Link to Player Page */}
          <IonItem
            button
            detail={false}
            routerLink={!isPlayerMode ? "/player" : undefined}
            onClick={!isPlayerMode ? closeMenu : undefined}
            color={isPlayerMode ? 'light' : undefined}
            disabled={isPlayerMode}
          >
            <IonIcon slot="start" icon={personOutline} color={isPlayerMode ? 'primary' : 'medium'} />
            <IonLabel className={isPlayerMode ? 'font-medium' : ''}>Mode Chasseur</IonLabel>
          </IonItem>

          {/* Section: Actions */}
          <IonListHeader className="font-semibold mt-2">Actions</IonListHeader>
          <IonItem button lines="full" color="danger" detail={false} onClick={() => {
              onQuitGame();
              closeMenu();
             }}>
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Quitter la partie</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu; 