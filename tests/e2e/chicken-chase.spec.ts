import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * E2E Tests for ChickenChase Game
 * 
 * Tests converted from Cypress scenarios to Playwright
 * Mobile-optimized viewport for realistic game testing
 */

// Mobile viewport configuration
const MOBILE_VIEWPORT = { width: 768, height: 1024 };

test.describe('ChickenChase E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('Happy Path - Complete Game Flow', async ({ browser }) => {
    // Create contexts for multiple players
    const hostContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const hunterContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    
    const hostPage = await hostContext.newPage();
    const hunterPage = await hunterContext.newPage();

    try {
      // 1. Host creates game
      await hostPage.goto('/');
      await hostPage.click('[data-testid="create-game"]');
      
      // Wait for game code to be generated
      await hostPage.waitForSelector('[data-testid="game-code"]');
      const gameCode = await hostPage.textContent('[data-testid="game-code"]');
      expect(gameCode).toBeTruthy();
      expect(gameCode?.length).toBe(6);

      // 2. Hunter joins game
      await hunterPage.goto('/');
      await hunterPage.click('[data-testid="join-game"]');
      await hunterPage.fill('[data-testid="join-code-input"]', gameCode!);
      await hunterPage.fill('[data-testid="nickname-input"]', 'Hunter1');
      await hunterPage.click('[data-testid="join-submit"]');

      // 3. Team formation
      // Host joins chicken team
      await hostPage.click('[data-testid="join-chicken-team"]');
      
      // Hunter creates hunter team
      await hunterPage.click('[data-testid="create-team"]');
      await hunterPage.fill('[data-testid="team-name-input"]', 'Hunters');
      await hunterPage.click('[data-testid="create-team-submit"]');

      // 4. Game launch (only chicken can start when ≥1 hunter team)
      await expect(hostPage.locator('[data-testid="start-game"]')).toBeEnabled();
      await hostPage.click('[data-testid="start-game"]');

      // 5. Verify redirections
      await expect(hostPage).toHaveURL(/\/chicken\/\w+/);
      await expect(hunterPage).toHaveURL(/\/player\/\w+/);

      // 6. Verify real-time sync in lobby
      await expect(hunterPage.locator('[data-testid="player-list"]')).toContainText('Hunter1');
      
    } finally {
      await hostContext.close();
      await hunterContext.close();
    }
  });

  test('Hunter Challenge Submission', async ({ browser }) => {
    // Setup: Create game context (abbreviated setup)
    const { hunterPage, gameId } = await setupGameContext(browser);

    try {
      // Navigate to hunter game page
      await hunterPage.goto(`/player/${gameId}`);
      await hunterPage.click('[data-testid="challenges-tab"]');

      // 1. Select available challenge
      await hunterPage.click('[data-testid="challenge-item-0"]');
      await hunterPage.click('[data-testid="submit-challenge"]');

      // 2. Upload photo via camera modal
      await hunterPage.click('[data-testid="camera-modal-trigger"]');
      
      // Simulate file upload (mock image)
      const fileInput = hunterPage.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'proof-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      });

      // 3. Complete submission
      await hunterPage.fill('[data-testid="challenge-description"]', 'Challenge completé!');
      await hunterPage.click('[data-testid="submit-proof"]');

      // 4. Verify status change
      await expect(hunterPage.locator('[data-testid="challenge-status"]')).toContainText('En attente');
      
      // 5. Verify UI feedback
      await expect(hunterPage.locator('[data-testid="success-message"]')).toBeVisible();
      
    } finally {
      await hunterPage.close();
    }
  });

  test('Chicken Challenge Validation', async ({ browser }) => {
    const { chickenPage, hunterPage, gameId } = await setupGameWithChallenge(browser);

    try {
      // Navigate to chicken validation interface
      await chickenPage.goto(`/chicken/${gameId}`);

      // 1. Verify pending challenge notification
      await expect(chickenPage.locator('[data-testid="pending-challenges"]')).toBeVisible();
      await chickenPage.click('[data-testid="review-challenges"]');

      // 2. Review submission
      await chickenPage.click('[data-testid="challenge-submission-0"]');
      await expect(chickenPage.locator('[data-testid="proof-image"]')).toBeVisible();
      await expect(chickenPage.locator('[data-testid="submission-description"]')).toContainText('Challenge completé!');

      // 3. Approve challenge
      await chickenPage.click('[data-testid="approve-challenge"]');

      // 4. Verify score update
      await expect(chickenPage.locator('[data-testid="team-score"]')).toContainText('+50');
      
      // 5. Verify hunter receives notification
      await expect(hunterPage.locator('[data-testid="challenge-approved"]')).toBeVisible({ timeout: 5000 });
      
    } finally {
      await chickenPage.close();
      await hunterPage.close();
    }
  });

  test('Chicken Cagnotte Management', async ({ browser }) => {
    const { chickenPage, hunterPage, gameId } = await setupGameContext(browser);

    try {
      // Navigate to chicken cagnotte interface
      await chickenPage.goto(`/chicken/${gameId}`);
      await chickenPage.click('[data-testid="cagnotte-tab"]');

      // 1. Verify initial amount
      const initialAmount = await chickenPage.textContent('[data-testid="cagnotte-amount"]');
      expect(parseFloat(initialAmount!)).toBeGreaterThan(0);

      // 2. Perform debit operation
      await chickenPage.click('[data-testid="cagnotte-debit"]');
      await chickenPage.click('[data-testid="preset-amount-20"]'); // 20€
      await chickenPage.fill('[data-testid="description-input"]', 'Tournée bar central');
      await chickenPage.click('[data-testid="confirm-transaction"]');

      // 3. Verify amount update
      const newAmount = await chickenPage.textContent('[data-testid="cagnotte-amount"]');
      expect(parseFloat(newAmount!)).toBe(parseFloat(initialAmount!) - 20);

      // 4. Verify transaction history
      await expect(chickenPage.locator('[data-testid="transaction-history"]')).toContainText('Tournée bar central');

      // 5. Verify real-time sync to hunter
      await expect(hunterPage.locator('[data-testid="cagnotte-display"]')).toContainText(newAmount!, { timeout: 3000 });
      
    } finally {
      await chickenPage.close();
      await hunterPage.close();
    }
  });

  test('Real-time Synchronization', async ({ browser }) => {
    // Setup 3 browser contexts (1 Chicken + 2 Hunters)
    const contexts = await Promise.all([
      browser.newContext({ viewport: MOBILE_VIEWPORT }), // Chicken
      browser.newContext({ viewport: MOBILE_VIEWPORT }), // Hunter 1
      browser.newContext({ viewport: MOBILE_VIEWPORT })  // Hunter 2
    ]);

    const [chickenPage, hunter1Page, hunter2Page] = await Promise.all(
      contexts.map(context => context.newPage())
    );

    try {
      const gameId = await setupMultiPlayerGame(chickenPage, hunter1Page, hunter2Page);

      // Test 1: Challenge submission → Chicken notification
      const startTime = Date.now();
      await hunter1Page.click('[data-testid="submit-challenge-quick"]');
      await expect(chickenPage.locator('[data-testid="new-challenge-notification"]')).toBeVisible();
      const syncTime1 = Date.now() - startTime;
      expect(syncTime1).toBeLessThan(2000); // < 2 seconds

      // Test 2: Challenge validation → Hunter notification + score update
      const startTime2 = Date.now();
      await chickenPage.click('[data-testid="approve-challenge-quick"]');
      await expect(hunter1Page.locator('[data-testid="challenge-approved"]')).toBeVisible();
      await expect(hunter2Page.locator('[data-testid="team-score-update"]')).toBeVisible();
      const syncTime2 = Date.now() - startTime2;
      expect(syncTime2).toBeLessThan(2000); // < 2 seconds

      // Test 3: Cagnotte modification → All players see update
      const startTime3 = Date.now();
      await chickenPage.click('[data-testid="cagnotte-debit-quick"]');
      await Promise.all([
        expect(hunter1Page.locator('[data-testid="cagnotte-update"]')).toBeVisible(),
        expect(hunter2Page.locator('[data-testid="cagnotte-update"]')).toBeVisible()
      ]);
      const syncTime3 = Date.now() - startTime3;
      expect(syncTime3).toBeLessThan(2000); // < 2 seconds

    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Performance - Page Load Times', async ({ page }) => {
    // Test critical page load performance
    const pages = ['/', '/join', '/lobby/test-game'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(pagePath);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Performance requirement: < 3 seconds on 3G simulation
      expect(loadTime).toBeLessThan(3000);
      
      // Verify no white screen crashes
      await expect(page.locator('body')).not.toHaveClass('error-state');
    }
  });
});

// Test utilities
async function setupGameContext(browser: any) {
  const hostContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  const hunterContext = await browser.newContext({ viewport: MOBILE_VIEWPORT });
  
  const hostPage = await hostContext.newPage();
  const hunterPage = await hunterContext.newPage();
  
  // Create and join game (abbreviated)
  await hostPage.goto('/');
  await hostPage.click('[data-testid="create-game"]');
  const gameCode = await hostPage.textContent('[data-testid="game-code"]');
  
  await hunterPage.goto('/join');
  await hunterPage.fill('[data-testid="join-code"]', gameCode!);
  await hunterPage.fill('[data-testid="nickname"]', 'TestHunter');
  await hunterPage.click('[data-testid="join"]');
  
  // Start game
  await hostPage.click('[data-testid="start-game"]');
  
  const gameId = gameCode; // Simplified for test
  
  return { chickenPage: hostPage, hunterPage, gameId };
}

async function setupGameWithChallenge(browser: any) {
  const context = await setupGameContext(browser);
  
  // Submit a challenge first
  await context.hunterPage.goto(`/player/${context.gameId}`);
  await context.hunterPage.click('[data-testid="submit-challenge-quick"]');
  
  return context;
}

async function setupMultiPlayerGame(chickenPage: Page, hunter1Page: Page, hunter2Page: Page) {
  // Implementation would create a 3-player game
  // Returns gameId for navigation
  return 'test-multiplayer-game-id';
}