#!/usr/bin/env node

/**
 * Brussels Bar Crawl Game Creation Script
 * 
 * This script creates a realistic Brussels bar crawl game with authentic venues,
 * Belgian beer challenges, and test teams/players for development and testing.
 * 
 * Usage:
 *   node scripts/create-brussels-game.js
 *   npm run create-brussels-game
 * 
 * Requirements:
 *   - Supabase project configured
 *   - Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 *   - Migration 20250817000000_brussels_game_initializer.sql applied
 * 
 * @author Claude Code
 * @date 2025-08-17
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase configuration');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a Brussels bar crawl game using the database function
 */
async function createBrusselsGame() {
  try {
    console.log('🍺 Creating Brussels Bar Crawl Game...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Call the Brussels game creation function
    const { data, error } = await supabase.rpc('create_brussels_game');
    
    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No game data returned from function');
    }

    const gameInfo = data[0];
    const gameDetails = gameInfo.game_summary;

    console.log('✅ Game Created Successfully!');
    console.log('');
    console.log('🎮 GAME INFORMATION:');
    console.log(`   Join Code: ${gameDetails.join_code}`);
    console.log(`   Status: ${gameDetails.status}`);
    console.log(`   Host: ${gameDetails.host}`);
    console.log(`   Location: ${gameDetails.location}`);
    console.log(`   Duration: ${gameDetails.duration}`);
    console.log(`   Cagnotte: ${gameDetails.cagnotte}`);
    console.log('');
    console.log('👥 TEAMS & PLAYERS:');
    console.log(`   Total Teams: ${gameDetails.teams_count}`);
    console.log(`   Total Players: ${gameDetails.players_count}`);
    console.log(`   Chicken Team: ${gameDetails.chicken_team}`);
    console.log('');
    console.log('🍻 GAME CONTENT:');
    console.log(`   Brussels Bars: ${gameDetails.bars_count}`);
    console.log(`   Available Challenges: ${gameDetails.challenges_available}`);
    console.log('');
    console.log('📱 TO JOIN THE GAME:');
    console.log(`   1. Open the Chicken Chase app`);
    console.log(`   2. Tap "Join Game"`);
    console.log(`   3. Enter join code: ${gameDetails.join_code}`);
    console.log(`   4. Choose your nickname and team`);
    console.log('');
    console.log('🗺️  BRUSSELS VENUES INCLUDED:');
    console.log('   • Delirium Café (4.7★) - World-famous beer café');
    console.log('   • À la Mort Subite (4.3★) - Historic lambic specialist');
    console.log('   • Brussels Beer Project (4.5★) - Modern craft brewery');
    console.log('   • Café du Sablon (4.4★) - Elegant Sablon district');
    console.log('   • Le Cirio (4.2★) - Art Nouveau café from 1886');
    console.log('   • Poechenellekelder (4.3★) - Puppet-themed near Manneken Pis');
    console.log('   • Goupil le Fol (4.1★) - Medieval tavern atmosphere');
    console.log('   • Au Bon Vieux Temps (4.6★) - Hidden gem in narrow alley');
    console.log('');
    console.log('🏆 CHALLENGE CATEGORIES:');
    console.log('   • Belgian Beer Knowledge (Trappist, Lambic, History)');
    console.log('   • Photo Challenges (Brewery Hunt, Team Spirit, Local Interaction)');
    console.log('   • Beer Expert Tasks (Glass Matching, ABV Calculations)');
    console.log('   • Cultural Engagement (Local Recommendations)');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Game is ready! Join with code: ${gameDetails.join_code}`);
    console.log('');
    
    return gameInfo;
    
  } catch (error) {
    console.error('❌ Error creating Brussels game:', error.message);
    
    if (error.message.includes('function create_brussels_game() does not exist')) {
      console.error('');
      console.error('📋 Solution: Apply the migration first:');
      console.error('   supabase db push');
      console.error('   or apply migration: 20250817000000_brussels_game_initializer.sql');
    }
    
    throw error;
  }
}

/**
 * Validates that the Brussels game function exists
 */
async function validateFunction() {
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'create_brussels_game')
      .limit(1);
    
    if (error) {
      console.warn('⚠️  Warning: Could not validate function existence');
      return true; // Continue anyway
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.warn('⚠️  Warning: Could not validate function existence');
    return true; // Continue anyway
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🔍 Validating setup...');
    
    // Test Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Supabase connection verified');
    
    // Validate function exists
    const functionExists = await validateFunction();
    if (!functionExists) {
      console.warn('⚠️  Warning: create_brussels_game() function may not exist');
      console.warn('   Make sure the migration 20250817000000_brussels_game_initializer.sql is applied');
    }
    
    // Create the game
    const gameInfo = await createBrusselsGame();
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBrusselsGame, validateFunction };