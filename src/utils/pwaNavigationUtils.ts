/**
 * PWA Navigation Utilities
 * Provides reliable navigation helpers for Ionic React PWA on iOS
 * Based on Ionic/Capacitor best practices for PWA navigation
 */

/**
 * Checks if the app is running as a PWA
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

/**
 * Checks if the device is iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Ionic React PWA-safe navigation with proper error handling
 * Based on Ionic Framework navigation best practices
 */
export const navigatePWASafe = (
  targetPath: string,
  history: { push: (path: string) => void; replace: (path: string) => void },
  useReplace: boolean = true
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      console.log(`Ionic PWA Navigation: Navigating to ${targetPath}`);
      
      // Use replace for PWA on iOS to prevent navigation stack issues
      // This follows Ionic's recommendation for PWA navigation
      if (isPWA() && isIOS() && useReplace) {
        history.replace(targetPath);
      } else {
        history.push(targetPath);
      }
      
      // Allow time for Ionic router to process navigation
      setTimeout(() => {
        resolve(true);
      }, 150);
      
    } catch (error) {
      console.error('Ionic PWA navigation error:', error);
      
      // Fallback strategy for PWA navigation failures
      try {
        // Force location change as last resort
        window.location.href = targetPath;
        resolve(true);
      } catch (fallbackError) {
        console.error('PWA navigation fallback failed:', fallbackError);
        resolve(false);
      }
    }
  });
};

/**
 * Updates session storage with PWA-compatible error handling
 */
export const updateSessionPWASafe = (gameId: string, gameStatus: string, isChickenTeam: boolean): void => {
  try {
    const currentSession = JSON.parse(localStorage.getItem('player-session') || '{}');
    const updatedSession = {
      ...currentSession,
      gameId,
      gameStatus,
      isChickenTeam,
      timestamp: Date.now() // Add timestamp for debugging
    };
    
    localStorage.setItem('player-session', JSON.stringify(updatedSession));
    console.log('PWA Session updated:', updatedSession);
  } catch (error) {
    console.error('Error updating PWA session:', error);
    // Fallback: clear corrupted session
    localStorage.removeItem('player-session');
  }
};

/**
 * Handles PWA visibility changes to prevent white screens on iOS
 * Implements Ionic PWA best practices for iOS stability
 */
export const handlePWAVisibilityChange = (): void => {
  if (isPWA() && isIOS()) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Force hardware acceleration refresh on iOS PWA
        const ionApp = document.querySelector('ion-app');
        if (ionApp) {
          const element = ionApp as HTMLElement;
          element.style.transform = 'translateZ(0)';
          element.style.webkitTransform = 'translateZ(0)';
          
          // Reset after brief moment
          requestAnimationFrame(() => {
            element.style.transform = '';
            element.style.webkitTransform = '';
          });
        }
      }
    });
    
    // Additional iOS PWA stability measures
    document.addEventListener('resume', () => {
      // Force repaint when app resumes
      const ionRouterOutlet = document.querySelector('ion-router-outlet');
      if (ionRouterOutlet) {
        (ionRouterOutlet as HTMLElement).style.visibility = 'hidden';
        requestAnimationFrame(() => {
          (ionRouterOutlet as HTMLElement).style.visibility = 'visible';
        });
      }
    });
  }
};