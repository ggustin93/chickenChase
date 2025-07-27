import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SearchBarsRequest {
  lat: number;
  lng: number;
  radiusMeters?: number;
}

interface Place {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  placeId: string;
  rating?: number;
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

    const { lat, lng, radiusMeters = 1000 }: SearchBarsRequest = await req.json();

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

    // Construct Overpass query
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

    // Call Overpass API
    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'ChickenChaseApp/1.0',
      },
      body: query,
    });

    if (!overpassResponse.ok) {
      throw new Error('Failed to search bars');
    }

    const data = await overpassResponse.json();
    const places = convertOSMDataToPlaces(data);

    return new Response(JSON.stringify(places), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Bar search error:', error);
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
 * Convert OpenStreetMap data to Places format
 */
function convertOSMDataToPlaces(osmData: any): Place[] {
  if (!osmData.elements || !Array.isArray(osmData.elements)) {
    return [];
  }

  return osmData.elements.map((element: any) => {
    // Extract coordinates
    let latitude = element.lat;
    let longitude = element.lon;
    
    // For ways, use the center
    if (element.type === 'way' && element.center) {
      latitude = element.center.lat;
      longitude = element.center.lon;
    }

    // Determine establishment type
    let type = 'bar';
    if (element.tags?.amenity === 'pub') type = 'pub';
    if (element.tags?.craft === 'brewery') type = 'brewery';

    // Build address
    const addressParts = [];
    if (element.tags?.['addr:housenumber']) addressParts.push(element.tags['addr:housenumber']);
    if (element.tags?.['addr:street']) addressParts.push(element.tags['addr:street']);
    if (element.tags?.['addr:postcode']) addressParts.push(element.tags['addr:postcode']);
    if (element.tags?.['addr:city']) addressParts.push(element.tags['addr:city']);
    
    const address = addressParts.length > 0 
      ? addressParts.join(', ') 
      : 'Adresse non disponible';

    return {
      name: element.tags?.name || `${type} sans nom`,
      address: address,
      latitude: latitude,
      longitude: longitude,
      types: [type, 'establishment'],
      placeId: `osm_${element.type}_${element.id}`,
      rating: element.tags?.rating ? parseFloat(element.tags.rating) : undefined
    };
  }).filter((place: Place) => 
    // Filter elements without valid coordinates
    place.latitude && place.longitude
  );
}