/**
 * Database Initialization Utilities
 * Functions to initialize database with default data
 */

import { challengeService } from '../services';

/**
 * Initialize challenges in the database
 * This should be called once when setting up a new game instance
 */
export async function initializeChallenges(): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // Check if challenges already exist
    const existingChallenges = await challengeService.count();
    
    if (!existingChallenges.success) {
      return {
        success: false,
        message: `Failed to check existing challenges: ${existingChallenges.error}`
      };
    }

    if (existingChallenges.data! > 0) {
      return {
        success: true,
        message: `Challenges already initialized (${existingChallenges.data} existing challenges)`,
        count: existingChallenges.data!
      };
    }

    // Create default challenges
    const result = await challengeService.createDefaultChallenges();
    
    if (!result.success) {
      return {
        success: false,
        message: `Failed to create default challenges: ${result.error}`
      };
    }

    return {
      success: true,
      message: `Successfully initialized ${result.data!.length} challenges`,
      count: result.data!.length
    };

  } catch (error) {
    return {
      success: false,
      message: `Error during challenge initialization: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Initialize all database defaults
 * This is the main function to call for complete database setup
 */
export async function initializeDatabase(): Promise<{ success: boolean; messages: string[] }> {
  const messages: string[] = [];
  let allSuccessful = true;

  // Initialize challenges
  const challengeResult = await initializeChallenges();
  messages.push(`Challenges: ${challengeResult.message}`);
  if (!challengeResult.success) {
    allSuccessful = false;
  }

  // Future: Add other initialization functions here
  // const barsResult = await initializeBars();
  // const gamesResult = await initializeGameDefaults();

  return {
    success: allSuccessful,
    messages
  };
}

/**
 * Check database health and initialization status
 */
export async function checkDatabaseStatus(): Promise<{
  challenges: { count: number; initialized: boolean };
  // Future: Add other status checks
}> {
  const challengeCount = await challengeService.count();
  
  return {
    challenges: {
      count: challengeCount.success ? challengeCount.data! : 0,
      initialized: challengeCount.success && challengeCount.data! > 0
    }
  };
}