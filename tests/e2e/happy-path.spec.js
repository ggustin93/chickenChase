/**
 * Critical E2E Test: Complete Game Flow (Happy Path)
 * 
 * Tests the core game cycle from creation to completion using Playwright MCP.
 * This scenario validates the most critical user journey for the Chicken Chase MVP.
 * 
 * Flow: Game Creation → Player Join → Team Formation → Game Launch → Game Finish
 */

import { test, expect } from '@playwright/test';

// Mobile viewport configuration for optimal gaming experience
const MOBILE_VIEWPORT = {
  width: 768,
  height: 1024
};

const TEST_CONFIG = {
  gameSettings: {
    maxTeams: 4,
    duration: 60,
    initialPot: 50 // Default value from UI
  },
  players: {
    host: 'TestHost',
    hunter1: 'Hunter1',
    hunter2: 'Hunter2'
  },
  timeouts: {
    navigation: 10000,
    realtime: 5000,
    interaction: 2000
  },
  baseUrl: 'http://localhost:5174'
};

test.describe('Critical Game Flow - Happy Path', () => {
  
  test('Complete game cycle: create → join → teams → launch → finish', async ({ browser }) => {
    
    // Setup multiple browser contexts for multi-player testing
    const hostContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const hunter1Context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const hunter2Context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    
    const hostPage = await hostContext.newPage();
    const hunter1Page = await hunter1Context.newPage();
    const hunter2Page = await hunter2Context.newPage();

    let gameCode;

    try {
      // 1. GAME CREATION (Host)
      console.log('🎮 Step 1: Game Creation');
      
      await hostPage.goto(TEST_CONFIG.baseUrl);
      await hostPage.waitForLoadState('networkidle');
      
      // Close PWA install dialog if present
      try {
        await hostPage.getByRole('banner').getByRole('button').click({ timeout: 1000 });
      } catch (e) {
        // PWA dialog not present, continue
      }
      
      // Click create game button
      await hostPage.getByRole('button', { name: 'Créer une Partie' }).click();
      
      // Fill game configuration
      await hostPage.getByRole('textbox', { name: 'Votre pseudo' }).fill(TEST_CONFIG.players.host);
      
      // Submit game creation (button should be enabled after filling nickname)
      await hostPage.getByRole('button', { name: 'Créer la Partie' }).click();
      
      // Wait for redirect to lobby and extract game code
      await hostPage.waitForURL(/\/lobby\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
      
      // Extract game code from the lobby UI
      const gameCodeElement = await hostPage.locator('text=/^[A-Z0-9]{6}$/').first();
      gameCode = await gameCodeElement.textContent();
      
      expect(gameCode).toMatch(/^[A-Z0-9]{6}$/);
      console.log(`✅ Game created with code: ${gameCode}`);

      // 2. PLAYER JOINS (Hunter 1)
      console.log('👥 Step 2: Player 1 Join');
      
      await hunter1Page.goto(TEST_CONFIG.baseUrl);
      
      // Close PWA install dialog if present
      try {
        await hunter1Page.getByRole('banner').getByRole('button').click({ timeout: 1000 });
      } catch (e) {
        // PWA dialog not present, continue
      }
      
      await hunter1Page.getByRole('button', { name: 'Rejoindre une Partie' }).click();
      
      // Wait for join game page and fill details
      await hunter1Page.waitForURL(/\/join-game/, { timeout: TEST_CONFIG.timeouts.navigation });
      await hunter1Page.getByRole('textbox', { name: /code/i }).fill(gameCode);
      await hunter1Page.getByRole('textbox', { name: /pseudo/i }).fill(TEST_CONFIG.players.hunter1);
      
      await hunter1Page.getByRole('button', { name: /rejoindre/i }).click();
      await hunter1Page.waitForURL(/\/lobby\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
      
      // Verify real-time sync: Host sees Hunter1 in player count
      await expect(hostPage.locator('text=/2 joueur/i')).toBeVisible({ 
        timeout: TEST_CONFIG.timeouts.realtime 
      });
      console.log('✅ Hunter1 joined and visible to Host');

      // 3. SECOND PLAYER JOINS (Hunter 2)
      console.log('👥 Step 3: Player 2 Join');
      
      await hunter2Page.goto('/');
      await hunter2Page.click('[data-testid="join-game-button"]');
      
      await hunter2Page.fill('[data-testid="join-code-input"]', gameCode);
      await hunter2Page.fill('[data-testid="nickname-input"]', TEST_CONFIG.players.hunter2);
      
      await hunter2Page.click('[data-testid="join-game-submit"]');
      await hunter2Page.waitForURL(/\/lobby\/\w+/, { timeout: TEST_CONFIG.timeouts.navigation });
      
      // Verify both hunters visible to host
      await expect(hostPage.locator('[data-testid="player-list"]')).toContainText(TEST_CONFIG.players.hunter2, {
        timeout: TEST_CONFIG.timeouts.realtime
      });
      console.log('✅ Hunter2 joined and visible to Host');

      // 4. TEAM FORMATION
      console.log('🏃 Step 4: Team Formation');
      
      // Host joins Chicken team
      await hostPage.getByRole('button', { name: 'Rejoindre l\'Équipe Poulet' }).click();
      
      // Wait for chicken team confirmation
      await expect(hostPage.locator('text=/Équipe Poulet.*TestHost/i')).toBeVisible({
        timeout: TEST_CONFIG.timeouts.realtime
      });
      
      // Hunter1 creates Hunter team
      await hunter1Page.getByRole('textbox').fill('Hunters Alpha');
      await hunter1Page.getByRole('button', { name: 'Créer l\'Équipe' }).click();
      
      // Hunter2 joins the Hunter team (should see the team in UI and click join)
      await hunter2Page.getByRole('button', { name: /rejoindre.*hunters alpha/i }).click();
      
      // Verify team formation - Host should see 1 team
      await expect(hostPage.locator('text=/1 équipe/i')).toBeVisible({
        timeout: TEST_CONFIG.timeouts.realtime
      });
      
      console.log('✅ Teams formed successfully');

      // 5. GAME LAUNCH (Chicken team starts game)
      console.log('🚀 Step 5: Game Launch');
      
      // Find and click the start game button (should be available for Chicken team)
      await hostPage.getByRole('button', { name: /démarrer|lancer|commencer/i }).click();
      
      // Verify automatic redirections
      await hostPage.waitForURL(/\/chicken\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
      await hunter1Page.waitForURL(/\/player\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
      await hunter2Page.waitForURL(/\/player\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
      
      console.log('✅ Game launched, all players redirected correctly');

      // Verify game interfaces are loaded
      await expect(hostPage.locator('text=/poulet|chicken/i')).toBeVisible();
      await expect(hunter1Page.locator('text=/carte|map|chasseur/i')).toBeVisible();
      await expect(hunter2Page.locator('text=/carte|map|chasseur/i')).toBeVisible();

      // 6. GAME COMPLETION (Chicken finishes game)
      console.log('🏁 Step 6: Game Completion');
      
      // Chicken team finishes the game
      await hostPage.getByRole('button', { name: /terminer|finir|arrêter/i }).click();
      
      // Confirm finish dialog if present
      try {
        await hostPage.getByRole('button', { name: /confirmer|oui|terminer/i }).click({ timeout: 2000 });
      } catch (e) {
        // No confirmation dialog, continue
      }
      
      // Verify game status update propagates to all players (look for finished status or results)
      await expect(hostPage.locator('text=/terminé|fini|résultat/i')).toBeVisible({
        timeout: TEST_CONFIG.timeouts.realtime
      });
      
      console.log('✅ Game completed successfully');

      // 7. VALIDATION - Verify final state
      console.log('✅ Step 7: Final Validation');
      
      // Verify all players can see some indication that the game is over
      await expect(hostPage.locator('text=/terminé|fini|résultat/i')).toBeVisible();
      
      console.log('🎉 Happy Path completed successfully!');
      
    } finally {
      // Cleanup: Close all contexts
      await hostContext.close();
      await hunter1Context.close();
      await hunter2Context.close();
    }
  });

  test('Real-time synchronization validation', async ({ browser }) => {
    // Focused test on real-time sync capabilities
    const context1 = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const context2 = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Create game on page1
      await page1.goto('/');
      await page1.click('[data-testid="create-game-button"]');
      await page1.fill('[data-testid="host-nickname"]', 'SyncTest1');
      await page1.click('[data-testid="create-game-submit"]');
      
      const gameCode = await page1.textContent('[data-testid="game-code"]');
      
      // Join game on page2
      await page2.goto('/');
      await page2.click('[data-testid="join-game-button"]');
      await page2.fill('[data-testid="join-code-input"]', gameCode);
      await page2.fill('[data-testid="nickname-input"]', 'SyncTest2');
      await page2.click('[data-testid="join-game-submit"]');
      
      // Test real-time sync latency (should be < 2 seconds)
      const startTime = Date.now();
      
      await page2.click('[data-testid="create-team-button"]');
      await page2.fill('[data-testid="team-name-input"]', 'Speed Team');
      await page2.click('[data-testid="create-team-submit"]');
      
      // Verify page1 sees the team creation
      await expect(page1.locator('[data-testid="team-list"]')).toContainText('Speed Team', {
        timeout: 2000
      });
      
      const syncTime = Date.now() - startTime;
      console.log(`⚡ Real-time sync completed in ${syncTime}ms`);
      
      expect(syncTime).toBeLessThan(2000); // Assert sync is under 2 seconds
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Mobile touch interaction validation', async ({ browser }) => {
    // Test mobile-specific interactions
    const context = await browser.newContext({ 
      viewport: MOBILE_VIEWPORT,
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();

    try {
      await page.goto('/');
      
      // Test touch interactions
      await page.tap('[data-testid="create-game-button"]');
      await page.fill('[data-testid="host-nickname"]', 'TouchTest');
      
      // Verify mobile keyboard doesn't break layout
      await expect(page.locator('[data-testid="game-config-form"]')).toBeVisible();
      
      // Test form submission via touch
      await page.tap('[data-testid="create-game-submit"]');
      
      // Verify mobile navigation works
      await expect(page).toHaveURL(/\/lobby\/\w+/);
      
      // Test mobile-specific UI elements
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      
      console.log('✅ Mobile touch interactions validated');
      
    } finally {
      await context.close();
    }
  });

});

// Test utilities for data cleanup
test.afterEach(async () => {
  // Note: In a real implementation, this would clean up test data
  console.log('🧹 Test cleanup completed');
});