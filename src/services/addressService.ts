/**
 * Service pour la géolocalisation et le géocodage inverse d'adresses
 */
export class AddressService {
  /**
   * Géocodage inverse : obtenir une adresse à partir de coordonnées
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      if (import.meta.env.DEV) {
        // Development: Use Vite proxy
        const response = await fetch(
          `/api/nominatim/reverse?` + 
          `format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'ChickenChaseApp/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Erreur lors du géocodage inverse');
        }

        const data = await response.json();
        
        if (data && data.display_name) {
          return this.formatAddress(data);
        }

        return null;
      } else {
        // Production: Use Supabase Edge Function
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reverse-geocode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({ lat, lng })
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Address not found
          }
          const errorText = await response.text();
          console.error('Error response from reverse-geocode:', response.status, errorText);
          throw new Error(`Erreur lors du géocodage inverse: ${response.status}`);
        }

        const data = await response.json();
        return data.address;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Formate une adresse à partir des données Nominatim
   */
  private static formatAddress(data: any): string {
    const address = data.address;
    if (!address) return data.display_name || 'Adresse non disponible';

    const parts = [];
    
    // Numéro et rue
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Code postal et ville
    const cityParts = [];
    if (address.postcode) cityParts.push(address.postcode);
    if (address.city || address.town || address.village) {
      cityParts.push(address.city || address.town || address.village);
    }
    if (cityParts.length > 0) {
      parts.push(cityParts.join(' '));
    }

    // Pays si pas la Belgique
    if (address.country && address.country !== 'Belgique' && address.country !== 'Belgium') {
      parts.push(address.country);
    }

    return parts.length > 0 ? parts.join(', ') : data.display_name;
  }

  /**
   * Met à jour les adresses de tous les bars d'un jeu
   */
  static async updateGameBarAddresses(gameId: string): Promise<{ updated: number; errors: number }> {
    try {
      const { supabase } = await import('../lib/supabase');
      
      // Récupérer tous les bars du jeu sans adresse ou avec "Adresse non disponible"
      const { data: barsToUpdate, error: fetchError } = await supabase
        .from('game_bars')
        .select('id, latitude, longitude, address')
        .eq('game_id', gameId)
        .or('address.is.null,address.eq.Adresse non disponible');

      if (fetchError) {
        console.error('Erreur lors de la récupération des bars:', fetchError);
        return { updated: 0, errors: 1 };
      }

      if (!barsToUpdate || barsToUpdate.length === 0) {
        return { updated: 0, errors: 0 };
      }

      let updated = 0;
      let errors = 0;

      // Traiter les bars par lots pour éviter de surcharger l'API
      for (const bar of barsToUpdate) {
        try {
          const address = await this.reverseGeocode(bar.latitude, bar.longitude);
          
          if (address) {
            const { error: updateError } = await supabase
              .from('game_bars')
              .update({ address })
              .eq('id', bar.id);

            if (updateError) {
              console.error(`Erreur lors de la mise à jour du bar ${bar.id}:`, updateError);
              errors++;
            } else {
              updated++;
            }
          } else {
            errors++;
          }

          // Petite pause pour respecter les limites de l'API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Erreur lors du traitement du bar ${bar.id}:`, error);
          errors++;
        }
      }

      return { updated, errors };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des adresses:', error);
      return { updated: 0, errors: 1 };
    }
  }
}

export default AddressService;