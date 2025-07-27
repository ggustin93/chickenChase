# CORS Fix Guide for OpenStreetMap API

## Problem
The "search for bars" functionality was failing with CORS errors when trying to access OpenStreetMap's Nominatim API directly from the browser.

```
Access to fetch at 'https://nominatim.openstreetmap.org/search?format=json&q=Bruxelles&limit=1' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Root Cause
- OpenStreetMap Nominatim API blocks cross-origin requests from browsers for security reasons
- Browser Same-Origin Policy prevents direct API calls to external domains
- Development server (localhost:5173) and production domains cannot directly access nominatim.openstreetmap.org

## Solution Implemented

### Development Environment
**Vite Proxy Configuration** in `vite.config.ts`:
```typescript
server: {
  proxy: {
    // Proxy OpenStreetMap Nominatim API
    '/api/nominatim': {
      target: 'https://nominatim.openstreetmap.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
      headers: {
        'User-Agent': 'ChickenChaseApp/1.0'
      }
    },
    // Proxy Overpass API for bar search
    '/api/overpass': {
      target: 'https://overpass-api.de/api/interpreter',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/overpass/, ''),
      headers: {
        'User-Agent': 'ChickenChaseApp/1.0'
      }
    }
  }
}
```

### Production Environment
**Supabase Edge Functions** deployed to handle API calls server-side:

1. **`geocode` function** - Handles address geocoding
   - Endpoint: `https://your-project.supabase.co/functions/v1/geocode`
   - Input: `{ address: string }`
   - Output: `{ lat: number, lng: number }`

2. **`search-bars` function** - Handles bar search around location
   - Endpoint: `https://your-project.supabase.co/functions/v1/search-bars`
   - Input: `{ lat: number, lng: number, radiusMeters?: number }`
   - Output: `Place[]`

### Service Layer Updates
**`OpenStreetMapService.ts`** now uses environment-aware URLs:

```typescript
// Development: Use Vite proxy
const nominatimUrl = import.meta.env.DEV 
  ? '/api/nominatim' 
  : 'https://nominatim.openstreetmap.org';

// Production: Use Supabase Edge Function
const response = await fetch(`${this.SUPABASE_URL}/functions/v1/geocode`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address })
});
```

## Benefits
✅ **Development**: Fast local development with proxy - no deployment needed
✅ **Production**: Reliable server-side API calls - no CORS issues
✅ **Performance**: Edge functions are geographically distributed
✅ **Security**: API calls are server-side, protecting from rate limiting
✅ **Reliability**: Fallback mechanisms and proper error handling

## Testing
1. **Development**: Restart dev server (`npm run dev`) after vite.config.ts changes
2. **Production**: Edge functions automatically deployed and active
3. **Verify**: Search for bars functionality should work in both environments

## Files Modified
- `vite.config.ts` - Added proxy configuration
- `src/services/openStreetMapService.ts` - Environment-aware API calls
- `supabase/functions/geocode/index.ts` - Geocoding Edge Function
- `supabase/functions/search-bars/index.ts` - Bar search Edge Function

## Troubleshooting
- **Dev proxy issues**: Check Vite proxy logs in terminal
- **Production errors**: Check Supabase Edge Function logs
- **CORS still failing**: Verify environment detection logic
- **Edge functions not deployed**: Use Supabase CLI or dashboard to deploy

The search for bars functionality should now work reliably in both development and production! 🎉