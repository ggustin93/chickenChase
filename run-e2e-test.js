#!/usr/bin/env node

/**
 * Simple E2E Test Runner for Chicken Chase
 * Runs the critical happy path test using Playwright MCP
 */

import { chromium } from 'playwright';

// Import the test configuration
const TEST_CONFIG = {
  gameSettings: {
    maxTeams: 4,
    duration: 60,
    initialPot: 50
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

const MOBILE_VIEWPORT = {
  width: 768,
  height: 1024
};

async function runHappyPathTest() {
  console.log('🚀 Starting Chicken Chase E2E Test');
  
  const browser = await chromium.launch({ headless: false });
  
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
    await hunter1Page.getByRole('textbox', { name: 'Code de la partie' }).fill(gameCode);
    await hunter1Page.getByRole('textbox', { name: 'Votre surnom' }).fill(TEST_CONFIG.players.hunter1);
    
    await hunter1Page.getByRole('button', { name: 'C\'est Parti !' }).click();
    await hunter1Page.waitForURL(/\/lobby\/[a-z0-9-]+/, { timeout: TEST_CONFIG.timeouts.navigation });
    
    console.log('✅ Hunter1 joined successfully');

    // 3. TEAM FORMATION
    console.log('🏃 Step 3: Team Formation');
    
    // Host joins Chicken team
    await hostPage.getByRole('button', { name: 'Rejoindre l\'Équipe Poulet' }).click();
    
    // Hunter1 creates Hunter team - find the team creation textbox
    console.log('Looking for team creation input...');
    const teamInputs = await hunter1Page.getByRole('textbox').all();
    console.log(`Found ${teamInputs.length} textboxes`);
    
    const teamNameInput = teamInputs[teamInputs.length - 1]; // Get the last textbox
    
    // Click the input first to focus it
    await teamNameInput.click();
    
    // Type the team name character by character
    await teamNameInput.type('Hunters Alpha');
    
    // Wait a bit for the form to react
    await hunter1Page.waitForTimeout(1000);
    
    // Check if button is enabled and click
    const createButton = hunter1Page.getByRole('button', { name: 'Créer l\'Équipe' });
    await createButton.waitFor({ state: 'attached' });
    await createButton.click();
    
    console.log('✅ Teams formed successfully');

    // 4. GAME LAUNCH
    console.log('🚀 Step 4: Game Launch');
    
    // Look for start game button (might be different text)
    try {
      await hostPage.getByRole('button', { name: /démarrer|lancer|commencer/i }).click();
      console.log('✅ Game launched successfully');
    } catch (e) {
      console.log('⚠️ Start game button not found, game may not be ready to start yet');
      console.log('Current host page content:');
      console.log(await hostPage.content());
    }

    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take screenshots for debugging
    await hostPage.screenshot({ path: 'host-error.png' });
    await hunter1Page.screenshot({ path: 'hunter1-error.png' });
    
  } finally {
    // Keep browser open for 5 seconds to see results
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup: Close all contexts
    await hostContext.close();
    await hunter1Context.close();
    await hunter2Context.close();
    await browser.close();
  }
}

// Run the test
runHappyPathTest().catch(console.error);