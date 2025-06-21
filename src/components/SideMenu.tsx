import React, { useEffect } from 'react';
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
  IonImg,
  IonMenuToggle,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import {
  closeOutline,
  personOutline,
  constructOutline,
  settingsOutline,
  informationCircleOutline,
  helpCircleOutline,
  storefrontOutline,
  logOutOutline,
} from 'ionicons/icons';
// Import the logo
import logo from '../assets/images/logo.png';

// Définition des types
interface SideMenuProps {
  mode: 'chicken' | 'player' | 'admin';
  appVersion?: string;
  logoSrc?: string;
  gameName?: string;
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
  { id: 'rules', icon: helpCircleOutline, label: 'Règles du jeu', path: '/rules' },
  { id: 'partner', icon: storefrontOutline, label: 'Devenir bar partenaire', path: '/partner' },
];

const SideMenu: React.FC<SideMenuProps> = ({ 
  mode, 
  appVersion,
  logoSrc = logo,
  gameName
}) => {
  // Ensure menu closes properly when clicking outside
  useEffect(() => {
    const handleBackdropClick = () => {
      menuController.close('main-menu');
    };
    
    // Add event listener for backdrop clicks
    document.addEventListener('ionBackdrop-click', handleBackdropClick);
    
    return () => {
      // Cleanup event listener on component unmount
      document.removeEventListener('ionBackdrop-click', handleBackdropClick);
    };
  }, []);
  
  // Rendu des items de navigation
  const renderNavItems = () => (
    NAV_ITEMS.map(item => (
      <IonMenuToggle key={item.id} autoHide={false}>
        <IonItem 
          button 
          detail={false}
          lines="none" 
          color="light" 
          className="mx-3 mb-2 rounded-lg shadow-sm opacity-80"
          routerLink={item.path}
        >
          <IonIcon slot="start" icon={item.icon} color="medium" className="ion-margin-start"/>
          <IonLabel className="text-sm font-medium ion-text-default">{item.label}</IonLabel>
        </IonItem>
      </IonMenuToggle>
    ))
  );

  // Rendu des sélecteurs de mode
  const renderModeSelectors = () => (
    MENU_MODES.map(config => {
      const isCurrentMode = mode === config.key;
      return (
        <IonMenuToggle key={config.key} autoHide={false}>
          <IonItem
            button
            detail={false}
            routerLink={!isCurrentMode ? config.path : undefined}
            color={isCurrentMode ? 'light' : 'light'} 
            className={`mx-3 mb-2 rounded-lg shadow-sm transition-all duration-200 ${isCurrentMode ? 'bg-primary-tint' : 'hover:bg-light-shade'}`}
            disabled={isCurrentMode}
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
        </IonMenuToggle>
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
            <IonMenuToggle autoHide={false}>
              <IonButton fill="clear" color="light">
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            </IonMenuToggle>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="primary" className="pt-2">
        {/* Carte d'en-tête */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <IonImg
            src={logoSrc}
            alt="Chicken Chase Logo"
            style={{ maxWidth: '120px', width: '80%', height: 'auto', margin: '0 auto' }}
            className="rounded-md shadow-sm transform transition-transform hover:scale-105 duration-300"
          />
          <h1
            className="text-2xl text-white ion-text-default" 
            style={{ fontFamily: "var(--ion-font-fantasy)", fontWeight: 'normal' }}
          >
            Chicken Chase
          </h1>
          {gameName && (
            <h2 className="text-lg text-white ion-text-default mt-1 opacity-80">
              {gameName}
            </h2>
          )}
        </div>

        {/* Section de navigation */}
        <IonList lines="none" className="ion-no-padding mt-2">
          <IonListHeader className="text-sm uppercase tracking-wide px-4 mb-2 ion-text-default section-header" style={{ fontFamily: "var(--ion-font-fantasy)", color: "var(--ion-color-primary)", fontWeight: 'normal' }}>
            Navigation
          </IonListHeader>
          
          {renderNavItems()}
          
          {/* Section des modes */}
          <IonListHeader className="text-sm uppercase tracking-wide px-4 mb-2 ion-text-default section-header" style={{ fontFamily: "var(--ion-font-fantasy)", color: "var(--ion-color-primary)", fontWeight: 'normal' }}>
            Changer de mode
          </IonListHeader>
          
          {renderModeSelectors()}
        </IonList>

        {/* Bouton de déconnexion */}
        <IonItem 
          button 
          detail={false}
          lines="none" 
          color="light" 
          className="mx-3 mb-2 mt-4 rounded-lg shadow-sm opacity-80 logout-button"
          onClick={() => {
            localStorage.clear(); // Efface tout le localStorage
            window.location.href = '/home'; // Redirection vers la page d'accueil
          }}
        >
          <IonIcon slot="start" icon={logOutOutline} color="danger" className="ion-margin-start"/>
          <IonLabel className="text-sm font-medium ion-text-default" color="danger">Se déconnecter</IonLabel>
        </IonItem>
        
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

export default SideMenu;
