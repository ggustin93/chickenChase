/**
 * Player Presence Service
 * Handles real-time detection of player presence and automatic cleanup of disconnected players
 */

import { supabase } from '../lib/supabase';

export interface PlayerPresence {
  player_id: string;
  game_id: string;
  last_seen: string;
  is_active: boolean;
  session_id: string; // Unique session identifier
}

export class PlayerPresenceService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionId: string;
  private playerId: string | null = null;
  private gameId: string | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly PRESENCE_TIMEOUT = 90000; // 90 seconds (3 heartbeats)
  private visibilityChangeHandler: () => void;
  private beforeUnloadHandler: () => void;

  constructor() {
    // Generate unique session ID
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up event listeners
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
    this.beforeUnloadHandler = this.handleBeforeUnload.bind(this);
    
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    
    // Handle page focus/blur for additional reliability
    window.addEventListener('focus', () => this.handleFocus());
    window.addEventListener('blur', () => this.handleBlur());
  }

  /**
   * Start tracking presence for a player in a game
   */
  async startTracking(playerId: string, gameId: string): Promise<void> {
    this.playerId = playerId;
    this.gameId = gameId;

    console.log(`🟢 Starting presence tracking for player ${playerId} in game ${gameId}`);

    // Set initial presence
    await this.updatePresence(true);

    // Start heartbeat
    this.startHeartbeat();

    // Set up cleanup for inactive players (only run this periodically to avoid overload)
    if (Math.random() < 0.1) { // Only 10% chance to run cleanup on each start
      await this.cleanupInactivePlayers();
    }
  }

  /**
   * Stop tracking presence and mark player as inactive
   */
  async stopTracking(): Promise<void> {
    console.log(`🔴 Stopping presence tracking for player ${this.playerId}`);

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Mark as inactive
    if (this.playerId && this.gameId) {
      await this.updatePresence(false);
    }

    // Clean up event listeners
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * Update player presence in the database using secure RPC function
   */
  private async updatePresence(isActive: boolean): Promise<void> {
    if (!this.playerId || !this.gameId) return;

    try {
      // Use the new secure RPC function instead of direct upsert
      const { error } = await supabase.rpc('update_my_presence', {
        p_game_id: this.gameId,
        p_is_active: isActive
      });

      if (error) {
        console.error('Error updating player presence via RPC:', error);
        // Log additional context for debugging
        console.error('RPC error details:', {
          error_code: error.code,
          error_message: error.message,
          player_id: this.playerId,
          game_id: this.gameId,
          is_active: isActive
        });
      }
    } catch (error) {
      console.error('Exception in updatePresence:', error);
    }
  }

  /**
   * Start the heartbeat mechanism
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      await this.updatePresence(true);
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Handle visibility change (tab switch, minimize, etc.)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden - reduce heartbeat frequency but don't stop
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
          await this.updatePresence(true);
        }, this.HEARTBEAT_INTERVAL * 2); // Reduce to half frequency
      }
    } else {
      // Page is visible again - restore normal heartbeat
      this.startHeartbeat();
      this.updatePresence(true);
    }
  }

  /**
   * Handle page unload
   */
  private handleBeforeUnload(): void {
    // Use sendBeacon for reliability during page unload
    if (this.playerId && this.gameId && navigator.sendBeacon) {
      const data = JSON.stringify({
        player_id: this.playerId,
        game_id: this.gameId,
        is_active: false,
        last_seen: new Date().toISOString(),
        session_id: this.sessionId
      });
      
      // Try to send beacon to a cleanup endpoint
      navigator.sendBeacon('/api/player-presence-cleanup', data);
    }
    
    // Fallback: synchronous update (may not complete)
    this.updatePresence(false);
  }

  /**
   * Handle window focus
   */
  private handleFocus(): void {
    if (this.playerId && this.gameId) {
      this.updatePresence(true);
      this.startHeartbeat();
    }
  }

  /**
   * Handle window blur
   */
  private handleBlur(): void {
    // Don't immediately mark as inactive on blur, just reduce heartbeat
    // The visibility change handler will handle this better
  }

  /**
   * Clean up inactive players from the database
   */
  async cleanupInactivePlayers(): Promise<void> {
    if (!this.gameId) return;

    try {
      const cutoffTime = new Date(Date.now() - this.PRESENCE_TIMEOUT).toISOString();
      
      // Find inactive players
      const { data: inactivePlayers, error: selectError } = await supabase
        .from('player_presence')
        .select('player_id, game_id')
        .eq('game_id', this.gameId)
        .or(`last_seen.lt.${cutoffTime},is_active.eq.false`);

      if (selectError) {
        console.error('Error finding inactive players:', selectError);
        return;
      }

      if (inactivePlayers && inactivePlayers.length > 0) {
        console.log(`🧹 Cleaning up ${inactivePlayers.length} inactive players`);
        
        // Remove inactive players from teams and mark them as inactive
        for (const player of inactivePlayers) {
          // Remove from team
          await supabase
            .from('players')
            .update({ team_id: null })
            .eq('id', player.player_id)
            .eq('game_id', player.game_id);
          
          // Delete presence record
          await supabase
            .from('player_presence')
            .delete()
            .eq('player_id', player.player_id)
            .eq('game_id', player.game_id);
        }
      }
    } catch (error) {
      console.error('Error cleaning up inactive players:', error);
    }
  }

  /**
   * Get active players for a game
   */
  static async getActivePlayers(gameId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('player_presence')
        .select('player_id')
        .eq('game_id', gameId)
        .eq('is_active', true)
        .gte('last_seen', new Date(Date.now() - 90000).toISOString()); // Active within last 90 seconds

      if (error) {
        console.error('Error getting active players:', error);
        return [];
      }

      return data?.map(p => p.player_id) || [];
    } catch (error) {
      console.error('Error in getActivePlayers:', error);
      return [];
    }
  }

  /**
   * Subscribe to presence changes for a game
   */
  static subscribeToPresenceChanges(
    gameId: string, 
    onPlayerJoined: (playerId: string) => void,
    onPlayerLeft: (playerId: string) => void
  ) {
    return supabase
      .channel(`presence-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'player_presence',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        const presence = payload.new as PlayerPresence;
        if (presence.is_active) {
          onPlayerJoined(presence.player_id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'player_presence',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        const oldPresence = payload.old as PlayerPresence;
        const newPresence = payload.new as PlayerPresence;
        
        if (oldPresence.is_active && !newPresence.is_active) {
          onPlayerLeft(newPresence.player_id);
        } else if (!oldPresence.is_active && newPresence.is_active) {
          onPlayerJoined(newPresence.player_id);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'player_presence',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        const presence = payload.old as PlayerPresence;
        onPlayerLeft(presence.player_id);
      })
      .subscribe();
  }
}

// Export singleton instance
export const playerPresenceService = new PlayerPresenceService();