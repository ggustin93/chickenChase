export interface ChickenPosition {
  gameId: string;
  currentBarId: string | null;
  updatedAt: string;
}

export class ChickenPositionService {
  async updateChickenCurrentBar(gameId: string, barId: string | null): Promise<{ success: boolean; data?: ChickenPosition }> {
    try {
      // For now, we'll store in localStorage as a fallback until DB column is added
      if (typeof window !== 'undefined') {
        const key = `chicken_position_${gameId}`;
        const position: ChickenPosition = {
          gameId,
          currentBarId: barId,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(position));
        
        return {
          success: true,
          data: position
        };
      }

      // When the DB column is available, we'll use this:
      // const { data, error } = await supabaseClient
      //   .from('games')
      //   .update({ chicken_current_bar_id: barId })
      //   .eq('id', gameId)
      //   .single();
      
      // if (error) {
      //   return { success: false };
      // }

      return {
        success: true,
        data: { gameId, currentBarId: barId, updatedAt: new Date().toISOString() }
      };
    } catch (error) {
      console.error('Error updating chicken position:', error);
      return { success: false };
    }
  }

  async getChickenCurrentBar(gameId: string): Promise<{ success: boolean; data?: { currentBarId: string | null } }> {
    try {
      // For now, get from localStorage
      if (typeof window !== 'undefined') {
        const key = `chicken_position_${gameId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const position: ChickenPosition = JSON.parse(stored);
          return {
            success: true,
            data: { currentBarId: position.currentBarId }
          };
        }
      }

      // When the DB column is available:
      // const { data, error } = await supabaseClient
      //   .from('games')
      //   .select('chicken_current_bar_id')
      //   .eq('id', gameId)
      //   .single();

      return {
        success: true,
        data: { currentBarId: null }
      };
    } catch (error) {
      console.error('Error getting chicken position:', error);
      return { success: false };
    }
  }
}

export const chickenPositionService = new ChickenPositionService();