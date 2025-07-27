import { AddressService } from '../services/addressService';

/**
 * Utilitaire pour mettre à jour les adresses des bars d'un jeu
 */
export async function updateBarAddressesForGame(gameId: string): Promise<void> {
  console.log(`🔄 Début de la mise à jour des adresses pour le jeu ${gameId}...`);
  
  try {
    const result = await AddressService.updateGameBarAddresses(gameId);
    
    console.log(`✅ Mise à jour terminée:`, {
      updated: result.updated,
      errors: result.errors,
      gameId
    });
    
    if (result.updated > 0) {
      console.log(`🎉 ${result.updated} adresse(s) mise(s) à jour avec succès !`);
    }
    
    if (result.errors > 0) {
      console.warn(`⚠️  ${result.errors} erreur(s) lors de la mise à jour`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des adresses:', error);
    throw error;
  }
}

// Exposer la fonction globalement pour les tests en développement
if (import.meta.env.DEV) {
  (window as any).updateBarAddresses = updateBarAddressesForGame;
  console.log('🧪 Mode développement: utilisez window.updateBarAddresses(gameId) pour tester');
}