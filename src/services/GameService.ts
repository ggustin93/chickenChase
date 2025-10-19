/**
 * Game Service
 * Handles all game-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbGame, 
  DbGameInsert, 
  DbGameUpdate, 
  GameWithRelations,
  ApiResponse,
  GameStatus 
} from '../data/database-types';

export class GameService extends DatabaseService<'games', DbGame, DbGameInsert, DbGameUpdate> {
  protected tableName = 'games' as const;

  /**
   * Get a game with all its related data
   */
  async findByIdWithRelations(gameId: string): Promise<ApiResponse<GameWithRelations>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          host_player:players!games_host_player_id_fkey(*),
          chicken_team:teams!games_chicken_team_id_fkey(*),
          all_teams:teams!teams_game_id_fkey(*),
          all_players:players!players_game_id_fkey(*),
          bars:game_bars(*)
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findByIdWithRelations'));
      }

      return this.success(data as GameWithRelations);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByIdWithRelations'));
    }
  }

  /**
   * Find a game by join code
   */
  async findByJoinCode(joinCode: string): Promise<ApiResponse<DbGame>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('join_code', joinCode)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findByJoinCode'));
      }

      return this.success(data as DbGame);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByJoinCode'));
    }
  }

  /**
   * Update game status with history tracking
   */
  async updateStatus(
    gameId: string, 
    newStatus: GameStatus,
    changedBy?: string,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<DbGame>> {
    try {
      const rpcResult = await supabase.rpc('update_game_status', {
        game_id: gameId,
        new_status: newStatus,
        changed_by: changedBy,
        metadata
      });
      
      if (rpcResult.error) {
        console.error('RPC Error:', rpcResult.error);
        // Fallback to manual update
        const { data: game, error: updateError } = await supabase
          .from('games')
          .update({ status: newStatus })
          .eq('id', gameId)
          .select()
          .single();
          
        if (updateError) throw updateError;
        return { success: true, game };
      }
      
      const result = rpcResult.data;
      if (result.success) {
        return { success: true, data: result };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: 'Failed to update status' };
    }
  }

  /**
   * Create a game with a host player
   */
  async createGameWithHost(
    gameData: {
      cagnotte_initial: number;
      max_teams?: number | null;
      game_duration?: number;
    },
    hostNickname: string
  ): Promise<ApiResponse<{ game: DbGame; player: { id: string }; joinCode: string }>> {
    try {
      // First try the database function if available
      const { data, error } = await supabase.rpc('create_game_and_host', {
        host_nickname: hostNickname,
        cagnotte_initial: gameData.cagnotte_initial,
        max_teams: gameData.max_teams || null,
        game_duration: gameData.game_duration || 120
      });

      // If function exists and succeeds
      if (!error && data && data.success) {
        const { game_id, player_id, join_code } = data;
        
        const gameResult = await this.findById(game_id);
        if (!gameResult.success) {
          return this.failure(gameResult.error || 'Failed to fetch created game');
        }

        return this.success({
          game: gameResult.data!,
          player: { id: player_id },
          joinCode: join_code
        });
      }

      // Fallback: Manual implementation when function doesn't exist (PGRST202)
      if (error && error.code === 'PGRST202') {
        return await this.createGameWithHostManual(gameData, hostNickname);
      }

      // Other errors
      return this.failure(this.formatError(error, 'createGameWithHost'));
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'createGameWithHost'));
    }
  }

  /**
   * Manual implementation of createGameWithHost when database function is not available
   */
  private async createGameWithHostManual(
    gameData: {
      cagnotte_initial: number;
      max_teams?: number | null;
      game_duration?: number;
    },
    hostNickname: string
  ): Promise<ApiResponse<{ game: DbGame; player: { id: string }; joinCode: string }>> {
    try {
      // 1. Generate unique join code
      let joinCode: string;
      let attempts = 0;
      do {
        joinCode = this.generateJoinCode();
        const existingGame = await supabase
          .from('games')
          .select('id')
          .eq('join_code', joinCode)
          .single();
        
        if (!existingGame.data) break; // Code is unique
        
        attempts++;
        if (attempts > 10) {
          return this.failure('Unable to generate unique join code');
        }
      } while (attempts <= 10);

      // 2. Create the game
      const gameInsertData: DbGameInsert = {
        join_code: joinCode,
        cagnotte_initial: gameData.cagnotte_initial,
        cagnotte_current: gameData.cagnotte_initial,
        max_teams: gameData.max_teams || 8,
        game_duration: gameData.game_duration || 120,
        status: 'lobby'
      };

      const { data: gameData_result, error: gameError } = await supabase
        .from('games')
        .insert([gameInsertData])
        .select()
        .single();

      if (gameError) {
        return this.failure(this.formatError(gameError, 'createGame'));
      }

      // 3. Create the host player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{
          game_id: gameData_result.id,
          nickname: hostNickname
        }])
        .select()
        .single();

      if (playerError) {
        // Cleanup: delete the game if player creation fails
        await supabase.from('games').delete().eq('id', gameData_result.id);
        return this.failure(this.formatError(playerError, 'createPlayer'));
      }

      // 4. Update game with host player ID
      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update({ host_player_id: playerData.id })
        .eq('id', gameData_result.id)
        .select()
        .single();

      if (updateError) {
        return this.failure(this.formatError(updateError, 'updateGameHost'));
      }

      return this.success({
        game: updatedGame as DbGame,
        player: { id: playerData.id },
        joinCode: joinCode
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'createGameWithHostManual'));
    }
  }

  /**
   * Generate a unique, readable join code (avoiding O, I, 0, 1)
   */
  private generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Start a game (change status to in_progress)
   */
  async startGame(gameId: string, startedBy?: string): Promise<ApiResponse<DbGame>> {
    const updateData: DbGameUpdate = {
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this.updateStatus(gameId, 'in_progress', startedBy, {
      action: 'game_started',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Hide chicken (change status to chicken_hidden)
   */
  async hideChicken(gameId: string, hiddenBy?: string): Promise<ApiResponse<DbGame>> {
    const updateData: DbGameUpdate = {
      status: 'chicken_hidden',
      chicken_hidden_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this.updateStatus(gameId, 'chicken_hidden', hiddenBy, {
      action: 'chicken_hidden',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Finish a game
   */
  async finishGame(
    gameId: string, 
    finishedBy?: string, 
    finalStats?: Record<string, any>
  ): Promise<ApiResponse<DbGame>> {
    return await this.updateStatus(gameId, 'finished', finishedBy, {
      action: 'game_finished',
      timestamp: new Date().toISOString(),
      final_stats: finalStats
    });
  }

  /**
   * Set the chicken team for a game
   */
  async setChickenTeam(gameId: string, teamId: string): Promise<ApiResponse<DbGame>> {
    return await this.updateById(gameId, {
      chicken_team_id: teamId,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Update the cagnotte (current amount)
   */
  async updateCagnotte(
    gameId: string, 
    newAmount: number,
    reason?: string
  ): Promise<ApiResponse<DbGame>> {
    const result = await this.updateById(gameId, {
      cagnotte_current: newAmount,
      updated_at: new Date().toISOString()
    });

    // Log the cagnotte change as an event
    if (result.success) {
      await supabase.from('game_events').insert({
        game_id: gameId,
        event_type: 'cagnotte_updated',
        event_data: {
          new_amount: newAmount,
          reason: reason || 'Manual update',
          timestamp: new Date().toISOString()
        }
      });
    }

    return result;
  }

  /**
   * Get games by status
   */
  async findByStatus(status: GameStatus): Promise<ApiResponse<DbGame[]>> {
    return await this.findMany({ eq: { status } });
  }

  /**
   * Get active games (lobby, in_progress, chicken_hidden)
   */
  async findActiveGames(): Promise<ApiResponse<DbGame[]>> {
    return await this.findMany({ 
      in: { 
        status: ['lobby', 'in_progress', 'chicken_hidden'] 
      } 
    });
  }

  /**
   * Get recent games with pagination
   */
  async findRecentGames(page: number = 1, limit: number = 20) {
    return await this.findPaginated(
      page, 
      limit, 
      {}, 
      { 
        orderBy: { column: 'created_at', ascending: false } 
      }
    );
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string): Promise<ApiResponse<{
    totalPlayers: number;
    totalTeams: number;
    totalBars: number;
    totalChallenges: number;
    gameStatus: GameStatus;
    duration: number | null;
  }>> {
    try {
      // Get basic game info
      const gameResult = await this.findById(gameId);
      if (!gameResult.success) {
        return this.failure(gameResult.error || 'Game not found');
      }

      const game = gameResult.data!;

      // Get counts in parallel
      const [playersCount, teamsCount, barsCount, challengesCount] = await Promise.all([
        supabase.from('players').select('id', { count: 'exact', head: true }).eq('game_id', gameId),
        supabase.from('teams').select('id', { count: 'exact', head: true }).eq('game_id', gameId),
        supabase.from('game_bars').select('id', { count: 'exact', head: true }).eq('game_id', gameId),
        supabase.from('challenges').select('id', { count: 'exact', head: true })
      ]);

      return this.success({
        totalPlayers: playersCount.count || 0,
        totalTeams: teamsCount.count || 0,
        totalBars: barsCount.count || 0,
        totalChallenges: challengesCount.count || 0,
        gameStatus: game.status,
        duration: game.game_duration
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGameStats'));
    }
  }
}

// Export singleton instance
export const gameService = new GameService();