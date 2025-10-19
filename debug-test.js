// Debug script to test the chicken team validation
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjgyikynfwoavjbehpya.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZ3lpa3luZndvYXZqYmVocHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDE2NTMsImV4cCI6MjA2MDQxNzY1M30.b52K67UUQdI96dMsyHzpXDsYxB59yWE6ZuTjDOGBXWg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChickenValidation() {
  console.log('Testing chicken team validation...');
  
  // 1. Create a game without chicken team
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .insert([{
      join_code: `TEST${Math.random().toString(36).substr(2, 6)}`,
      status: 'lobby',
      cagnotte_initial: 1000,
      cagnotte_current: 1000
    }])
    .select()
    .single();

  if (gameError) {
    console.error('Failed to create game:', gameError);
    return;
  }

  console.log('Created game:', gameData.id);

  // 2. Try to start the game (should fail)
  const { data: rpcData, error: rpcError } = await supabase.rpc('update_game_status', {
    game_id: gameData.id,
    new_status: 'in_progress'
  });

  console.log('RPC response:', { data: rpcData, error: rpcError });

  // 3. Clean up
  await supabase.from('games').delete().eq('id', gameData.id);
  console.log('Cleaned up game');
}

testChickenValidation().catch(console.error);