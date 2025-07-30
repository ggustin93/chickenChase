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
 * Context7-enhanced PWA navigation with router outlet management
 * Based on latest Ionic Framework PWA best practices from Context7 research
 */
export const navigatePWASafe = (
  targetPath: string,
  history: { push: (path: string) => void; replace: (path: string) => void },
  useReplace: boolean = true
): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      console.log(`Context7 PWA Navigation: Navigating to ${targetPath}`);
      
      // Pre-navigation DOM optimization from Context7 research
      const routerOutlet = document.querySelector('ion-router-outlet');
      if (routerOutlet && isPWA()) {
        // Force hardware acceleration before navigation
        (routerOutlet as HTMLElement).style.transform = 'translateZ(0)';
        (routerOutlet as HTMLElement).style.willChange = 'transform';
      }
      
      // Context7 recommendation: Always use replace for PWA to prevent stack issues
      // This prevents the white screen issue identified in research
      if (isPWA() && useReplace) {
        history.replace(targetPath);
      } else {
        history.push(targetPath);
      }
      
      // Context7-optimized timing for DOM updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Reset will-change to optimize performance
          if (routerOutlet) {
            (routerOutlet as HTMLElement).style.willChange = 'auto';
          }
          resolve(true);
        }, 100);
      });
      
    } catch (error) {
      console.error('Context7 PWA navigation error:', error);
      
      // Enhanced fallback strategy based on Context7 findings
      try {
        // Clean router outlet state before fallback
        const routerOutlet = document.querySelector('ion-router-outlet');
        if (routerOutlet) {
          (routerOutlet as HTMLElement).style.visibility = 'hidden';
          requestAnimationFrame(() => {
            (routerOutlet as HTMLElement).style.visibility = 'visible';
            window.location.href = targetPath;
          });
        } else {
          window.location.href = targetPath;
        }
        resolve(true);
      } catch (fallbackError) {
        console.error('Context7 PWA navigation fallback failed:', fallbackError);
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
 * Context7-enhanced PWA visibility and hardware back button handling
 * Implements latest Ionic PWA best practices for mobile stability
 */
export const handlePWAVisibilityChange = (): void => {
  if (isPWA()) {
    // Context7: Hardware back button support is crucial for PWA navigation
    document.addEventListener('ionBackButton', (ev: any) => {
      ev.detail.register(10, () => {
        const routerOutlet = document.querySelector('ion-router-outlet');
        if (routerOutlet && (routerOutlet as any).canGoBack()) {
          (routerOutlet as any).pop();
        } else {
          // Fallback to browser back
          window.history.back();
        }
      });
    });
    
    // iOS PWA visibility handling with Context7 optimizations
    if (isIOS()) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Context7: Force hardware acceleration refresh
          const ionApp = document.querySelector('ion-app');
          const routerOutlet = document.querySelector('ion-router-outlet');
          
          if (ionApp) {
            const element = ionApp as HTMLElement;
            element.style.transform = 'translateZ(0)';
            element.style.webkitTransform = 'translateZ(0)';
            
            // Reset after DOM update
            requestAnimationFrame(() => {
              element.style.transform = '';
              element.style.webkitTransform = '';
            });
          }
          
          // Context7: Refresh router outlet to prevent white screen
          if (routerOutlet) {
            (routerOutlet as HTMLElement).style.contain = 'layout style paint';
          }
        }
      });
      
      // Context7: Enhanced resume handling for iOS PWA
      document.addEventListener('resume', () => {
        const ionRouterOutlet = document.querySelector('ion-router-outlet');
        if (ionRouterOutlet) {
          // Force repaint with hardware acceleration
          const element = ionRouterOutlet as HTMLElement;
          element.style.visibility = 'hidden';
          element.style.transform = 'translateZ(0)';
          
          requestAnimationFrame(() => {
            element.style.visibility = 'visible';
            // Reset transform to optimize performance
            setTimeout(() => {
              element.style.transform = '';
            }, 100);
          });
        }
      });
    }
    
    // Android PWA optimizations
    if (!isIOS()) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Android PWA stability
          const routerOutlet = document.querySelector('ion-router-outlet');
          if (routerOutlet) {
            (routerOutlet as HTMLElement).style.contain = 'layout style paint';
          }
        }
      });
    }
  }
};