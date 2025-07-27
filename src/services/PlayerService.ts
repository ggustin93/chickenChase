/**
 * Player Service
 * Handles all player-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbPlayer, 
  DbPlayerInsert, 
  DbPlayerUpdate,
  PlayerWithRelations,
  ApiResponse 
} from '../data/database-types';

export class PlayerService extends DatabaseService<'players', DbPlayer, DbPlayerInsert, DbPlayerUpdate> {
  protected tableName = 'players' as const;

  /**
   * Get a player with all related data
   */
  async findByIdWithRelations(playerId: string): Promise<ApiResponse<PlayerWithRelations>> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          game:games(*),
          team:teams(*),
          messages(*)
        `)
        .eq('id', playerId)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findByIdWithRelations'));
      }

      return this.success(data as PlayerWithRelations);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByIdWithRelations'));
    }
  }

  /**
   * Get players for a specific game
   */
  async findByGameId(gameId: string): Promise<ApiResponse<DbPlayer[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'nickname', ascending: true } }
    );
  }

  /**
   * Get players for a specific team
   */
  async findByTeamId(teamId: string): Promise<ApiResponse<DbPlayer[]>> {
    return await this.findMany(
      { eq: { team_id: teamId } },
      { orderBy: { column: 'nickname', ascending: true } }
    );
  }

  /**
   * Find player by nickname in a specific game
   */
  async findByNicknameInGame(gameId: string, nickname: string): Promise<ApiResponse<DbPlayer | null>> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .eq('nickname', nickname)
        .limit(1);

      if (error) {
        return this.failure(this.formatError(error, 'findByNicknameInGame'));
      }

      return this.success(data.length > 0 ? data[0] as DbPlayer : null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByNicknameInGame'));
    }
  }

  /**
   * Find player by user ID in a specific game
   */
  async findByUserIdInGame(gameId: string, userId: string): Promise<ApiResponse<DbPlayer | null>> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        return this.failure(this.formatError(error, 'findByUserIdInGame'));
      }

      return this.success(data.length > 0 ? data[0] as DbPlayer : null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByUserIdInGame'));
    }
  }

  /**
   * Create a player for a game
   */
  async createPlayer(
    gameId: string,
    nickname: string,
    userId?: string
  ): Promise<ApiResponse<DbPlayer>> {
    // Check if nickname is unique in this game
    const existingPlayer = await this.findByNicknameInGame(gameId, nickname);
    if (existingPlayer.success && existingPlayer.data) {
      return this.failure('Nickname already exists in this game');
    }

    // Check if user is already in this game (if userId provided)
    if (userId) {
      const userInGame = await this.findByUserIdInGame(gameId, userId);
      if (userInGame.success && userInGame.data) {
        return this.failure('User is already in this game');
      }
    }

    const playerData: DbPlayerInsert = {
      game_id: gameId,
      nickname: nickname,
      user_id: userId,
      team_id: undefined
    };

    return await this.create(playerData);
  }

  /**
   * Join a team
   */
  async joinTeam(playerId: string, teamId: string): Promise<ApiResponse<DbPlayer>> {
    return await this.updateById(playerId, { team_id: teamId });
  }

  /**
   * Leave team
   */
  async leaveTeam(playerId: string): Promise<ApiResponse<DbPlayer>> {
    return await this.updateById(playerId, { team_id: undefined });
  }

  /**
   * Check if nickname is available in a game
   */
  async isNicknameAvailable(gameId: string, nickname: string): Promise<ApiResponse<boolean>> {
    const result = await this.exists({
      eq: { game_id: gameId, nickname: nickname }
    });

    if (!result.success) {
      return result;
    }

    return this.success(!result.data!); // Available if it doesn't exist
  }

  /**
   * Get players without a team in a game
   */
  async findPlayersWithoutTeam(gameId: string): Promise<ApiResponse<DbPlayer[]>> {
    return await this.findMany(
      { 
        eq: { game_id: gameId },
        is: { team_id: null }
      },
      { orderBy: { column: 'nickname', ascending: true } }
    );
  }

  /**
   * Get game host player
   */
  async findHostPlayer(gameId: string): Promise<ApiResponse<DbPlayer | null>> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          host_player:players!games_host_player_id_fkey(*)
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findHostPlayer'));
      }

      return this.success((data as any).host_player || null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findHostPlayer'));
    }
  }

  /**
   * Update player nickname
   */
  async updateNickname(
    playerId: string, 
    newNickname: string
  ): Promise<ApiResponse<DbPlayer>> {
    // First check the current player to get game_id
    const playerResult = await this.findById(playerId);
    if (!playerResult.success) {
      return playerResult;
    }

    const player = playerResult.data!;

    // Check if new nickname is available in the game
    const nicknameAvailable = await this.isNicknameAvailable(player.game_id, newNickname);
    if (!nicknameAvailable.success) {
      return this.failure(nicknameAvailable.error || 'Failed to check nickname availability');
    }

    if (!nicknameAvailable.data!) {
      return this.failure('Nickname already exists in this game');
    }

    return await this.updateById(playerId, { nickname: newNickname });
  }

  /**
   * Link player to authenticated user
   */
  async linkToUser(playerId: string, userId: string): Promise<ApiResponse<DbPlayer>> {
    // First check the current player to get game_id
    const playerResult = await this.findById(playerId);
    if (!playerResult.success) {
      return playerResult;
    }

    const player = playerResult.data!;

    // Check if user is already linked to another player in this game
    const userInGame = await this.findByUserIdInGame(player.game_id, userId);
    if (userInGame.success && userInGame.data && userInGame.data.id !== playerId) {
      return this.failure('User is already linked to another player in this game');
    }

    return await this.updateById(playerId, { user_id: userId });
  }

  /**
   * Get player statistics for a game
   */
  async getGamePlayerStats(gameId: string): Promise<ApiResponse<{
    totalPlayers: number;
    playersWithTeam: number;
    playersWithoutTeam: number;
    authenticatedPlayers: number;
    guestPlayers: number;
  }>> {
    try {
      const playersResult = await this.findByGameId(gameId);
      if (!playersResult.success) {
        return this.failure(playersResult.error || 'Failed to get players');
      }

      const players = playersResult.data!;
      const playersWithTeam = players.filter(p => p.team_id !== null);
      const playersWithoutTeam = players.filter(p => p.team_id === null);
      const authenticatedPlayers = players.filter(p => p.user_id !== null);
      const guestPlayers = players.filter(p => p.user_id === null);

      return this.success({
        totalPlayers: players.length,
        playersWithTeam: playersWithTeam.length,
        playersWithoutTeam: playersWithoutTeam.length,
        authenticatedPlayers: authenticatedPlayers.length,
        guestPlayers: guestPlayers.length
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGamePlayerStats'));
    }
  }

  /**
   * Remove player from game
   */
  async removeFromGame(playerId: string): Promise<ApiResponse<boolean>> {
    return await this.deleteById(playerId);
  }

  /**
   * Get all players from games that a user has participated in
   */
  async findPlayersByUserId(userId: string): Promise<ApiResponse<DbPlayer[]>> {
    return await this.findMany(
      { eq: { user_id: userId } },
      { orderBy: { column: 'nickname', ascending: true } }
    );
  }
}

// Export singleton instance
export const playerService = new PlayerService();