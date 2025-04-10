import { useState, useEffect } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { isPlatform } from '@ionic/react';

export interface UseGeolocationResult {
  currentPosition: Position | null;
  error: GeolocationPositionError | Error | null;
  permissionStatus: PermissionStatus | null;
  getCurrentLocation: () => Promise<void>;
  watchLocation: () => Promise<string | undefined>;
  clearWatch: (watchId?: string) => Promise<void>;
}

export function useGeolocation(): UseGeolocationResult {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [error, setError] = useState<GeolocationPositionError | Error | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [watchId, setWatchId] = useState<string | undefined>(undefined);

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
    let currentStatus = permissionStatus;

    if (!currentStatus) {
        currentStatus = await checkPermissions();
    }

    if (currentStatus?.location !== 'granted') {
        currentStatus = await requestPermissions();
    }

    if (currentStatus?.location !== 'granted') {
      const permError = new Error('Geolocation permission denied');
      console.error(permError.message);
      setError(permError);
      setCurrentPosition(null);
      return;
    }

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, // Request high accuracy
        timeout: 10000, // Timeout after 10 seconds
      });
      setCurrentPosition(position);
      console.log('Current position:', position);
    } catch (err) {
      console.error('Error getting current location:', err);
      setError(err as GeolocationPositionError | Error);
      setCurrentPosition(null);
    }
  };

  const watchLocation = async (): Promise<string | undefined> => {
    setError(null);
    let currentStatus = permissionStatus;

    if (!currentStatus) {
        currentStatus = await checkPermissions();
    }

    if (currentStatus?.location !== 'granted') {
        currentStatus = await requestPermissions();
    }

    if (currentStatus?.location !== 'granted') {
      const permError = new Error('Geolocation permission denied for watch');
      console.error(permError.message);
      setError(permError);
      return undefined;
    }

    // Clear any existing watch first
    await clearWatch();

    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 20000, // Higher timeout for watch
        },
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            setError(err);
            setCurrentPosition(null);
            clearWatch(id); // Stop watching on error
            setWatchId(undefined);
          } else if (position) {
            setCurrentPosition(position);
            setError(null);
            console.log('Watched position update:', position);
          } else {
            // Handle case where position is null and no error (shouldn't typically happen)
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
        // Don't set error state here usually, just log it
      }
    }
  };

  // Optional: Check permissions on mount
  useEffect(() => {
    checkPermissions();

    // Cleanup watch on unmount
    return () => {
      if (watchId) {
        clearWatch(watchId);
      }
    };
  }, []); // Empty dependency array runs only on mount and unmount

  return {
    currentPosition,
    error,
    permissionStatus,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  };
} 