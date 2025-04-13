import { useState, useEffect } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';

export interface UseGeolocationResult {
  currentPosition: Position | null;
  error: GeolocationPositionError | Error | null;
  permissionStatus: PermissionStatus | null;
  isGeolocationAvailable: boolean;
  isGettingPosition: boolean;
  getCurrentLocation: () => Promise<void>;
  watchLocation: () => Promise<string | undefined>;
  clearWatch: (watchId?: string) => Promise<void>;
}

export function useGeolocation(): UseGeolocationResult {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [error, setError] = useState<GeolocationPositionError | Error | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [watchId, setWatchId] = useState<string | undefined>(undefined);
  const [isGeolocationAvailable, setIsGeolocationAvailable] = useState(true);
  const [isGettingPosition, setIsGettingPosition] = useState(false);

  // We'll actually use these constants in conditional logic
  // based on browser detection for specialized handling
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const getPermissionInstructions = (): string => {
    if (isIOS) {
      return 'Allez dans Réglages > Safari > Permissions > Position et activez pour ce site.';
    } else if (/android/i.test(navigator.userAgent)) {
      return 'Allez dans Paramètres > Site web > Localisation (ou dans les paramètres du navigateur).';
    } else {
      return 'Vérifiez les paramètres de localisation dans votre navigateur et autorisez ce site.';
    }
  };

  const checkPermissions = async () => {
    try {
      const status = await Geolocation.checkPermissions();
      setPermissionStatus(status);
      return status;
    } catch (err) {
      console.error('Error checking geolocation permissions:', err);
      setError(err as Error);
      return null;
    }
  };

  const requestPermissions = async () => {
     try {
       const status = await Geolocation.requestPermissions();
       setPermissionStatus(status);
       return status;
     } catch (err) {
       console.error('Error requesting geolocation permissions:', err);
       setError(err as Error);
       return null;
     }
   };

  const getCurrentLocation = async () => {
    setError(null);
    setIsGettingPosition(true);
    
    try {
      // For iOS we need to directly request permissions first
      // since just calling getCurrentPosition can fail silently
      if (isIOS) {
        const requestStatus = await requestPermissions();
        
        if (requestStatus?.location !== 'granted') {
          throw new Error(`Permissions refusées. ${getPermissionInstructions()}`);
        }
      } else {
        // For other platforms, check permissions first
        const status = await checkPermissions();
        
        if (status?.location !== 'granted') {
          const requestStatus = await requestPermissions();
          
          if (requestStatus?.location !== 'granted') {
            throw new Error(`Permissions refusées. ${getPermissionInstructions()}`);
          }
        }
      }
      
      // iOS Safari needs different options
      const positionOptions = {
        enableHighAccuracy: !isIOS || !isSafari, // False for iOS Safari to improve reliability
        timeout: isIOS ? 20000 : 10000, // Longer timeout for iOS
        maximumAge: 0  // Don't use cached positions
      };
      
      const position = await Geolocation.getCurrentPosition(positionOptions);
      
      setCurrentPosition(position);
      console.log('Current position:', position);
      
    } catch (err: unknown) {
      console.error('Error getting location:', err);
      
      // Cast to type with message property for error handling
      const typedError = err as Error & { code?: number };
      
      // Improved error categorization for user feedback
      if (typedError.message && typedError.message.includes('denied')) {
        setError(new Error(`Permissions refusées. ${getPermissionInstructions()}`));
      } else if (typedError.code === 3 || (typedError.message && typedError.message.includes('timeout'))) {
        setError(new Error('Délai d\'attente dépassé. Essayez encore.'));
        
        // Try with lower accuracy as fallback
        try {
          console.log('Trying with lower accuracy...');
          
          // Special handling for iOS Safari which can be problematic
          const options = {
            enableHighAccuracy: false,
            timeout: 20000 // Longer timeout for fallback
          };
          
          const position = await Geolocation.getCurrentPosition(options);
          setCurrentPosition(position);
          setError(null); // Clear error since fallback succeeded
        } catch (fallbackErr) {
          console.error('Fallback location also failed:', fallbackErr);
        }
      } else if (typedError.code === 2 || (typedError.message && typedError.message.includes('unavailable'))) {
        setError(new Error('Position indisponible. Vérifiez que la géolocalisation est activée.'));
      } else {
        setError(typedError);
      }
      
      setCurrentPosition(null);
    } finally {
      setIsGettingPosition(false);
    }
  };

  const watchLocation = async (): Promise<string | undefined> => {
    setError(null);
    
    try {
      // For iOS we need to directly request permissions first
      // since just calling watchPosition can fail silently
      if (isIOS) {
        const requestStatus = await requestPermissions();
        
        if (requestStatus?.location !== 'granted') {
          throw new Error(`Permissions refusées pour le suivi. ${getPermissionInstructions()}`);
        }
      } else {
        // For other platforms, check permissions first
        const status = await checkPermissions();
        
        if (status?.location !== 'granted') {
          // Request permissions explicitly
          const requestStatus = await requestPermissions();
          
          if (requestStatus?.location !== 'granted') {
            throw new Error(`Permissions refusées pour le suivi. ${getPermissionInstructions()}`);
          }
        }
      }

      // Clear any existing watch first
      await clearWatch();

      // iOS Safari needs different options
      const watchOptions = {
        enableHighAccuracy: !isIOS || !isSafari, // False for iOS Safari to improve reliability
        timeout: isIOS ? 30000 : 20000, // Longer timeout for iOS
      };

      // Start watching location
      const id = await Geolocation.watchPosition(
        watchOptions,
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            
            // Categorize watch errors
            if (err.message && err.message.includes('denied')) {
              setError(new Error(`Permissions refusées pour le suivi. ${getPermissionInstructions()}`));
            } else if (err.code === 3) {
              setError(new Error('Délai d\'attente dépassé pour le suivi.'));
              
              // On timeout, don't stop watching on iOS as it might recover
              if (!isIOS) {
                clearWatch(id); // Stop watching on error for non-iOS
                setWatchId(undefined);
              }
            } else if (err.code === 2) {
              setError(new Error('Position indisponible pour le suivi.'));
            } else {
              setError(err);
            }
            
            // Don't clear position on iOS temporary errors
            if (!isIOS || (err.code !== 3 && err.code !== 2)) {
              setCurrentPosition(null);
            }
          } else if (position) {
            setCurrentPosition(position);
            setError(null);
            console.log('Watched position update:', position);
          } else {
            console.warn('Watch callback received null position without error');
          }
        }
      );
      
      setWatchId(id);
      console.log('Started watching position with ID:', id);
      return id;
    } catch (err) {
      console.error('Failed to start watching position:', err);
      setError(err as Error);
      setWatchId(undefined);
      return undefined;
    }
  };

  const clearWatch = async (id?: string) => {
    const idToClear = id || watchId;
    if (idToClear) {
      try {
        await Geolocation.clearWatch({ id: idToClear });
        console.log('Cleared position watch with ID:', idToClear);
        if (idToClear === watchId) {
          setWatchId(undefined);
        }
      } catch (err) {
        console.error('Error clearing watch:', err);
      }
    }
  };

  // Check if geolocation is available and initialize on mount
  useEffect(() => {
    // Check if geolocation is available
    if (!('geolocation' in navigator)) {
      setIsGeolocationAvailable(false);
      setError(new Error('La géolocalisation n\'est pas prise en charge par ce navigateur.'));
      return;
    }
    
    // For iOS, only check permissions but don't request automatic location
    // to prevent permission prompt not triggered by user interaction
    if (isIOS) {
      checkPermissions();
      return;
    }
    
    // Check permissions
    checkPermissions();

    // Automatically try to get initial location with a slight delay
    // This helps ensure any UI is rendered first
    const initTimer = setTimeout(() => {
      getCurrentLocation();
    }, 1000);

    // Cleanup function - clear watch and timer
    return () => {
      clearTimeout(initTimer);
      if (watchId) {
        Geolocation.clearWatch({ id: watchId }).catch(err => {
          console.error("Error clearing watch on unmount:", err);
        });
      }
    };
  }, []); // Empty dependency array runs only on mount and unmount

  return {
    currentPosition,
    error,
    permissionStatus,
    isGeolocationAvailable,
    isGettingPosition,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  };
} 