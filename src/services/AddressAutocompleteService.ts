/**
 * Service for address autocomplete using Nominatim (OpenStreetMap)
 */

export interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
  lat: number;
  lon: number;
  osm_type: string;
  osm_id: string;
}

export class AddressAutocompleteService {
  private static readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  
  /**
   * Get address suggestions based on user input
   */
  static async getSuggestions(query: string, limit: number = 5): Promise<AddressSuggestion[]> {
    if (query.length < 3) {
      return [];
    }

    try {
      if (import.meta.env.DEV) {
        // Development: Use Vite proxy to Nominatim
        const response = await fetch(
          `/api/nominatim/search?` + 
          `format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&countrycodes=be,fr,nl,de,lu`,
          {
            headers: {
              'User-Agent': 'ChickenChaseApp/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch address suggestions');
        }

        const data = await response.json();
        return data.map((item: any) => ({
          display_name: item.display_name,
          address: item.address || {},
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          osm_type: item.osm_type,
          osm_id: item.osm_id
        }));
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/address-autocomplete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({ query, limit })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from address-autocomplete:', response.status, errorText);
          throw new Error(`Autocomplete error: ${response.status}`);
        }

        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      return [];
    }
  }

  /**
   * Format an address suggestion for display
   */
  static formatSuggestion(suggestion: AddressSuggestion): string {
    const address = suggestion.address;
    const parts = [];
    
    // Numéro et rue
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Ville
    const city = address.city || address.town || address.village;
    if (city) {
      const cityPart = address.postcode ? `${address.postcode} ${city}` : city;
      parts.push(cityPart);
    }

    return parts.length > 0 ? parts.join(', ') : suggestion.display_name;
  }

  /**
   * Get coordinates from a suggestion
   */
  static getCoordinates(suggestion: AddressSuggestion): { lat: number; lng: number } {
    return {
      lat: suggestion.lat,
      lng: suggestion.lon
    };
  }
}

export default AddressAutocompleteService;