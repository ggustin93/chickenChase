// Minimal Service Worker registration - 2024 best practices
// Senior engineer approach: essential functionality only

export function register() {
  if (!('serviceWorker' in navigator)) return;
  
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Auto-update on focus (better UX than periodic checks)
      window.addEventListener('focus', () => registration.update());
      
      // Handle updates - silent reload within 300ms (unnoticeable to users)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Silent reload for smooth updates (2024 best practice)
            setTimeout(() => window.location.reload(), 200);
          }
        });
      });
      
    } catch (error) {
      // Silent failure - PWA works without SW
      console.debug('SW registration failed:', error);
    }
  });
}

export function unregister() {
  navigator.serviceWorker?.ready
    .then(registration => registration.unregister())
    .catch(() => {/* Silent failure */});
}