/**
 * Services Index
 * Central export point for all database services
 */

// Base service
export { DatabaseService } from './base/DatabaseService';
export type { QueryOptions, FilterOptions } from './base/DatabaseService';

// Core services
export { GameService, gameService } from './GameService';
export { TeamService, teamService } from './TeamService';
export { PlayerService, playerService } from './PlayerService';
export { ChallengeService, ChallengeSubmissionService, challengeService, challengeSubmissionService } from './ChallengeService';
export { GameEventService, gameEventService } from './GameEventService';
export { GameBarService, gameBarService } from './gameBarService';
export { MessageService, messageService } from './MessageService';

// Legacy exports for backward compatibility
export { GameBarService as GameBarServiceClass } from './gameBarService';

// Types
export type * from '../data/database-types';

// Import service instances and classes
import { GameService, gameService } from './GameService';
import { TeamService, teamService } from './TeamService';
import { PlayerService, playerService } from './PlayerService';
import { ChallengeService, ChallengeSubmissionService, challengeService, challengeSubmissionService } from './ChallengeService';
import { GameEventService, gameEventService } from './GameEventService';
import { GameBarService, gameBarService } from './gameBarService';
import { MessageService, messageService } from './MessageService';

// Service instances for easy access
export const services = {
  game: gameService,
  team: teamService,
  player: playerService,
  challenge: challengeService,
  challengeSubmission: challengeSubmissionService,
  gameEvent: gameEventService,
  gameBar: gameBarService,
  message: messageService
} as const;

/**
 * Service Factory
 * Creates new instances of services when needed
 */
export class ServiceFactory {
  static createGameService() {
    return new GameService();
  }

  static createTeamService() {
    return new TeamService();
  }

  static createPlayerService() {
    return new PlayerService();
  }

  static createChallengeService() {
    return new ChallengeService();
  }

  static createChallengeSubmissionService() {
    return new ChallengeSubmissionService();
  }

  static createGameEventService() {
    return new GameEventService();
  }

  static createGameBarService() {
    return new GameBarService();
  }
}

/**
 * Service Health Check
 * Utility to check if all services are working correctly
 */
export class ServiceHealthCheck {
  static async checkAllServices(): Promise<{
    healthy: boolean;
    services: Record<string, { healthy: boolean; error?: string }>;
  }> {
    const results: Record<string, { healthy: boolean; error?: string }> = {};

    // Test each service with a simple count operation
    const serviceTests = [
      { name: 'game', service: services.game, test: () => services.game.count() },
      { name: 'team', service: services.team, test: () => services.team.count() },
      { name: 'player', service: services.player, test: () => services.player.count() },
      { name: 'challenge', service: services.challenge, test: () => services.challenge.count() },
      { name: 'challengeSubmission', service: services.challengeSubmission, test: () => services.challengeSubmission.count() },
      { name: 'gameEvent', service: services.gameEvent, test: () => services.gameEvent.count() },
      { name: 'gameBar', service: services.gameBar, test: () => services.gameBar.count() }
    ];

    for (const { name, test } of serviceTests) {
      try {
        const result = await test();
        results[name] = { 
          healthy: result.success,
          error: result.error || undefined
        };
      } catch (error) {
        results[name] = { 
          healthy: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    const allHealthy = Object.values(results).every(r => r.healthy);

    return {
      healthy: allHealthy,
      services: results
    };
  }

  static async checkService(serviceName: keyof typeof services): Promise<{
    healthy: boolean;
    error?: string;
  }> {
    try {
      const service = services[serviceName];
      const result = await service.count();
      return {
        healthy: result.success,
        error: result.error || undefined
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}