import { GoogleMapsPlace } from './googleMapsImporter';
import { AddressService } from './addressService';

/**
 * Service pour importer des bars depuis OpenStreetMap
 * Enhanced with Context7 patterns for robust error handling and PWA compatibility
 */
export class OpenStreetMapService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private static readonly OVERPASS_API_URL = import.meta.env.DEV 
    ? '/api/overpass' 
    : `${this.SUPABASE_URL}/functions/v1/search-bars`;
  
  // Context7-enhanced timeouts and retry configuration
  private static readonly REQUEST_TIMEOUT = 15000; // 15 seconds
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second base delay
  
  /**
   * Context7-enhanced fetch with AbortController, timeout, and retry logic
   */
  private static async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number = this.RETRY_ATTEMPTS
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Success case
        if (response.ok) {
          return response;
        }
        
        // Server errors (5xx) should be retried
        if (response.status >= 500 && attempt < retries) {
          console.warn(`OpenStreetMap API server error ${response.status}, retrying... (${attempt + 1}/${retries})`);
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }
        
        // Client errors (4xx) should not be retried (except rate limiting)
        if (response.status === 429 && attempt < retries) {
          console.warn('OpenStreetMap API rate limited, retrying with backoff...');
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt + 1));
          continue;
        }
        
        // Return response for non-retryable errors (will be handled by caller)
        return response;
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle AbortError (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${this.REQUEST_TIMEOUT}ms`);
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error
          lastError = new Error('Network error - check internet connection');
        } else {
          lastError = error instanceof Error ? error : new Error('Unknown error occurred');
        }
        
        if (attempt < retries) {
          console.warn(`OpenStreetMap API request failed, retrying... (${attempt + 1}/${retries}):`, lastError.message);
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }
  
  /**
   * Context7 pattern: Promise-based delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Recherche des bars, pubs et brasseries autour d'une position
   * Enhanced with Context7 error handling patterns
   */
  static async searchBarsNearLocation(
    lat: number, 
    lng: number, 
    radiusMeters: number = 1000
  ): Promise<GoogleMapsPlace[]> {
    try {
      // Input validation
      if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error('Invalid coordinates provided');
      }
      
      if (radiusMeters <= 0 || radiusMeters > 50000) {
        throw new Error('Invalid radius: must be between 1 and 50000 meters');
      }
      
      if (import.meta.env.DEV) {
        // Development: Use Vite proxy to Overpass API
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="bar"](around:${radiusMeters},${lat},${lng});
            node["amenity"="pub"](around:${radiusMeters},${lat},${lng});
            node["craft"="brewery"](around:${radiusMeters},${lat},${lng});
            way["amenity"="bar"](around:${radiusMeters},${lat},${lng});
            way["amenity"="pub"](around:${radiusMeters},${lat},${lng});
            way["craft"="brewery"](around:${radiusMeters},${lat},${lng});
          );
          out center;
        `;

        const response = await this.fetchWithRetry('/api/overpass', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'ChickenChaseApp/1.0' // Required by some OSM services
          },
          body: query
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`OpenStreetMap API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return await this.convertOSMDataToPlaces(data);
        
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!anonKey) {
          throw new Error('Missing Supabase anonymous key');
        }
        
        const response = await this.fetchWithRetry(`${this.SUPABASE_URL}/functions/v1/search-bars`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({
            lat,
            lng,
            radiusMeters
          })
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Error response from search-bars:', response.status, errorText);
          throw new Error(`Supabase function error (${response.status}): ${errorText}`);
        }

        const places = await response.json();
        
        // Validate response structure
        if (!Array.isArray(places)) {
          throw new Error('Invalid response format from search-bars function');
        }
        
        return places;
      }
    } catch (error) {
      // Context7 pattern: Structured error logging with fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('OpenStreetMap service error:', {
        error: errorMessage,
        coordinates: { lat, lng },
        radius: radiusMeters,
        environment: import.meta.env.DEV ? 'development' : 'production'
      });
      
      // Return empty array as graceful fallback to prevent white screens
      return [];
    }
  }

  /**
   * Convertit les données OpenStreetMap en format GoogleMapsPlace
   * Enhanced with Context7 error handling patterns
   */
  private static async convertOSMDataToPlaces(osmData: any): Promise<GoogleMapsPlace[]> {
    try {
      // Validate input structure
      if (!osmData || typeof osmData !== 'object') {
        console.warn('Invalid OSM data structure');
        return [];
      }
      
      if (!osmData.elements || !Array.isArray(osmData.elements)) {
        console.warn('No elements found in OSM data');
        return [];
      }

      const places = await Promise.all(
        osmData.elements.map(async (element: any) => {
          try {
            // Validate element structure
            if (!element || typeof element !== 'object' || !element.id) {
              console.warn('Invalid OSM element structure, skipping');
              return null;
            }
            
            // Extract coordinates with error handling
            let latitude = element.lat;
            let longitude = element.lon;
            
            // For ways, use center coordinates
            if (element.type === 'way' && element.center) {
              latitude = element.center.lat;
              longitude = element.center.lon;
            }
            
            // Validate coordinates
            if (!latitude || !longitude || 
                typeof latitude !== 'number' || typeof longitude !== 'number' ||
                Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
              console.warn(`Invalid coordinates for OSM element ${element.id}, skipping`);
              return null;
            }

            // Determine establishment type with fallback
            let type = 'bar';
            if (element.tags?.amenity === 'pub') type = 'pub';
            if (element.tags?.craft === 'brewery') type = 'brewery';

            // Build address from OSM tags with validation
            const addressParts: string[] = [];
            const tags = element.tags || {};
            
            if (tags['addr:housenumber'] && typeof tags['addr:housenumber'] === 'string') {
              addressParts.push(tags['addr:housenumber']);
            }
            if (tags['addr:street'] && typeof tags['addr:street'] === 'string') {
              addressParts.push(tags['addr:street']);
            }
            if (tags['addr:postcode'] && typeof tags['addr:postcode'] === 'string') {
              addressParts.push(tags['addr:postcode']);
            }
            if (tags['addr:city'] && typeof tags['addr:city'] === 'string') {
              addressParts.push(tags['addr:city']);
            }
            
            let address = addressParts.length > 0 ? addressParts.join(', ') : null;

            // Reverse geocoding fallback with enhanced error handling
            if (!address && latitude && longitude) {
              try {
                const { AddressService } = await import('./addressService');
                const reverseGeocodedAddress = await AddressService.reverseGeocode(latitude, longitude);
                address = reverseGeocodedAddress || 'Adresse non disponible';
                
                // Rate limiting: small pause to respect API limits
                await this.delay(100);
              } catch (error) {
                const elementName = tags?.name || `${type} #${element.id}`;
                console.warn('Reverse geocoding failed for', elementName, ':', 
                  error instanceof Error ? error.message : 'Unknown error');
                address = 'Adresse non disponible';
              }
            } else if (!address) {
              address = 'Adresse non disponible';
            }

            // Validate and parse rating
            let rating: number | undefined = undefined;
            if (tags?.rating) {
              const parsedRating = parseFloat(tags.rating);
              if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
                rating = parsedRating;
              }
            }

            return {
              name: (tags?.name && typeof tags.name === 'string') ? tags.name : `${type} sans nom`,
              address: address,
              latitude: latitude,
              longitude: longitude,
              types: [type, 'establishment'],
              placeId: `osm_${element.type}_${element.id}`,
              rating: rating
            } as GoogleMapsPlace;
            
          } catch (error) {
            console.warn(`Error processing OSM element ${element?.id || 'unknown'}:`, 
              error instanceof Error ? error.message : 'Unknown error');
            return null;
          }
        })
      );

      // Filter out failed conversions and validate final results
      const validPlaces = places.filter((place): place is GoogleMapsPlace => {
        if (!place) return false;
        
        // Ensure required fields are present and valid
        return place.latitude && 
               place.longitude && 
               typeof place.latitude === 'number' && 
               typeof place.longitude === 'number' &&
               Math.abs(place.latitude) <= 90 && 
               Math.abs(place.longitude) <= 180 &&
               place.name && 
               place.address &&
               place.placeId;
      });

      console.log(`Successfully converted ${validPlaces.length} out of ${osmData.elements.length} OSM elements`);
      return validPlaces;
      
    } catch (error) {
      console.error('Error converting OSM data to places:', 
        error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Géocode une adresse en utilisant Nominatim (service OSM)
   * Enhanced with Context7 error handling patterns
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Input validation
      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        throw new Error('Invalid address provided');
      }
      
      const cleanAddress = address.trim();
      
      if (import.meta.env.DEV) {
        // Development: Use Vite proxy to Nominatim
        const response = await this.fetchWithRetry(
          `/api/nominatim/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'ChickenChaseApp/1.0', // Required by Nominatim
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Nominatim API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format from Nominatim API');
        }
        
        if (data.length > 0 && data[0].lat && data[0].lon) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          // Validate coordinates
          if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            throw new Error('Invalid coordinates received from Nominatim');
          }
          
          return { lat, lng };
        }

        return null; // Address not found
        
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!anonKey) {
          throw new Error('Missing Supabase anonymous key');
        }
        
        const response = await this.fetchWithRetry(`${this.SUPABASE_URL}/functions/v1/geocode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({ address: cleanAddress })
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Address not found
          }
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Error response from geocode:', response.status, errorText);
          throw new Error(`Supabase geocode error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
          throw new Error('Invalid response format from geocode function');
        }
        
        const { lat, lng } = data;
        
        // Validate coordinates
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          throw new Error('Invalid coordinates received from geocode function');
        }
        
        return { lat, lng };
      }
    } catch (error) {
      // Context7 pattern: Structured error logging with graceful fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Geocoding service error:', {
        error: errorMessage,
        address: address?.substring(0, 100), // Limit logged address length
        environment: import.meta.env.DEV ? 'development' : 'production'
      });
      
      // Return null as graceful fallback (address not found)
      return null;
    }
  }

  /**
   * Met à jour les adresses manquantes des bars d'un jeu
   */
  static async updateMissingAddresses(gameId: string): Promise<{ updated: number; errors: number }> {
    try {
      const { AddressService } = await import('./addressService');
      return await AddressService.updateGameBarAddresses(gameId);
    } catch (error) {
      console.error('Error updating missing addresses:', error);
      return { updated: 0, errors: 1 };
    }
  }
}

export default OpenStreetMapService;