import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

interface ReverseGeocodeResponse {
  address: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { lat, lng }: ReverseGeocodeRequest = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Call Nominatim reverse geocoding API
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` + 
      `format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ChickenChaseApp/1.0',
        },
      }
    );

    if (!nominatimResponse.ok) {
      throw new Error('Failed to reverse geocode coordinates');
    }

    const data = await nominatimResponse.json();

    if (!data || !data.display_name) {
      return new Response(
        JSON.stringify({ error: 'Address not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const formattedAddress = formatAddress(data);

    const result: ReverseGeocodeResponse = {
      address: formattedAddress,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

/**
 * Format address from Nominatim data
 */
function formatAddress(data: any): string {
  const address = data.address;
  if (!address) return data.display_name || 'Adresse non disponible';

  const parts = [];
  
  // Street number and name
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  // Postal code and city
  const cityParts = [];
  if (address.postcode) cityParts.push(address.postcode);
  if (address.city || address.town || address.village) {
    cityParts.push(address.city || address.town || address.village);
  }
  if (cityParts.length > 0) {
    parts.push(cityParts.join(' '));
  }

  // Country if not Belgium
  if (address.country && address.country !== 'Belgique' && address.country !== 'Belgium') {
    parts.push(address.country);
  }

  return parts.length > 0 ? parts.join(', ') : data.display_name;
}