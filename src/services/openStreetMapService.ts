import { GoogleMapsPlace } from './googleMapsImporter';
import { AddressService } from './addressService';

/**
 * Service pour importer des bars depuis OpenStreetMap
 */
export class OpenStreetMapService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private static readonly OVERPASS_API_URL = import.meta.env.DEV 
    ? '/api/overpass' 
    : `${this.SUPABASE_URL}/functions/v1/search-bars`;
  
  /**
   * Recherche des bars, pubs et brasseries autour d'une position
   */
  static async searchBarsNearLocation(
    lat: number, 
    lng: number, 
    radiusMeters: number = 1000
  ): Promise<GoogleMapsPlace[]> {
    try {
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

        const response = await fetch('/api/overpass', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: query
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la requête OpenStreetMap');
        }

        const data = await response.json();
        return await this.convertOSMDataToPlaces(data);
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/search-bars`, {
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
          const errorText = await response.text();
          console.error('Error response from search-bars:', response.status, errorText);
          throw new Error(`Erreur lors de la requête de recherche de bars: ${response.status}`);
        }

        const places = await response.json();
        return places;
      }
    } catch (error) {
      console.error('Error fetching bars from OpenStreetMap:', error);
      return [];
    }
  }

  /**
   * Convertit les données OpenStreetMap en format GoogleMapsPlace
   */
  private static async convertOSMDataToPlaces(osmData: any): Promise<GoogleMapsPlace[]> {
    if (!osmData.elements || !Array.isArray(osmData.elements)) {
      return [];
    }

    const places = await Promise.all(
      osmData.elements.map(async (element: any) => {
        // Extraire les coordonnées
        let latitude = element.lat;
        let longitude = element.lon;
        
        // Pour les ways, utiliser le centre
        if (element.type === 'way' && element.center) {
          latitude = element.center.lat;
          longitude = element.center.lon;
        }

        // Déterminer le type d'établissement
        let type = 'bar';
        if (element.tags?.amenity === 'pub') type = 'pub';
        if (element.tags?.craft === 'brewery') type = 'brewery';

        // Construire l'adresse à partir des tags OSM
        const addressParts = [];
        if (element.tags?.['addr:housenumber']) addressParts.push(element.tags['addr:housenumber']);
        if (element.tags?.['addr:street']) addressParts.push(element.tags['addr:street']);
        if (element.tags?.['addr:postcode']) addressParts.push(element.tags['addr:postcode']);
        if (element.tags?.['addr:city']) addressParts.push(element.tags['addr:city']);
        
        let address = addressParts.length > 0 ? addressParts.join(', ') : null;

        // Si pas d'adresse dans les tags OSM, essayer le géocodage inverse
        if (!address && latitude && longitude) {
          try {
            const { AddressService } = await import('./addressService');
            const reverseGeocodedAddress = await AddressService.reverseGeocode(latitude, longitude);
            address = reverseGeocodedAddress || 'Adresse non disponible';
            
            // Petite pause pour respecter les limites de l'API
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn('Erreur lors du géocodage inverse pour', element.tags?.name, ':', error);
            address = 'Adresse non disponible';
          }
        } else if (!address) {
          address = 'Adresse non disponible';
        }

        return {
          name: element.tags?.name || `${type} sans nom`,
          address: address,
          latitude: latitude,
          longitude: longitude,
          types: [type, 'establishment'],
          placeId: `osm_${element.type}_${element.id}`,
          rating: element.tags?.rating ? parseFloat(element.tags.rating) : undefined
        };
      })
    );

    return places.filter((place: GoogleMapsPlace) => 
      // Filtrer les éléments sans coordonnées valides
      place.latitude && place.longitude
    );
  }

  /**
   * Géocode une adresse en utilisant Nominatim (service OSM)
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      if (import.meta.env.DEV) {
        // Development: Use Vite proxy to Nominatim
        const response = await fetch(
          `/api/nominatim/search?` + 
          `format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              'User-Agent': 'ChickenChaseApp/1.0' // Requis par Nominatim
            }
          }
        );

        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
        }

        return null;
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/geocode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({ address })
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Address not found
          }
          const errorText = await response.text();
          console.error('Error response from geocode:', response.status, errorText);
          throw new Error(`Erreur lors du géocodage: ${response.status}`);
        }

        const data = await response.json();
        return {
          lat: data.lat,
          lng: data.lng
        };
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
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