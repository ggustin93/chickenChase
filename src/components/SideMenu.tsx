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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonImg,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
  closeOutline,
  logOutOutline,
  personOutline,
  constructOutline,
  settingsOutline,
  informationCircleOutline,
  helpCircleOutline,
  storefrontOutline,
} from 'ionicons/icons';
// Import the logo
import logo from '../assets/images/logo.png';

// Définition des types
interface SideMenuProps {
  gameName: string;
  mode: 'chicken' | 'player' | 'admin';
  onQuitGame: () => void;
  appVersion?: string;
  logoSrc?: string;
}

// Configuration des modes
const MENU_MODES = [
  { key: 'chicken', icon: constructOutline, label: 'Mode Poulet', path: '/chicken' },
  { key: 'player', icon: personOutline, label: 'Mode Chasseur', path: '/player' },
  { key: 'admin', icon: settingsOutline, label: 'Mode Admin', path: '/admin' },
];

// Configuration des items de navigation
const NAV_ITEMS = [
  { id: 'about', icon: informationCircleOutline, label: 'À propos', path: '/about' },
  { id: 'faq', icon: helpCircleOutline, label: 'FAQ', path: '/faq' },
  { id: 'partner', icon: storefrontOutline, label: 'Devenir bar partenaire', path: '/partner' },
];

const SideMenu: React.FC<SideMenuProps> = ({ 
  gameName, 
  mode, 
  onQuitGame, 
  appVersion,
  logoSrc = logo 
}) => {
  // Fonction pour fermer le menu
  const closeMenu = () => menuController.close('main-menu');
  
  // Rendu des items de navigation
  const renderNavItems = () => (
    NAV_ITEMS.map(item => (
      <IonItem 
        key={item.id}
        button 
        detail={false}
        lines="none" 
        color="light" 
        className="mx-3 mb-2 rounded-lg shadow-sm opacity-80"
        disabled
      >
        <IonIcon slot="start" icon={item.icon} color="medium" className="ion-margin-start"/>
        <IonLabel className="text-sm font-medium ion-text-default">{item.label}</IonLabel>
      </IonItem>
    ))
  );

  // Rendu des sélecteurs de mode
  const renderModeSelectors = () => (
    MENU_MODES.map(config => {
      const isCurrentMode = mode === config.key;
      return (
        <IonItem
          key={config.key}
          button
          detail={false}
          routerLink={!isCurrentMode ? config.path : undefined}
          onClick={!isCurrentMode ? closeMenu : undefined}
          color={isCurrentMode ? 'light' : 'light'} 
          className={`mx-3 mb-2 rounded-lg shadow-sm transition-all duration-200 ${isCurrentMode ? 'bg-primary-tint' : 'hover:bg-light-shade'}`}
          disabled={false}
          lines="none" 
        >
          <IonIcon 
            slot="start" 
            icon={config.icon} 
            color={isCurrentMode ? 'primary' : 'medium'} 
            className="ion-margin-start transition-colors duration-200" 
          />
          <IonLabel className={`text-sm ion-text-default transition-colors duration-200 ${isCurrentMode ? 'text-primary font-semibold' : 'font-medium'}`}>
            {config.label}
          </IonLabel>
          {isCurrentMode && <div className="absolute left-0 top-1/2 w-1 h-2/3 bg-primary rounded-r-full transform -translate-y-1/2"></div>}
        </IonItem>
      );
    })
  );

  return (
    <IonMenu 
      side="start" 
      menuId="main-menu" 
      contentId="main-content" 
      swipeGesture={true} 
      type="overlay"
      className="menu-container max-w-xs w-full"
    >
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary" className="pt-3 pb-2">
          <IonButtons slot="end"> 
            <IonButton onClick={closeMenu} fill="clear" color="light">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="primary" className="pt-2">
        {/* Carte d'en-tête */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
              <IonImg
                src={logoSrc}
                alt="Chicken Chase Logo"
                style={{ width: '140px', height: '140px', margin: '0 auto' }}
                className="rounded-md shadow-sm transform transition-transform hover:scale-105 duration-300"
              />
          <h1
              className="text-2xl text-white ion-text-default" 
              style={{ fontFamily: "var(--ion-font-fantasy)" }}
            >
              Chicken Chase
            </h1>
        </div>

        {/* Section de navigation */}
        <IonList lines="none" className="ion-no-padding mt-2">
          <IonListHeader className="text-md uppercase tracking-wide px-4 mb-2 ion-text-default section-header" style={{ fontFamily: "var(--ion-font-fantasy)", color: "var(--ion-color-primary)" }}>
            Navigation
          </IonListHeader>
          
          {renderNavItems()}
          
          {/* Section des modes */}
          <IonListHeader className="text-md uppercase tracking-wide px-4 mb-2 ion-text-default section-header" style={{ fontFamily: "var(--ion-font-fantasy)", color: "var(--ion-color-primary)" }}>
            Changer de mode
          </IonListHeader>
          
          {renderModeSelectors()}

      
        </IonList>

        {/* Footer avec version de l'app */}
        {appVersion && (
          <div className="flex flex-col h-full"> 
            <div className="flex-grow"></div>
            <div className="ion-padding-horizontal pb-4 pt-3 ion-text-center">
              <IonNote color="light" className="text-xs opacity-80 ion-text-default px-2 py-1 rounded-full bg-white/10">Version {appVersion}</IonNote>
            </div>
          </div>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu;// Update the SideMenu with fantasy font
