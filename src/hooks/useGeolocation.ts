import { useState, useEffect } from 'react';
import { useGeolocated } from 'react-geolocated';
import { Position, PermissionStatus } from '@capacitor/geolocation';
import type { PermissionState } from '@capacitor/core';

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
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isGettingPosition, setIsGettingPosition] = useState(false);
  const [watchId, setWatchId] = useState<string | undefined>(undefined);
  
  // We'll use react-geolocated hook
  const {
    coords,
    timestamp,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
    getPosition
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
    watchPosition: false,
    userDecisionTimeout: 10000,
    suppressLocationOnMount: false,
  });

  // Map react-geolocated coords to Capacitor Position format
  const mapToCapacitorPosition = (): Position | null => {
    if (!coords) return null;
    
    return {
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
      },
      timestamp: timestamp || Date.now(),
    };
  };

  // Convert the current position to Capacitor format
  const currentPosition = mapToCapacitorPosition();

  // Map errors to maintain the same interface
  const error = positionError || null;

  // Update permission status when geolocation enabled status changes
  useEffect(() => {
    if (isGeolocationEnabled) {
      const status: PermissionStatus = {
        location: 'granted' as PermissionState,
        coarseLocation: 'granted' as PermissionState
      };
      setPermissionStatus(status);
    } else if (isGeolocationEnabled === false) {
      const status: PermissionStatus = {
        location: 'denied' as PermissionState,
        coarseLocation: 'denied' as PermissionState
      };
      setPermissionStatus(status);
    }
  }, [isGeolocationEnabled]);

  // Get current location function (uses react-geolocated's getPosition)
  const getCurrentLocation = async (): Promise<void> => {
    setIsGettingPosition(true);
    try {
      await getPosition();
    } catch (err) {
      console.error('Error getting location:', err);
    } finally {
      setIsGettingPosition(false);
    }
  };

  // Watch location (simplified implementation using the browser's navigator.geolocation)
  const watchLocation = async (): Promise<string | undefined> => {
    if (!isGeolocationAvailable) {
      throw new Error('La géolocalisation n\'est pas prise en charge par ce navigateur.');
    }
    
    // Clear any existing watch first
    await clearWatch();

    if (navigator.geolocation) {
      const id = String(navigator.geolocation.watchPosition(
        () => {
          // This is handled by react-geolocated when watchPosition: true
          // We're just returning the ID for compatibility
        },
        (error) => {
          console.error('Watch position error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      ));
      
      setWatchId(id);
      return id;
    }
    
    return undefined;
  };

  // Clear watch function
  const clearWatch = async (id?: string): Promise<void> => {
    const idToClear = id || watchId;
    if (idToClear && navigator.geolocation) {
      navigator.geolocation.clearWatch(Number(idToClear));
      if (idToClear === watchId) {
        setWatchId(undefined);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(Number(watchId));
      }
    };
  }, [watchId]);

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