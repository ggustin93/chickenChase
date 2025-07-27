import { useState, useEffect } from 'react';
import { isPlatform } from '@ionic/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // iOS specific check
      if (isPlatform('ios') && (window.navigator as any).standalone) {
        setIsInstalled(true);
        return true;
      }

      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const getInstallInstructions = () => {
    if (isPlatform('ios')) {
      return {
        title: 'Installer Chicken Chase',
        steps: [
          'Appuyez sur le bouton de partage',
          'Faites défiler et sélectionnez "Sur l\'écran d\'accueil"',
          'Appuyez sur "Ajouter"'
        ]
      };
    } else if (isPlatform('android')) {
      return {
        title: 'Installer Chicken Chase',
        steps: [
          'Appuyez sur le menu (3 points)',
          'Sélectionnez "Installer l\'application"',
          'Suivez les instructions'
        ]
      };
    } else {
      return {
        title: 'Installer Chicken Chase',
        steps: [
          'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
          'Ou utilisez le menu du navigateur',
          'Sélectionnez "Installer"'
        ]
      };
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    getInstallInstructions,
    isIOS: isPlatform('ios'),
    isAndroid: isPlatform('android')
  };
};