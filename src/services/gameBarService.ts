/**
 * Game Bar Service
 * Handles all game bar-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbGameBar, 
  DbGameBarInsert, 
  DbGameBarUpdate,
  ApiResponse 
} from '../data/database-types';
import { Bar } from '../data/types';

export class GameBarService extends DatabaseService<'game_bars', DbGameBar, DbGameBarInsert, DbGameBarUpdate> {
  protected tableName = 'game_bars' as const;

  /**
   * Import bars to a game
   */
  async importBarsToGame(gameId: string, bars: Bar[]): Promise<ApiResponse<DbGameBar[]>> {
    try {
      // Prepare the data for import
      const barsData: DbGameBarInsert[] = bars.map(bar => ({
        game_id: gameId,
        name: bar.name,
        address: bar.address,
        description: bar.description,
        latitude: bar.latitude,
        longitude: bar.longitude,
        photo_url: bar.photoUrl,
        google_place_id: bar.id, // The Bar ID corresponds to Google place ID
        rating: bar.description?.match(/(\d+\.\d+)⭐/)?.[1] ? parseFloat(bar.description.match(/(\d+\.\d+)⭐/)![1]) : undefined,
        visited: false,
        created_at: new Date().toISOString()
      }));

      // Call the Supabase function to import bars
      const { data, error } = await supabase.rpc('import_bars_to_game', {
        p_bars: barsData,
        p_game_id: gameId
      });

      if (error) {
        console.error('Error importing bars to game:', error);
        return this.failure(this.formatError(error, 'importBarsToGame'));
      }

      // Fetch the imported bars
      const importedBars = await this.findByGameId(gameId);
      if (!importedBars.success) {
        return this.failure('Bars imported but failed to fetch them');
      }

      return this.success(importedBars.data!);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'importBarsToGame'));
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static async importBarsToGame(gameId: string, bars: Bar[]): Promise<{ success: boolean; count: number; error?: string }> {
    const service = new GameBarService();
    const result = await service.importBarsToGame(gameId, bars);
    
    return {
      success: result.success,
      count: result.success ? result.data!.length : 0,
      error: result.error || undefined
    };
  }

  /**
   * Get all bars for a game
   */
  async findByGameId(gameId: string): Promise<ApiResponse<DbGameBar[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'name', ascending: true } }
    );
  }

  /**
   * Mark a bar as visited by a team
   */
  async markBarAsVisited(
    gameId: string, 
    barId: string, 
    teamId: string
  ): Promise<ApiResponse<DbGameBar>> {
    try {
      // Use the database function if available
      const { data, error } = await supabase.rpc('mark_bar_as_visited', {
        p_game_id: gameId,
        p_bar_id: barId,
        p_team_id: teamId
      });

      if (error) {
        return this.failure(this.formatError(error, 'markBarAsVisited'));
      }

      if (!data) {
        return this.failure('Bar could not be marked as visited (already visited or not found)');
      }

      // Fetch the updated bar
      const updatedBar = await this.findById(barId);
      if (!updatedBar.success) {
        return this.failure('Bar marked as visited but failed to fetch updated data');
      }

      return updatedBar;
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'markBarAsVisited'));
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static async markBarAsVisited(gameId: string, barId: string, teamId: string): Promise<boolean> {
    const service = new GameBarService();
    const result = await service.markBarAsVisited(gameId, barId, teamId);
    return result.success;
  }

  /**
   * Get visited bars for a game
   */
  async findVisitedBars(gameId: string): Promise<ApiResponse<DbGameBar[]>> {
    return await this.findMany(
      { 
        eq: { game_id: gameId, visited: true } 
      },
      { orderBy: { column: 'visited_at', ascending: false } }
    );
  }

  /**
   * Get unvisited bars for a game
   */
  async findUnvisitedBars(gameId: string): Promise<ApiResponse<DbGameBar[]>> {
    return await this.findMany(
      { 
        eq: { game_id: gameId },
        neq: { visited: true }
      },
      { orderBy: { column: 'name', ascending: true } }
    );
  }

  /**
   * Get the count of unvisited bars for a game
   */
  async getUnvisitedBarsCount(gameId: string): Promise<ApiResponse<number>> {
    return await this.count({
      eq: { game_id: gameId },
      neq: { visited: true }
    });
  }

  /**
   * Legacy method for backward compatibility
   */
  static async getUnvisitedBarsCount(gameId: string): Promise<number> {
    const service = new GameBarService();
    const result = await service.getUnvisitedBarsCount(gameId);
    return result.success ? result.data! : 0;
  }

  /**
   * Get bars visited by a specific team
   */
  async findBarsVisitedByTeam(teamId: string): Promise<ApiResponse<DbGameBar[]>> {
    return await this.findMany(
      { eq: { visited_by_team_id: teamId } },
      { orderBy: { column: 'visited_at', ascending: false } }
    );
  }

  /**
   * Get bars near a location (within radius in meters)
   */
  async findBarsNearLocation(
    gameId: string,
    latitude: number,
    longitude: number,
    radiusMeters: number = 1000
  ): Promise<ApiResponse<DbGameBar[]>> {
    try {
      // Use PostGIS functions if available, otherwise fall back to simple distance calculation
      const { data, error } = await supabase
        .from('game_bars')
        .select('*')
        .eq('game_id', gameId)
        .gte('latitude', latitude - (radiusMeters / 111320)) // Approximate conversion
        .lte('latitude', latitude + (radiusMeters / 111320))
        .gte('longitude', longitude - (radiusMeters / (111320 * Math.cos(latitude * Math.PI / 180))))
        .lte('longitude', longitude + (radiusMeters / (111320 * Math.cos(latitude * Math.PI / 180))))
        .order('name');

      if (error) {
        return this.failure(this.formatError(error, 'findBarsNearLocation'));
      }

      return this.success(data as DbGameBar[]);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findBarsNearLocation'));
    }
  }

  /**
   * Get game bar statistics
   */
  async getGameBarStats(gameId: string): Promise<ApiResponse<{
    totalBars: number;
    visitedBars: number;
    unvisitedBars: number;
    visitedPercentage: number;
    mostRecentVisit?: DbGameBar;
  }>> {
    try {
      const [allBars, visitedBars] = await Promise.all([
        this.findByGameId(gameId),
        this.findVisitedBars(gameId)
      ]);

      if (!allBars.success) {
        return this.failure(allBars.error || 'Failed to get bars');
      }

      if (!visitedBars.success) {
        return this.failure(visitedBars.error || 'Failed to get visited bars');
      }

      const total = allBars.data!.length;
      const visited = visitedBars.data!.length;
      const unvisited = total - visited;
      const visitedPercentage = total > 0 ? Math.round((visited / total) * 100) : 0;
      const mostRecentVisit = visitedBars.data!.length > 0 ? visitedBars.data![0] : undefined;

      return this.success({
        totalBars: total,
        visitedBars: visited,
        unvisitedBars: unvisited,
        visitedPercentage,
        mostRecentVisit
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGameBarStats'));
    }
  }

  /**
   * Convert database bar to legacy Bar format
   */
  convertToLegacyBar(dbBar: DbGameBar): Bar {
    return {
      id: dbBar.id,
      name: dbBar.name,
      address: dbBar.address,
      description: dbBar.description || '',
      latitude: dbBar.latitude,
      longitude: dbBar.longitude,
      photoUrl: dbBar.photo_url || undefined
    };
  }

  /**
   * Get bars in legacy format
   */
  async getLegacyBars(gameId: string): Promise<Bar[]> {
    const result = await this.findByGameId(gameId);
    if (!result.success) {
      return [];
    }

    return result.data!.map(bar => this.convertToLegacyBar(bar));
  }

  /**
   * Legacy method - get all bars for a game
   */
  static async getGameBars(gameId: string): Promise<Bar[]> {
    const service = new GameBarService();
    return await service.getLegacyBars(gameId);
  }
}

// Export singleton instance
export const gameBarService = new GameBarService();

// Default export for backward compatibility
export default GameBarService;