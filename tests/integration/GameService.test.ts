/**
 * GameService Integration Tests
 * 
 * Tests the GameService with real Supabase database operations
 * Following SOLID principles, KISS design, and MVP testing approach
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { gameService } from '../../src/services/GameService';
import { supabase } from '../../src/lib/supabase';
import type { GameStatus } from '../../src/data/database-types';

// Test utilities following DRY principle
class GameTestHelper {
  private createdGameIds: string[] = [];
  private createdPlayerIds: string[] = [];

  async createTestGame(hostNickname: string = `TestHost_${Date.now()}`) {
    const result = await gameService.createGameWithHost({
      cagnotte_initial: 1000,
      max_teams: 8,
      game_duration: 120
    }, hostNickname);

    if (result.success && result.data) {
      this.createdGameIds.push(result.data.game.id);
      this.createdPlayerIds.push(result.data.player.id);
    }
    
    return result;
  }

  async cleanup() {
    // Clean up in reverse order to handle dependencies (SOLID: Dependency management)
    for (const playerId of this.createdPlayerIds) {
      await supabase.from('players').delete().eq('id', playerId);
    }
    
    for (const gameId of this.createdGameIds) {
      await supabase.from('game_events').delete().eq('game_id', gameId);
      await supabase.from('games').delete().eq('id', gameId);
    }
    
    this.createdGameIds = [];
    this.createdPlayerIds = [];
  }
}

describe('GameService Integration Tests', () => {
  let testHelper: GameTestHelper;

  beforeEach(() => {
    testHelper = new GameTestHelper();
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('Game Creation (MVP Core Feature)', () => {
    it('should create a game with host player successfully', async () => {
      // KISS: Simple, focused test for core functionality
      const result = await testHelper.createTestGame('TestHost');
      
      if (!result.success) {
        console.log('createTestGame error:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.game.id).toBeDefined();
      expect(result.data!.player.id).toBeDefined();
      expect(result.data!.joinCode).toBeDefined();
      expect(result.data!.joinCode).toMatch(/^[A-Z0-9]{6,}$/);
    });

    it('should set proper initial game state', async () => {
      const result = await testHelper.createTestGame('TestHost');
      
      expect(result.success).toBe(true);
      const game = result.data!.game;
      
      expect(game.status).toBe('lobby');
      expect(game.cagnotte_initial).toBe(1000);
      expect(game.cagnotte_current).toBe(1000);
      expect(game.max_teams).toBe(8);
      expect(game.game_duration).toBe(120);
    });
  });

  describe('Game Status Management (Critical Feature)', () => {
    it('should update game status through service layer', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const gameId = gameResult.data!.game.id;
      
      // Test status transition: lobby -> in_progress
      const statusResult = await gameService.updateStatus(gameId, 'in_progress');
      
      expect(statusResult.success).toBe(true);
      
      // Verify the status was updated in database
      const updatedGame = await gameService.findById(gameId);
      expect(updatedGame.success).toBe(true);
      expect(updatedGame.data!.status).toBe('in_progress');
    });

    it('should handle chicken hiding workflow', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const gameId = gameResult.data!.game.id;
      
      // First transition to in_progress, then hide chicken
      await gameService.updateStatus(gameId, 'in_progress');
      const hideResult = await gameService.hideChicken(gameId);
      
      expect(hideResult.success).toBe(true);
      
      // Verify chicken_hidden status and timestamp
      const updatedGame = await gameService.findById(gameId);
      expect(updatedGame.success).toBe(true);
      expect(updatedGame.data!.status).toBe('chicken_hidden');
      expect(updatedGame.data!.chicken_hidden_at).toBeDefined();
    });
  });

  describe('Game Query Operations', () => {
    it('should find game by join code', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const joinCode = gameResult.data!.joinCode;
      
      // Test finding by join code
      const foundGame = await gameService.findByJoinCode(joinCode);
      
      expect(foundGame.success).toBe(true);
      expect(foundGame.data!.id).toBe(gameResult.data!.game.id);
      expect(foundGame.data!.join_code).toBe(joinCode);
    });

    it('should retrieve game with relations', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const gameId = gameResult.data!.game.id;
      
      // Test findByIdWithRelations (the fixed method)
      const gameWithRelations = await gameService.findByIdWithRelations(gameId);
      
      expect(gameWithRelations.success).toBe(true);
      expect(gameWithRelations.data!.id).toBe(gameId);
      expect(gameWithRelations.data!.all_teams).toBeDefined();
      expect(gameWithRelations.data!.all_players).toBeDefined();
      expect(Array.isArray(gameWithRelations.data!.all_teams)).toBe(true);
      expect(Array.isArray(gameWithRelations.data!.all_players)).toBe(true);
    });
  });

  describe('Cagnotte Management', () => {
    it('should update cagnotte amount', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const gameId = gameResult.data!.game.id;
      const newAmount = 1500;
      
      // Update cagnotte
      const updateResult = await gameService.updateCagnotte(gameId, newAmount, 'Test update');
      
      expect(updateResult.success).toBe(true);
      
      // Verify the update
      const updatedGame = await gameService.findById(gameId);
      expect(updatedGame.success).toBe(true);
      expect(updatedGame.data!.cagnotte_current).toBe(newAmount);
    });
  });

  describe('Error Handling (SOLID: Resilience)', () => {
    it('should handle non-existent game gracefully', async () => {
      const fakeGameId = '00000000-0000-0000-0000-000000000000';
      
      const result = await gameService.findById(fakeGameId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid join code gracefully', async () => {
      const result = await gameService.findByJoinCode('INVALID');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Game Statistics', () => {
    it('should calculate basic game statistics', async () => {
      const gameResult = await testHelper.createTestGame('TestHost');
      expect(gameResult.success).toBe(true);
      
      const gameId = gameResult.data!.game.id;
      
      const statsResult = await gameService.getGameStats(gameId);
      
      expect(statsResult.success).toBe(true);
      expect(statsResult.data!.totalPlayers).toBeGreaterThan(0);
      expect(statsResult.data!.gameStatus).toBe('lobby');
      expect(statsResult.data!.duration).toBe(120);
    });
  });
});