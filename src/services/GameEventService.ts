/**
 * Game Event Service
 * Handles all game event-related database operations for real-time notifications
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbGameEvent, 
  DbGameEventInsert, 
  ApiResponse,
  EventType 
} from '../data/database-types';

export class GameEventService extends DatabaseService<'game_events', DbGameEvent, DbGameEventInsert, never> {
  protected tableName = 'game_events' as const;

  /**
   * Create a game event
   */
  async createEvent(
    gameId: string,
    eventType: string,
    eventData: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    const eventInsert: DbGameEventInsert = {
      game_id: gameId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString()
    };

    return await this.create(eventInsert);
  }

  /**
   * Get events for a specific game
   */
  async findByGameId(
    gameId: string, 
    limit: number = 50
  ): Promise<ApiResponse<DbGameEvent[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { 
        orderBy: { column: 'created_at', ascending: false },
        limit: limit
      }
    );
  }

  /**
   * Get events by type for a game
   */
  async findByGameIdAndType(
    gameId: string,
    eventType: string,
    limit: number = 20
  ): Promise<ApiResponse<DbGameEvent[]>> {
    return await this.findMany(
      { 
        eq: { 
          game_id: gameId,
          event_type: eventType 
        } 
      },
      { 
        orderBy: { column: 'created_at', ascending: false },
        limit: limit
      }
    );
  }

  /**
   * Get recent events across all games
   */
  async findRecentEvents(limit: number = 100): Promise<ApiResponse<DbGameEvent[]>> {
    return await this.findMany(
      {},
      { 
        orderBy: { column: 'created_at', ascending: false },
        limit: limit
      }
    );
  }

  // ===== SPECIFIC EVENT CREATORS =====

  /**
   * Create game started event
   */
  async createGameStartedEvent(
    gameId: string,
    startedBy: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'game_started', {
      started_by: startedBy,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create chicken hidden event
   */
  async createChickenHiddenEvent(
    gameId: string,
    chickenTeamId: string,
    hiddenAt: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'chicken_hidden', {
      chicken_team_id: chickenTeamId,
      hidden_at: hiddenAt,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create bar visited event
   */
  async createBarVisitedEvent(
    gameId: string,
    teamId: string,
    barId: string,
    barName: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'bar_visited', {
      team_id: teamId,
      bar_id: barId,
      bar_name: barName,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create challenge completed event
   */
  async createChallengeCompletedEvent(
    gameId: string,
    teamId: string,
    challengeId: string,
    challengeTitle: string,
    points: number,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'challenge_completed', {
      team_id: teamId,
      challenge_id: challengeId,
      challenge_title: challengeTitle,
      points: points,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create team joined event
   */
  async createTeamJoinedEvent(
    gameId: string,
    teamId: string,
    teamName: string,
    playerId: string,
    playerNickname: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'team_joined', {
      team_id: teamId,
      team_name: teamName,
      player_id: playerId,
      player_nickname: playerNickname,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create chicken found event
   */
  async createChickenFoundEvent(
    gameId: string,
    hunterTeamId: string,
    hunterTeamName: string,
    chickenTeamId: string,
    foundAt: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'chicken_found', {
      hunter_team_id: hunterTeamId,
      hunter_team_name: hunterTeamName,
      chicken_team_id: chickenTeamId,
      found_at: foundAt,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create game finished event
   */
  async createGameFinishedEvent(
    gameId: string,
    winnerTeamId: string,
    winnerTeamName: string,
    finalStats: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'game_finished', {
      winner_team_id: winnerTeamId,
      winner_team_name: winnerTeamName,
      final_stats: finalStats,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Create cagnotte updated event
   */
  async createCagnotteUpdatedEvent(
    gameId: string,
    oldAmount: number,
    newAmount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<DbGameEvent>> {
    return await this.createEvent(gameId, 'cagnotte_updated', {
      old_amount: oldAmount,
      new_amount: newAmount,
      difference: newAmount - oldAmount,
      reason: reason,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  /**
   * Subscribe to game events for real-time updates
   */
  subscribeToGameEvents(
    gameId: string,
    callback: (event: DbGameEvent) => void,
    eventTypes?: string[]
  ) {
    let channel = supabase
      .channel(`game-events-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        const event = payload.new as DbGameEvent;
        
        // Filter by event types if specified
        if (!eventTypes || eventTypes.includes(event.event_type)) {
          callback(event);
        }
      });

    channel.subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to all game events
   */
  subscribeToAllEvents(
    callback: (event: DbGameEvent) => void,
    eventTypes?: string[]
  ) {
    let channel = supabase
      .channel('all-game-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events'
      }, (payload) => {
        const event = payload.new as DbGameEvent;
        
        // Filter by event types if specified
        if (!eventTypes || eventTypes.includes(event.event_type)) {
          callback(event);
        }
      });

    channel.subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Get event statistics for a game
   */
  async getGameEventStats(gameId: string): Promise<ApiResponse<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: DbGameEvent[];
  }>> {
    try {
      // Get all events for the game
      const eventsResult = await this.findByGameId(gameId, 1000); // Get more for stats
      if (!eventsResult.success) {
        return this.failure(eventsResult.error || 'Failed to get events');
      }

      const events = eventsResult.data!;

      // Count events by type
      const eventsByType: Record<string, number> = {};
      events.forEach(event => {
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      });

      // Get recent events (last 10)
      const recentEvents = events.slice(0, 10);

      return this.success({
        totalEvents: events.length,
        eventsByType,
        recentEvents
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGameEventStats'));
    }
  }

  /**
   * Clean up old events (older than specified days)
   */
  async cleanupOldEvents(olderThanDays: number = 30): Promise<ApiResponse<boolean>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('game_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        return this.failure(this.formatError(error, 'cleanupOldEvents'));
      }

      return this.success(true);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'cleanupOldEvents'));
    }
  }
}

// Export singleton instance
export const gameEventService = new GameEventService();