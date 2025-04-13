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
  homeOutline,
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
  { id: 'dashboard', icon: homeOutline, label: 'Tableau de bord', path: '/home' },
  { id: 'about', icon: informationCircleOutline, label: 'À propos', path: '/about' },
  { id: 'faq', icon: helpCircleOutline, label: 'FAQ', path: '/faq' },
  { id: 'partner', icon: storefrontOutline, label: 'Devenir bar partenaire', path: '/partner' },
];

const SideMenu: React.FC<SideMenuProps> = ({ 
  gameName, 
  mode, 
  onQuitGame, 
  appVersion,
  logoSrc = "https://picsum.photos/seed/chase_logo/60/60" 
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
        routerLink={item.path} 
        onClick={closeMenu} 
        lines="none" 
        color="light" 
        className="mx-3 mb-1 rounded-lg shadow-sm hover:bg-light-shade"
      >
        <IonIcon slot="start" icon={item.icon} color="medium" className="ion-margin-start"/>
        <IonLabel className="text-sm ion-text-default">{item.label}</IonLabel>
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
          color="light" 
          className={`mx-3 mb-1 rounded-lg shadow-sm transition-colors ${isCurrentMode ? 'bg-light-tint' : 'hover:bg-light-shade'}`}
          disabled={isCurrentMode}
          lines="none" 
        >
          <IonIcon 
            slot="start" 
            icon={config.icon} 
            color={isCurrentMode ? 'primary' : 'medium'} 
            className="ion-margin-start" 
          />
          <IonLabel className={`text-sm ion-text-default ${isCurrentMode ? 'text-primary font-semibold' : ''}`}>
            {config.label}
          </IonLabel>
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
        <IonToolbar color="primary" className="pt-2 pb-1">
          <IonButtons slot="end"> 
            <IonButton onClick={closeMenu} fill="clear" color="light">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="primary" className="pt-2">
        {/* Carte d'en-tête */}
        <IonCard className="mx-3 my-3 rounded-lg shadow-sm" color="light">
          <IonCardHeader className="ion-text-center ion-padding-bottom pt-4">
            <div className="flex items-center justify-center mb-3">
              <IonImg
                src={logoSrc}
                alt="Chicken Chase Logo"
                style={{ width: '80px', height: '80px', margin: '0 auto' }}
                className="rounded-md shadow-sm"
              />
            </div>
            <IonCardTitle 
              className="text-base font-semibold text-gray-800 ion-text-default" 
              style={{ fontFamily: "var(--ion-font-family)" }}
            >
              Chicken Chase
            </IonCardTitle>
            <IonCardSubtitle className="text-xs font-medium text-gray-600 mt-1 ion-text-default">
              {gameName}
            </IonCardSubtitle>
          </IonCardHeader>
        </IonCard>

        {/* Section de navigation */}
        <IonList lines="none" className="ion-no-padding">
          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2 ion-text-default">
            Navigation
          </IonListHeader>
          
          {renderNavItems()}
          
          {/* Section des modes */}
          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2 mt-3 ion-text-default">
            Changer de mode
          </IonListHeader>
          
          {renderModeSelectors()}

          {/* Section des actions */}
          <IonListHeader className="text-xs font-bold uppercase text-white/80 tracking-wide px-4 mb-2 mt-3 ion-text-default">
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
            className="mx-3 mb-1 rounded-lg shadow-sm hover:bg-light-shade"
          >
            <IonIcon slot="start" icon={logOutOutline} color="danger" className="ion-margin-start"/>
            <IonLabel color="danger" className="text-sm font-medium ion-text-default">Quitter la partie</IonLabel>
          </IonItem>
        </IonList>

        {/* Footer avec version de l'app */}
        {appVersion && (
          <div className="flex flex-col h-full"> 
            <div className="flex-grow"></div>
            <div className="ion-padding-horizontal pb-3 pt-2 ion-text-center">
              <IonNote color="light" className="text-xs opacity-80 ion-text-default">Version {appVersion}</IonNote>
            </div>
          </div>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu;