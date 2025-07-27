import { Redirect, Route, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, AnimationBuilder, RouteAction, RouterOptions } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useIonRouter } from '@ionic/react';
import { RouterDirection } from '@ionic/core';
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import ChickenPage from './pages/ChickenPage';
import PlayerPage from './pages/PlayerPage';
import Rules from './pages/Rules';
import About from './pages/About';
import Partner from './pages/Partner';
import JoinGamePage from './pages/JoinGamePage';
import CreateGamePage from './pages/CreateGamePage';
import LobbyPage from './pages/LobbyPage';
import SideMenu from './components/SideMenu';
import { SessionProvider } from './contexts/SessionContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import '@ionic/react/css/palettes/dark.system.css'; // Commenté pour désactiver complètement le mode sombre système d'Ionic

/* Theme variables */
import './theme/variables.css';
import './theme/dark-mode-prevention.css'; // Optimisations pour iOS et désactivation du mode sombre

/* Tailwind CSS - doit être importé après les styles Ionic */
import './index.css';

// Configurer Ionic React avec des options optimisées pour iOS
setupIonicReact({
  mode: 'ios', // Utiliser le mode iOS pour une meilleure cohérence
  animated: true,
  hardwareBackButton: true,
  rippleEffect: false, // Désactiver l'effet ripple pour de meilleures performances
});

// Use the correct signature for router.push based on linter feedback
interface MainLayoutProps {
  location: { pathname: string };
  router: {
    push: (
      pathname: string, 
      routerDirection?: RouterDirection | undefined, 
      routeAction?: RouteAction | undefined,
      routerOptions?: RouterOptions | undefined,
      animationBuilder?: AnimationBuilder | undefined
    ) => void;
  };
}

// Renamed from AppContent, accepts router context via props
const MainLayout: React.FC<MainLayoutProps> = ({ location, router }) => {
  const [gameName] = useState('v1.0'); // Placeholder

  // Determine mode based on path from props
  const currentPath = location.pathname;
  const mode = currentPath.startsWith('/chicken') ? 'chicken' : 
               currentPath.startsWith('/player') ? 'player' :
               currentPath.startsWith('/admin') ? 'admin' : undefined;

  // Define quit game handler using router from props
  const handleQuitGame = () => {
    console.log("Quitting game from App...");
    // Correct the arguments for router.push
    // Path: /home, Direction: root, Action: replace, Options: undefined
    router.push('/home', 'root', 'replace', undefined); 
  };

  // Determine if the menu should be shown
  const showMenu = mode !== undefined;

  return (
    <>
      {/* Conditionally render SideMenu only for game pages */} 
      {showMenu && mode && (
        <SideMenu 
          mode={mode} 
          gameName={gameName} 
          onQuitGame={handleQuitGame} 
        />
      )}
      {/* Use the IonRouterOutlet with the correct ID */}
      <IonRouterOutlet id="main-content">
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/chicken/:gameId">
          <ChickenPage />
        </Route>
        <Route exact path="/player/:gameId">
          <PlayerPage />
        </Route>
        <Route exact path="/join-game">
          <JoinGamePage />
        </Route>
        <Route exact path="/create-game">
          <CreateGamePage />
        </Route>
        <Route exact path="/lobby/:gameId">
          <LobbyPage />
        </Route>
        <Route exact path="/rules">
          <Rules />
        </Route>
        <Route exact path="/about">
          <About />
        </Route>
        <Route exact path="/partner">
          <Partner />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </>
  );
};

// RouterContextWrapper provides the router context to MainLayout
const RouterContextWrapper: React.FC = () => {
  const location = useLocation();
  const router = useIonRouter();
  
  return <MainLayout location={location} router={router} />;
};

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <SessionProvider>
          <RouterContextWrapper />
          <PWAInstallPrompt />
        </SessionProvider>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
