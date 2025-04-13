import { useState, useCallback, useEffect } from 'react';
import { Bar } from '../data/types';

interface UseBarManagementProps {
  initialBars: Bar[];
  onBarRemoved?: (barId: string, barName: string) => void;
}

interface UseBarManagementResult {
  bars: Bar[];
  removedBars: Bar[];
  removeBar: (barId: string) => Bar | undefined;
  isBarRemoved: (barId: string) => boolean;
  restoreBar: (barId: string) => Bar | undefined;
  getRemovedBar: (barId: string) => Bar | undefined;
}

/**
 * Hook to manage bars including removing and restoring them
 */
export const useBarManagement = ({
  initialBars,
  onBarRemoved
}: UseBarManagementProps): UseBarManagementResult => {
  const [bars, setBars] = useState<Bar[]>(initialBars);
  const [removedBars, setRemovedBars] = useState<Bar[]>([]);

  // Remove a bar from the available bars list
  const removeBar = useCallback((barId: string): Bar | undefined => {
    const barToRemove = bars.find(bar => bar.id === barId);
    
    if (!barToRemove) {
      console.warn(`Bar with ID ${barId} not found or already removed`);
      return undefined;
    }
    
    // Update active bars
    setBars(currentBars => currentBars.filter(bar => bar.id !== barId));
    
    // Add to removed bars
    setRemovedBars(currentRemovedBars => [...currentRemovedBars, barToRemove]);
    
    // Call callback if provided
    if (onBarRemoved) {
      onBarRemoved(barId, barToRemove.name);
    }
    
    return barToRemove;
  }, [bars, onBarRemoved]);

  // Check if a bar has been removed
  const isBarRemoved = useCallback((barId: string): boolean => {
    return removedBars.some(bar => bar.id === barId);
  }, [removedBars]);

  // Get a removed bar by ID
  const getRemovedBar = useCallback((barId: string): Bar | undefined => {
    return removedBars.find(bar => bar.id === barId);
  }, [removedBars]);

  // Restore a previously removed bar
  const restoreBar = useCallback((barId: string): Bar | undefined => {
    const barToRestore = removedBars.find(bar => bar.id === barId);
    
    if (!barToRestore) {
      console.warn(`Removed bar with ID ${barId} not found`);
      return undefined;
    }
    
    // Remove from removed bars
    setRemovedBars(currentRemovedBars => 
      currentRemovedBars.filter(bar => bar.id !== barId)
    );
    
    // Add back to active bars
    setBars(currentBars => [...currentBars, barToRestore]);
    
    return barToRestore;
  }, [removedBars]);

  // Update bars when initialBars changes (but keep track of removed bars)
  useEffect(() => {
    if (initialBars) {
      // Only include bars that aren't in the removed list
      const updatedBars = initialBars.filter(
        bar => !removedBars.some(removedBar => removedBar.id === bar.id)
      );
      setBars(updatedBars);
    }
  }, [initialBars, removedBars]);

  return {
    bars,
    removedBars,
    removeBar,
    isBarRemoved,
    restoreBar,
    getRemovedBar
  };
}; 