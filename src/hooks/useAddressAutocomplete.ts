/**
 * Custom hook for address autocomplete functionality
 */

import { useState, useCallback, useRef } from 'react';
import { AddressAutocompleteService, AddressSuggestion } from '../services/AddressAutocompleteService';

interface UseAddressAutocompleteOptions {
  minLength?: number;
  debounceMs?: number;
  maxSuggestions?: number;
}

interface UseAddressAutocompleteResult {
  suggestions: AddressSuggestion[];
  loading: boolean;
  error: string | null;
  searchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
  selectSuggestion: (suggestion: AddressSuggestion) => { address: string; coordinates: { lat: number; lng: number } };
}

export const useAddressAutocomplete = (
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteResult => {
  const {
    minLength = 3,
    debounceMs = 300,
    maxSuggestions = 5
  } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const currentQueryRef = useRef<string>('');

  const searchSuggestions = useCallback(async (query: string) => {
    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    currentQueryRef.current = query;

    // Clear suggestions if query is too short
    if (query.length < minLength) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      // Check if this is still the current query
      if (currentQueryRef.current !== query) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await AddressAutocompleteService.getSuggestions(query, maxSuggestions);
        
        // Check again if this is still the current query
        if (currentQueryRef.current === query) {
          setSuggestions(results);
        }
      } catch (err) {
        if (currentQueryRef.current === query) {
          setError(err instanceof Error ? err.message : 'Erreur lors de la recherche d\'adresses');
          setSuggestions([]);
        }
      } finally {
        if (currentQueryRef.current === query) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [minLength, debounceMs, maxSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLoading(false);
    currentQueryRef.current = '';
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const selectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    const address = AddressAutocompleteService.formatSuggestion(suggestion);
    const coordinates = AddressAutocompleteService.getCoordinates(suggestion);
    
    clearSuggestions();
    
    return { address, coordinates };
  }, [clearSuggestions]);

  return {
    suggestions,
    loading,
    error,
    searchSuggestions,
    clearSuggestions,
    selectSuggestion
  };
};

export default useAddressAutocomplete;