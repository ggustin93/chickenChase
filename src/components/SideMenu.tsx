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
  IonBadge,
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
        <IonToolbar color="primary" className="ion-padding-vertical">
          {/* Logo Placeholder Removed */}
          {/* <div className="flex justify-center mb-2"> */}
          {/*   <IonImg  */}
          {/*     src="https://picsum.photos/seed/logo/60/60"  */}
          {/*     alt="Chicken Chase Logo Placeholder" */}
          {/*     style={{ width: '60px', height: '60px' }}  */}
          {/*     className="rounded-md shadow-sm" */}
          {/*   /> */}
          {/* </div> */}
          
          {/* Use IonTitle for automatic font and centering */}
          <IonTitle className="ion-text-center text-3xl"> 
            CHICKEN CHASE 🐔
          </IonTitle>
          {/* Mode label below title - Centered with IonBadge using flex */}
          <div className="flex justify-center mt-1"> {/* Use flex to center */}
            <IonBadge color="secondary" className="px-2 py-1 text-xs font-semibold">
              {currentModeConfig?.label || 'Mode Inconnu'}
            </IonBadge>
          </div>

          <IonButtons slot="end" className="absolute right-2 top-1/2 transform -translate-y-1/2"> 
            <IonButton onClick={closeMenu} fill="clear" color="light">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding-top">
        {/* Game Info Section - Avatar removed, text centered */}
        <IonItem lines="none" className="px-3 pt-2 pb-3" >
          <div className="rounded-lg bg-gradient-to-br from-amber-300 to-orange-400 p-4 shadow-md flex items-center justify-center w-full"> {/* Centered content, more padding */}
            {/* Avatar Placeholder Removed */}
            {/* <IonAvatar slot="start" className="mr-3 border-2 border-white/50 shadow-sm">  */}
            {/*   <IonImg src="https://picsum.photos/seed/avatar/50/50" alt="Team Avatar Placeholder"/> */}
            {/* </IonAvatar> */}
            {/* Centered Text content */} 
            <div className="flex-grow text-center"> 
                <IonLabel className="font-bold text-sm text-orange-950 !block mb-0.5">Partie en cours</IonLabel>
                <IonNote className="text-xs font-medium text-orange-900 opacity-95 !block">{gameName}</IonNote>
            </div>
          </div>
        </IonItem>

        <IonList lines="none" className="ion-padding-top">
          <IonListHeader className="text-xs font-bold uppercase text-gray-500 tracking-wide px-4 mb-1">Navigation</IonListHeader>
          <IonItem button detail={false} routerLink="/home" onClick={closeMenu} className="ion-margin-horizontal mb-1 rounded-lg" lines="none">
            <IonIcon slot="start" icon={homeOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">Tableau de bord</IonLabel>
          </IonItem>
          
          {/* About Link */}
          <IonItem button detail={false} routerLink="/about" onClick={closeMenu} className="ion-margin-horizontal mb-1 rounded-lg" lines="none">
            <IonIcon slot="start" icon={informationCircleOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">À propos</IonLabel>
          </IonItem>
          
          {/* FAQ Link */}
          <IonItem button detail={false} routerLink="/faq" onClick={closeMenu} className="ion-margin-horizontal mb-1 rounded-lg" lines="none">
            <IonIcon slot="start" icon={helpCircleOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">FAQ</IonLabel>
          </IonItem>
          
          {/* Partner Link */}
          <IonItem button detail={false} routerLink="/partner" onClick={closeMenu} className="ion-margin-horizontal mb-1 rounded-lg" lines="none">
            <IonIcon slot="start" icon={storefrontOutline} color="medium" className="ion-margin-start"/>
            <IonLabel className="text-sm">Devenir bar partenaire</IonLabel>
          </IonItem>
          
          <IonListHeader className="text-xs font-bold uppercase text-gray-500 tracking-wide px-4 mb-1 ion-margin-top">Changer de mode</IonListHeader>
          {modeConfigs.map((config) => {
            const isCurrentMode = mode === config.key;
            return (
              <IonItem
                key={config.key}
                button
                detail={false}
                routerLink={!isCurrentMode ? config.path : undefined}
                onClick={!isCurrentMode ? closeMenu : undefined}
                color={undefined}
                className={`ion-margin-horizontal mb-1 rounded-lg ${isCurrentMode ? 'bg-orange-100 font-semibold' : ''}`}
                disabled={isCurrentMode}
                lines="none" 
              >
                <IonIcon slot="start" icon={config.icon} color={isCurrentMode ? 'primary' : 'medium'} className="ion-margin-start" />
                <IonLabel className={`text-sm ${isCurrentMode ? 'text-primary' : ''}`}>{config.label}</IonLabel>
              </IonItem>
            );
          })}

          <IonListHeader className="text-xs font-bold uppercase text-gray-500 tracking-wide px-4 mb-1 ion-margin-top">Actions</IonListHeader>
          <IonItem 
            button 
            color={undefined}
            detail={false} 
            onClick={() => {
              onQuitGame();
              closeMenu();
             }}
            className="ion-margin-horizontal mb-1 rounded-lg text-red-600"
            lines="none"
           >
              <IonIcon slot="start" icon={logOutOutline} color="danger" className="ion-margin-start"/>
              <IonLabel className="text-sm font-medium">Quitter la partie</IonLabel>
          </IonItem>
        </IonList>

        {/* App Version Display */}
        {appVersion && (
          <div className="ion-padding-horizontal ion-padding-bottom ion-text-center mt-auto">
            <IonNote className="text-xs text-gray-500">Version {appVersion}</IonNote>
          </div>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu; 