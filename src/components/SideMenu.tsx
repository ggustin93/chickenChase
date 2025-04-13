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
  logoSrc = "/src/assets/images/logo.png" 
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
        <IonCard className="mx-3 my-3 rounded-lg shadow-md overflow-hidden" color="light">
          <IonCardHeader className="ion-text-center ion-padding-bottom pt-4">
            <div className="flex items-center justify-center mb-4">
              <IonImg
                src={logoSrc}
                alt="Chicken Chase Logo"
                style={{ width: '90px', height: '90px', margin: '0 auto' }}
                className="rounded-md shadow-sm transform transition-transform hover:scale-105 duration-300"
              />
            </div>
            <IonCardTitle 
              className="text-lg font-bold text-gray-800 ion-text-default" 
              style={{ fontFamily: "var(--ion-font-fantasy)" }}
            >
              Chicken Chase
            </IonCardTitle>
            <IonCardSubtitle className="text-xs font-medium text-gray-600 mt-2 ion-text-default">
              {gameName}
            </IonCardSubtitle>
          </IonCardHeader>
        </IonCard>

        {/* Section de navigation */}
        <IonList lines="none" className="ion-no-padding mt-2">
          <IonListHeader className="text-xs font-bold uppercase text-white/90 tracking-wide px-4 mb-2 ion-text-default">
            Navigation
          </IonListHeader>
          
          {renderNavItems()}
          
          {/* Section des modes */}
          <IonListHeader className="text-xs font-bold uppercase text-white/90 tracking-wide px-4 mb-2 mt-4 ion-text-default">
            Changer de mode
          </IonListHeader>
          
          {renderModeSelectors()}

          {/* Section des actions */}
          <IonListHeader className="text-xs font-bold uppercase text-white/90 tracking-wide px-4 mb-2 mt-4 ion-text-default">
            Actions
          </IonListHeader>
          
          <IonItem 
            button 
            detail={false} 
            onClick={() => {
              onQuitGame();
              closeMenu();
            }}
            lines="none"
            color="light" 
            className="mx-3 mb-1 rounded-lg shadow-sm hover:bg-danger-tint transition-all duration-200 group"
          >
            <IonIcon slot="start" icon={logOutOutline} color="danger" className="ion-margin-start group-hover:animate-pulse"/>
            <IonLabel color="danger" className="text-sm font-medium ion-text-default">Quitter la partie</IonLabel>
          </IonItem>
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
