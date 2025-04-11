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
  IonNote,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonImg,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
  closeOutline,
  homeOutline,
  logOutOutline,
  personOutline,
  constructOutline, // Using construct for Chicken Mode
  settingsOutline, // Added for Admin Mode
  informationCircleOutline, // Added for About
  helpCircleOutline, // Added for FAQ
  storefrontOutline, // Added for Bar Partner
} from 'ionicons/icons';

interface SideMenuProps {
  gameName: string;
  mode: 'chicken' | 'player' | 'admin';
  onQuitGame: () => void;
  appVersion?: string; // Added app version prop
}

// Define mode configurations
const modeConfigs = [
  { key: 'chicken', icon: constructOutline, label: 'Mode Poulet', path: '/chicken' },
  { key: 'player', icon: personOutline, label: 'Mode Chasseur', path: '/player' },
  { key: 'admin', icon: settingsOutline, label: 'Mode Admin', path: '/admin' },
];

const SideMenu: React.FC<SideMenuProps> = ({ gameName, mode, onQuitGame, appVersion }) => {
  // Function to close menu
  const closeMenu = () => {
    menuController.close('main-menu');
  };

  // Determine the correct icon for the current mode in the header
  const currentModeConfig = modeConfigs.find(config => config.key === mode);

  return (
    <IonMenu side="start" menuId="main-menu" contentId="main-content" swipeGesture={true} type="overlay">
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary" className="pt-2 pb-1">
        
          <IonButtons slot="end"> 
            <IonButton onClick={closeMenu} fill="clear" color="light">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>


      <IonContent color="primary" className="pt-2">
        <IonCard className="mx-3 my-3 rounded-lg shadow-sm" color="light">
          <IonCardHeader className="ion-text-center ion-padding-bottom pt-4">
            <div className="flex items-center justify-center mb-3">
              <IonImg
                src="https://picsum.photos/seed/chase_logo/60/60"
                alt="Chicken Chase Logo Placeholder"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
                className="rounded-md"
              />
            </div>
            <IonCardTitle className="text-base font-semibold text-gray-800" style={{ fontFamily: "var(--ion-font-fantasy)" }}>Chicken Chase</IonCardTitle>
            <IonCardSubtitle className="text-xs font-medium text-gray-600 mt-1">{gameName}</IonCardSubtitle>
          </IonCardHeader>
        </IonCard>

        <IonList lines="none" className="ion-no-padding">
          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2">Navigation</IonListHeader>
          <IonItem button detail={false} routerLink="/home" onClick={closeMenu} lines="none" color="light" className="mx-3 mb-1 rounded-lg shadow-sm">
            <IonIcon slot="start" icon={homeOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">Tableau de bord</IonLabel>
          </IonItem>
          
          <IonItem button detail={false} routerLink="/about" onClick={closeMenu} lines="none" color="light" className="mx-3 mb-1 rounded-lg shadow-sm">
            <IonIcon slot="start" icon={informationCircleOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">À propos</IonLabel>
          </IonItem>
          
          <IonItem button detail={false} routerLink="/faq" onClick={closeMenu} lines="none" color="light" className="mx-3 mb-1 rounded-lg shadow-sm">
            <IonIcon slot="start" icon={helpCircleOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">FAQ</IonLabel>
          </IonItem>
          
          <IonItem button detail={false} routerLink="/partner" onClick={closeMenu} lines="none" color="light" className="mx-3 mb-1 rounded-lg shadow-sm">
            <IonIcon slot="start" icon={storefrontOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">Devenir bar partenaire</IonLabel>
          </IonItem>
          
          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2 mt-3">Changer de mode</IonListHeader>
          {modeConfigs.map((config) => {
            const isCurrentMode = mode === config.key;
            return (
              <IonItem
                key={config.key}
                button
                detail={false}
                routerLink={!isCurrentMode ? config.path : undefined}
                onClick={!isCurrentMode ? closeMenu : undefined}
                color="light" 
                className={`mx-3 mb-1 rounded-lg shadow-sm ${isCurrentMode ? '' : ''}`}
                disabled={isCurrentMode}
                lines="none" 
              >
                <IonIcon slot="start" icon={config.icon} color={isCurrentMode ? 'primary' : 'medium'} className="ion-margin-start" />
                <IonLabel className={`text-sm ${isCurrentMode ? 'text-primary font-semibold' : ''}`}>{config.label}</IonLabel>
              </IonItem>
            );
          })}

          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2 mt-3">Actions</IonListHeader>
          <IonItem 
            button 
            detail={false} 
            onClick={() => {
              onQuitGame();
              closeMenu();
             }}
            lines="none"
            color="light" 
            className="mx-3 mb-1 rounded-lg shadow-sm"
           >
              <IonIcon slot="start" icon={logOutOutline} color="danger" className="ion-margin-start"/>
              <IonLabel color="danger" className="text-sm font-medium">Quitter la partie</IonLabel>
          </IonItem>
        </IonList>

        {appVersion && (
          <div className="flex flex-col h-full"> 
            <div className="flex-grow"></div>
            <div className="ion-padding-horizontal pb-3 pt-2 ion-text-center">
              <IonNote color="light" className="text-xs opacity-80">Version {appVersion}</IonNote>
            </div>
          </div>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu; 