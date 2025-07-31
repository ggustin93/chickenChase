/**
 * Message Service
 * Handles all message-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { ApiResponse } from '../data/database-types';

export interface DbMessage {
  id: string;
  game_id: string;
  player_id?: string;
  content: string;
  created_at: string;
  is_system_message: boolean;
  sender?: string;
  user_id?: string;
  timestamp?: string;
  is_clue?: boolean;
  photo_url?: string;
  is_cagnotte_event?: boolean;
  is_bar_removal?: boolean;
  amount?: number;
  bar_id?: string;
}

export interface DbMessageInsert {
  game_id: string;
  player_id?: string;
  content: string;
  is_system_message?: boolean;
  sender?: string;
  user_id?: string;
  is_clue?: boolean;
  photo_url?: string;
  is_cagnotte_event?: boolean;
  is_bar_removal?: boolean;
  amount?: number;
  bar_id?: string;
}

export interface DbMessageUpdate {
  content?: string;
  is_system_message?: boolean;
  sender?: string;
  is_clue?: boolean;
  photo_url?: string;
  is_cagnotte_event?: boolean;
  is_bar_removal?: boolean;
  amount?: number;
  bar_id?: string;
}

export class MessageService extends DatabaseService<'messages', DbMessage, DbMessageInsert, DbMessageUpdate> {
  protected tableName = 'messages' as const;

  /**
   * Get messages for a specific game
   */
  async findByGameId(gameId: string): Promise<ApiResponse<DbMessage[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'created_at', ascending: true } }
    );
  }

  /**
   * Create a system message
   */
  async createSystemMessage(
    gameId: string,
    content: string,
    metadata?: {
      isClue?: boolean;
      isCagnotteEvent?: boolean;
      amount?: number;
      isBarRemoval?: boolean;
      barId?: string;
      photoUrl?: string;
    }
  ): Promise<ApiResponse<DbMessage>> {
    const messageData: DbMessageInsert = {
      game_id: gameId,
      content,
      is_system_message: true,
      sender: 'Système',
      user_id: 'system',
      is_clue: metadata?.isClue || false,
      is_cagnotte_event: metadata?.isCagnotteEvent || false,
      amount: metadata?.amount,
      is_bar_removal: metadata?.isBarRemoval || false,
      bar_id: metadata?.barId,
      photo_url: metadata?.photoUrl
    };

    return await this.create(messageData);
  }

  /**
   * Create a chicken clue message
   */
  async createChickenClue(
    gameId: string,
    content: string,
    photoUrl?: string
  ): Promise<ApiResponse<DbMessage>> {
    const messageData: DbMessageInsert = {
      game_id: gameId,
      content,
      is_system_message: false,
      sender: 'Le Poulet',
      user_id: 'chicken',
      is_clue: true,
      photo_url: photoUrl
    };

    return await this.create(messageData);
  }

  /**
   * Create a player message
   */
  async createPlayerMessage(
    gameId: string,
    playerId: string,
    content: string,
    sender: string
  ): Promise<ApiResponse<DbMessage>> {
    const messageData: DbMessageInsert = {
      game_id: gameId,
      player_id: playerId,
      content,
      is_system_message: false,
      sender,
      user_id: playerId
    };

    return await this.create(messageData);
  }

  /**
   * Create a cagnotte event message
   */
  async createCagnotteMessage(
    gameId: string,
    amount: number,
    newTotal: number
  ): Promise<ApiResponse<DbMessage>> {
    const content = amount > 0 
      ? `Cagnotte mise à jour : ${(newTotal / 100).toFixed(2)}€ (+${(amount / 100).toFixed(2)}€)`
      : `Cagnotte mise à jour : ${(newTotal / 100).toFixed(2)}€ (${(amount / 100).toFixed(2)}€)`;

    return await this.createSystemMessage(gameId, content, {
      isCagnotteEvent: true,
      amount
    });
  }

  /**
   * Create a bar removal message
   */
  async createBarRemovalMessage(
    gameId: string,
    barName: string,
    barId: string
  ): Promise<ApiResponse<DbMessage>> {
    const content = `Le bar "${barName}" a été retiré de la liste ! Il n'y a plus de poulet ici.`;

    return await this.createSystemMessage(gameId, content, {
      isBarRemoval: true,
      barId
    });
  }

  /**
   * Create a challenge completion message
   */
  async createChallengeCompletionMessage(
    gameId: string,
    teamName: string,
    challengeTitle: string,
    points: number
  ): Promise<ApiResponse<DbMessage>> {
    const content = `L'équipe ${teamName} a complété le défi "${challengeTitle}" ! +${points} points`;

    return await this.createSystemMessage(gameId, content);
  }

  /**
   * Create a chicken found message
   */
  async createChickenFoundMessage(
    gameId: string,
    teamName: string
  ): Promise<ApiResponse<DbMessage>> {
    const content = `L'équipe ${teamName} a trouvé le poulet ! Félicitations !`;

    return await this.createSystemMessage(gameId, content);
  }

  /**
   * Get only clue messages for a game
   */
  async findCluesByGameId(gameId: string): Promise<ApiResponse<DbMessage[]>> {
    return await this.findMany(
      { eq: { game_id: gameId, is_clue: true } },
      { orderBy: { column: 'created_at', ascending: true } }
    );
  }

  /**
   * Get only system messages for a game
   */
  async findSystemMessagesByGameId(gameId: string): Promise<ApiResponse<DbMessage[]>> {
    return await this.findMany(
      { eq: { game_id: gameId, is_system_message: true } },
      { orderBy: { column: 'created_at', ascending: true } }
    );
  }

  /**
   * Get cagnotte event messages for a game
   */
  async findCagnotteEventsByGameId(gameId: string): Promise<ApiResponse<DbMessage[]>> {
    return await this.findMany(
      { eq: { game_id: gameId, is_cagnotte_event: true } },
      { orderBy: { column: 'created_at', ascending: true } }
    );
  }

  /**
   * Get recent messages for a game (last N messages)
   */
  async findRecentByGameId(gameId: string, limit: number = 50): Promise<ApiResponse<DbMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return this.failure(this.formatError(error, 'findRecentByGameId'));
      }

      // Reverse to get chronological order
      return this.success((data as DbMessage[]).reverse());
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findRecentByGameId'));
    }
  }

  /**
   * Delete all messages for a game (for cleanup)
   */
  async deleteByGameId(gameId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('game_id', gameId);

      if (error) {
        return this.failure(this.formatError(error, 'deleteByGameId'));
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'deleteByGameId'));
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();