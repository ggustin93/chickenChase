/**
 * Game Mechanics Integration Tests
 * 
 * Tests critical game mechanics end-to-end with real database
 * Following MVP approach: Focus on user-critical game flows
 * SOLID: Single responsibility tests for each mechanic
 * KISS: Simple, focused test scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { gameService } from '../../services/GameService';
import { challengeService } from '../../services/ChallengeService';
import { GameEventService } from '../../services/GameEventService';
import type { GameStatus } from '../../data/database-types';

// Game mechanics test helper following DRY principle
class GameMechanicsTestHelper {
  private gameIds: string[] = [];
  private playerIds: string[] = [];
  private teamIds: string[] = [];
  private challengeIds: string[] = [];

  async createCompleteGameSetup() {
    // Create game with host
    const gameResult = await gameService.createGameWithHost({
      cagnotte_initial: 1000,
      cagnotte_current: 1000,
      join_code: `MECH${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      max_teams: 8,
      game_duration: 120
    }, `MechHost_${Date.now()}`);

    if (!gameResult.success) {
      throw new Error('Failed to create test game');
    }

    const gameId = gameResult.data!.game.id;
    const hostPlayerId = gameResult.data!.player.id;

    this.gameIds.push(gameId);
    this.playerIds.push(hostPlayerId);

    // Create chicken team
    const chickenTeamResult = await supabase
      .from('teams')
      .insert({
        game_id: gameId,
        name: 'Chicken Team',
        is_chicken_team: true,
        score: 0,
      })
      .select()
      .single();

    if (chickenTeamResult.error) {
      throw new Error('Failed to create chicken team');
    }

    const chickenTeamId = chickenTeamResult.data.id;
    this.teamIds.push(chickenTeamId);

    // Create hunter team
    const hunterTeamResult = await supabase
      .from('teams')
      .insert({
        game_id: gameId,
        name: 'Hunter Team A',
        is_chicken_team: false,
        score: 0,
      })
      .select()
      .single();

    if (hunterTeamResult.error) {
      throw new Error('Failed to create hunter team');
    }

    const hunterTeamId = hunterTeamResult.data.id;
    this.teamIds.push(hunterTeamId);

    // Set chicken team in game
    await gameService.setChickenTeam(gameId, chickenTeamId);

    // Create test challenge
    const challengeResult = await supabase
      .from('challenges')
      .insert({
        title: 'Test Photo Challenge',
        description: 'Take a photo at the location',
        points: 100,
        type: 'photo',
      })
      .select()
      .single();

    if (challengeResult.error) {
      throw new Error('Failed to create test challenge');
    }

    this.challengeIds.push(challengeResult.data.id);

    return {
      gameId,
      hostPlayerId,
      chickenTeamId,
      hunterTeamId,
      challengeId: challengeResult.data.id,
    };
  }

  async cleanup() {
    // Clean up in proper order to handle foreign key constraints
    for (const challengeId of this.challengeIds) {
      await supabase.from('challenge_submissions').delete().eq('challenge_id', challengeId);
      await supabase.from('challenges').delete().eq('id', challengeId);
    }

    for (const gameId of this.gameIds) {
      await supabase.from('game_events').delete().eq('game_id', gameId);
      await supabase.from('messages').delete().eq('game_id', gameId);
      await supabase.from('game_bars').delete().eq('game_id', gameId);
    }

    for (const playerId of this.playerIds) {
      await supabase.from('players').delete().eq('id', playerId);
    }

    for (const teamId of this.teamIds) {
      await supabase.from('teams').delete().eq('id', teamId);
    }

    for (const gameId of this.gameIds) {
      await supabase.from('games').delete().eq('id', gameId);
    }

    // Clear tracking arrays
    this.gameIds = [];
    this.playerIds = [];
    this.teamIds = [];
    this.challengeIds = [];
  }
}

describe('Game Mechanics Integration Tests', () => {
  let testHelper: GameMechanicsTestHelper;

  beforeEach(() => {
    testHelper = new GameMechanicsTestHelper();
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('Complete Game Flow (MVP Critical Path)', () => {
    it('should execute complete game lifecycle', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId, chickenTeamId, hunterTeamId } = setup;

      // 1. Start game (lobby -> in_progress)
      const startResult = await gameService.startGame(gameId);
      expect(startResult.success).toBe(true);

      // Verify game status
      let gameCheck = await gameService.findById(gameId);
      expect(gameCheck.success).toBe(true);
      expect(gameCheck.data!.status).toBe('in_progress');

      // 2. Hide chicken (in_progress -> chicken_hidden)
      const hideResult = await gameService.hideChicken(gameId);
      expect(hideResult.success).toBe(true);

      // Verify chicken hidden
      gameCheck = await gameService.findById(gameId);
      expect(gameCheck.success).toBe(true);
      expect(gameCheck.data!.status).toBe('chicken_hidden');
      expect(gameCheck.data!.chicken_hidden_at).toBeDefined();

      // 3. Finish game
      const finishResult = await gameService.finishGame(gameId, 'test-user', {
        duration: '01:30:00',
        winner: hunterTeamId
      });
      expect(finishResult.success).toBe(true);

      // Verify game finished
      gameCheck = await gameService.findById(gameId);
      expect(gameCheck.success).toBe(true);
      expect(gameCheck.data!.status).toBe('finished');
    });

    it('should enforce chicken team requirement before starting', async () => {
      // Create game without setting chicken team
      const gameResult = await gameService.createGameWithHost({
        cagnotte_initial: 1000,
        cagnotte_current: 1000,
        join_code: `NOCHICK${Math.random().toString(36).substr(2, 4)}`,
        max_teams: 8,
        game_duration: 120
      }, 'TestHost');

      expect(gameResult.success).toBe(true);
      const gameId = gameResult.data!.game.id;
      testHelper['gameIds'].push(gameId);

      // Try to start game without chicken team - should fail via RPC function
      const startResult = await gameService.startGame(gameId);
      
      // The RPC function should prevent starting without chicken team
      // This tests the business logic constraint
      expect(startResult.success).toBe(false);
    });
  });

  describe('Challenge Submission and Validation', () => {
    it('should handle complete challenge submission workflow', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId, hunterTeamId, challengeId } = setup;

      // Start and hide chicken first
      await gameService.startGame(gameId);
      await gameService.hideChicken(gameId);

      // Submit challenge
      const submissionResult = await supabase
        .from('challenge_submissions')
        .insert({
          game_id: gameId,
          team_id: hunterTeamId,
          challenge_id: challengeId,
          status: 'pending',
          proof_url: 'https://example.com/photo.jpg',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(submissionResult.error).toBeNull();
      expect(submissionResult.data.status).toBe('pending');

      // Validate challenge (approve)
      const validationResult = await supabase
        .from('challenge_submissions')
        .update({ status: 'approved' })
        .eq('id', submissionResult.data.id);

      expect(validationResult.error).toBeNull();

      // Verify submission status
      const updatedSubmission = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('id', submissionResult.data.id)
        .single();

      expect(updatedSubmission.error).toBeNull();
      expect(updatedSubmission.data.status).toBe('approved');
    });

    it('should handle challenge rejection workflow', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId, hunterTeamId, challengeId } = setup;

      // Submit challenge
      const submissionResult = await supabase
        .from('challenge_submissions')
        .insert({
          game_id: gameId,
          team_id: hunterTeamId,
          challenge_id: challengeId,
          status: 'pending',
          proof_url: 'https://example.com/bad-photo.jpg',
        })
        .select()
        .single();

      expect(submissionResult.error).toBeNull();

      // Reject challenge
      const rejectionResult = await supabase
        .from('challenge_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionResult.data.id);

      expect(rejectionResult.error).toBeNull();

      // Verify rejection
      const rejectedSubmission = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('id', submissionResult.data.id)
        .single();

      expect(rejectedSubmission.error).toBeNull();
      expect(rejectedSubmission.data.status).toBe('rejected');
    });
  });

  describe('Game Event System', () => {
    it('should create events for major game actions', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId } = setup;
      const gameEventService = new GameEventService();

      // Create custom event
      const eventResult = await gameEventService.createEvent(
        gameId,
        'chicken_hidden',
        {
          hiddenAt: new Date().toISOString(),
          gameTimeHours: 3,
          timestamp: new Date().toISOString()
        }
      );

      expect(eventResult.success).toBe(true);

      // Verify event was created
      const eventsCheck = await supabase
        .from('game_events')
        .select('*')
        .eq('game_id', gameId)
        .eq('event_type', 'chicken_hidden');

      expect(eventsCheck.error).toBeNull();
      expect(eventsCheck.data!.length).toBeGreaterThan(0);
      expect(eventsCheck.data![0].event_data.gameTimeHours).toBe(3);
    });
  });

  describe('Cagnotte Management', () => {
    it('should update cagnotte and create audit events', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId } = setup;

      const initialAmount = 1000;
      const newAmount = 1500;

      // Update cagnotte
      const updateResult = await gameService.updateCagnotte(
        gameId, 
        newAmount, 
        'Test cagnotte increase'
      );

      expect(updateResult.success).toBe(true);

      // Verify cagnotte was updated
      const gameCheck = await gameService.findById(gameId);
      expect(gameCheck.success).toBe(true);
      expect(gameCheck.data!.cagnotte_current).toBe(newAmount);

      // Verify event was created for cagnotte update
      const eventsCheck = await supabase
        .from('game_events')
        .select('*')
        .eq('game_id', gameId)
        .eq('event_type', 'cagnotte_updated');

      expect(eventsCheck.error).toBeNull();
      expect(eventsCheck.data!.length).toBeGreaterThan(0);
      expect(eventsCheck.data![0].event_data.new_amount).toBe(newAmount);
    });
  });

  describe('Game State Validation', () => {
    it('should validate proper game status transitions', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId } = setup;

      // Valid transition: lobby -> in_progress
      const startResult = await gameService.updateStatus(gameId, 'in_progress');
      expect(startResult.success).toBe(true);

      // Valid transition: in_progress -> chicken_hidden
      const hideResult = await gameService.updateStatus(gameId, 'chicken_hidden');
      expect(hideResult.success).toBe(true);

      // Valid transition: chicken_hidden -> finished
      const finishResult = await gameService.updateStatus(gameId, 'finished');
      expect(finishResult.success).toBe(true);

      // Verify final state
      const finalCheck = await gameService.findById(gameId);
      expect(finalCheck.success).toBe(true);
      expect(finalCheck.data!.status).toBe('finished');
    });
  });

  describe('Team Score Management', () => {
    it('should update team scores properly', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { hunterTeamId } = setup;

      const initialScore = 0;
      const pointsToAdd = 150;

      // Update team score
      const updateResult = await supabase
        .from('teams')
        .update({ score: initialScore + pointsToAdd })
        .eq('id', hunterTeamId);

      expect(updateResult.error).toBeNull();

      // Verify score update
      const teamCheck = await supabase
        .from('teams')
        .select('score')
        .eq('id', hunterTeamId)
        .single();

      expect(teamCheck.error).toBeNull();
      expect(teamCheck.data!.score).toBe(pointsToAdd);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const setup = await testHelper.createCompleteGameSetup();
      const { gameId, chickenTeamId } = setup;

      // Verify game references chicken team correctly
      const gameWithRelations = await gameService.findByIdWithRelations(gameId);
      expect(gameWithRelations.success).toBe(true);
      expect(gameWithRelations.data!.chicken_team_id).toBe(chickenTeamId);
      expect(gameWithRelations.data!.all_teams).toBeDefined();
      expect(gameWithRelations.data!.all_teams!.length).toBeGreaterThanOrEqual(2);
    });

    it('should enforce foreign key constraints', async () => {
      // Try to create a team with non-existent game ID
      const invalidTeamResult = await supabase
        .from('teams')
        .insert({
          game_id: '00000000-0000-0000-0000-000000000000',
          name: 'Invalid Team',
          is_chicken_team: false,
          score: 0,
        });

      // Should fail due to foreign key constraint
      expect(invalidTeamResult.error).toBeDefined();
      expect(invalidTeamResult.error!.code).toBe('23503'); // Foreign key violation
    });
  });
});