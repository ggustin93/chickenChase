/**
 * Session Migration and Validation Utility
 * 
 * Handles migration of legacy sessions with invalid team IDs
 * to proper UUID format by querying the database.
 */

import { supabase } from '../lib/supabase';

export interface PlayerSession {
  playerId: string;
  nickname: string;
  gameId: string;
  teamId?: string;
  gameStatus?: string;
  isChickenTeam?: boolean;
  timestamp?: number;
}

/**
 * Validates if a string is a proper UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Migrates a session with invalid team ID to proper UUID
 */
async function migrateInvalidTeamId(session: PlayerSession): Promise<PlayerSession | null> {
  console.log('🔧 Session migration: Invalid teamId detected:', session.teamId);
  
  try {
    // Try to find the player's team from the database
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('team_id')
      .eq('id', session.playerId)
      .single();

    if (playerError) {
      console.error('🔧 Migration error: Failed to fetch player team:', playerError);
      return null;
    }

    if (playerData?.team_id && isValidUUID(playerData.team_id)) {
      console.log('🔧 Migration success: Found valid team UUID:', playerData.team_id);
      
      return {
        ...session,
        teamId: playerData.team_id,
        timestamp: Date.now() // Update timestamp to indicate migration
      };
    } else {
      console.error('🔧 Migration failed: Player has no valid team assigned');
      return null;
    }
  } catch (error) {
    console.error('🔧 Migration exception:', error);
    return null;
  }
}

/**
 * Validates and migrates a player session
 */
export async function validateAndMigrateSession(): Promise<PlayerSession | null> {
  try {
    const sessionData = localStorage.getItem('player-session');
    if (!sessionData) {
      console.log('🔧 No session found');
      return null;
    }

    const session: PlayerSession = JSON.parse(sessionData);
    console.log('🔧 Validating session:', session);

    // Check if session has required fields
    if (!session.playerId || !session.gameId) {
      console.error('🔧 Invalid session: Missing required fields');
      localStorage.removeItem('player-session');
      return null;
    }

    // Check if teamId exists and is valid UUID
    if (session.teamId) {
      if (isValidUUID(session.teamId)) {
        console.log('🔧 Session valid: Team ID is proper UUID');
        return session;
      } else {
        console.warn('🔧 Session migration needed: Invalid team ID format');
        
        // Attempt migration
        const migratedSession = await migrateInvalidTeamId(session);
        if (migratedSession) {
          // Save migrated session
          localStorage.setItem('player-session', JSON.stringify(migratedSession));
          console.log('🔧 Session migrated successfully');
          return migratedSession;
        } else {
          console.error('🔧 Session migration failed');
          localStorage.removeItem('player-session');
          return null;
        }
      }
    } else {
      console.log('🔧 Session valid but incomplete: No team ID yet');
      return session;
    }
  } catch (error) {
    console.error('🔧 Session validation error:', error);
    localStorage.removeItem('player-session');
    return null;
  }
}

/**
 * Forces session refresh by clearing localStorage
 * Use this as a last resort for testing
 */
export function clearCorruptedSession(): void {
  console.warn('🔧 Clearing corrupted session');
  localStorage.removeItem('player-session');
}

/**
 * Updates session with new team information
 */
export function updateSessionTeam(teamId: string, isChickenTeam: boolean = false): boolean {
  try {
    const sessionData = localStorage.getItem('player-session');
    if (!sessionData) return false;

    const session: PlayerSession = JSON.parse(sessionData);
    const updatedSession = {
      ...session,
      teamId,
      isChickenTeam,
      timestamp: Date.now()
    };

    localStorage.setItem('player-session', JSON.stringify(updatedSession));
    console.log('🔧 Session team updated:', { teamId, isChickenTeam });
    return true;
  } catch (error) {
    console.error('🔧 Session team update failed:', error);
    return false;
  }
}

export default { validateAndMigrateSession, clearCorruptedSession, updateSessionTeam };