-- Development Data Initialization Script
-- File: scripts/init-dev-data.sql
-- Purpose: Initialize development/testing data including Brussels game
-- Usage: Execute via Supabase dashboard or CLI
-- Author: Claude Code
-- Date: 2025-08-17

-- This script can be run multiple times safely
-- It includes all Belgian beer challenges and creates a Brussels game

-- =============================================================================
-- BELGIAN BEER CHALLENGES SETUP
-- =============================================================================

-- Insert Belgian beer challenges (only if they don't exist)
INSERT INTO challenges (id, title, description, points, type, correct_answer)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'Belgian Beer Style Master', 'Take a photo of yourself with a Trappist beer and name the 6 official Trappist breweries in Belgium', 150, 'photo', 'Achel, Chimay, Orval, Rochefort, Westmalle, Westvleteren'),
  (gen_random_uuid(), 'Lambic Knowledge', 'What is the traditional aging process for lambic beers?', 100, 'question', 'Spontaneous fermentation with wild yeasts for 1-3 years in oak barrels'),
  (gen_random_uuid(), 'Brussels Brewery Hunt', 'Take a selfie outside a Brussels brewery and tag your team location', 120, 'photo', NULL),
  (gen_random_uuid(), 'Beer Glass Expert', 'Match the beer to its proper glass: Take photos of 3 different Belgian beers in their correct glassware', 180, 'photo', 'Duvel - tulip glass, Chimay - goblet, Stella - chalice'),
  (gen_random_uuid(), 'ABV Calculator', 'Calculate: If you drink 2 Delirium Tremens (8.5% ABV, 330ml) and 1 Chimay Blue (9% ABV, 330ml), what is your total alcohol consumption in standard units?', 100, 'question', '3.3 units'),
  (gen_random_uuid(), 'Belgian Beer History', 'Which Belgian beer style was created by accident due to a brewery fire?', 80, 'question', 'Saison'),
  (gen_random_uuid(), 'Team Spirit Photo', 'Take a creative team photo with traditional Belgian bar decorations in the background', 100, 'photo', NULL),
  (gen_random_uuid(), 'Local Interaction', 'Ask a local Belgian for their favorite beer recommendation and take a photo with them', 140, 'photo', NULL),
  (gen_random_uuid(), 'Gueuze Knowledge', 'What makes Gueuze beer special in the lambic family?', 90, 'question', 'Blend of young and old lambics, naturally carbonated through bottle conditioning'),
  (gen_random_uuid(), 'Belgian Brewery Visit', 'Take a photo at the entrance of any Belgian brewery with your team', 110, 'photo', NULL),
  (gen_random_uuid(), 'Beer Pairing Challenge', 'Name a traditional Belgian dish that pairs well with Chimay Blue', 120, 'question', 'Carbonnade flamande, Belgian beef stew, or aged cheese'),
  (gen_random_uuid(), 'Trappist Knowledge', 'Which Trappist brewery is known for their Westvleteren 12?', 130, 'question', 'Sint-Sixtus Abbey (Westvleteren)'),
  (gen_random_uuid(), 'Brussels Culture', 'Take a photo with a local Brussels landmark while holding a Belgian beer', 160, 'photo', NULL),
  (gen_random_uuid(), 'Belgian Beer Math', 'If a Duvel (8.5% ABV) costs 4€ and a Stella (5% ABV) costs 2.50€, which has better alcohol value per euro?', 100, 'question', 'Duvel: 2.125% per euro vs Stella: 2% per euro'),
  (gen_random_uuid(), 'Cantillon Challenge', 'What is special about Cantillon brewery in Brussels?', 110, 'question', 'Traditional lambic brewery, spontaneous fermentation, museum and working brewery'),
  (gen_random_uuid(), 'Team Coordination', 'Organize your team to spell "BEER" using your bodies and take a photo', 90, 'photo', NULL)
) AS new_challenges(id, title, description, points, type, correct_answer)
WHERE NOT EXISTS (
  SELECT 1 FROM challenges c WHERE c.title = new_challenges.title
);

-- =============================================================================
-- CREATE BRUSSELS GAME
-- =============================================================================

-- Call the Brussels game creation function (if it exists)
-- This will create a complete game with teams, players, and Brussels venues
DO $$
DECLARE
  game_result RECORD;
BEGIN
  -- Check if function exists before calling
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_brussels_game') THEN
    -- Create Brussels game
    SELECT * INTO game_result FROM create_brussels_game() LIMIT 1;
    
    RAISE NOTICE 'Brussels game created successfully!';
    RAISE NOTICE 'Join Code: %', game_result.join_code;
    RAISE NOTICE 'Game ID: %', game_result.game_id;
  ELSE
    RAISE NOTICE 'create_brussels_game() function not found. Please apply migration 20250817000000_brussels_game_initializer.sql first';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create Brussels game: %', SQLERRM;
END
$$;

-- =============================================================================
-- DEVELOPMENT UTILITIES
-- =============================================================================

-- View to easily check current games
CREATE OR REPLACE VIEW dev_games_overview AS
SELECT 
  g.id,
  g.join_code,
  g.status,
  g.created_at,
  g.cagnotte_current / 100.0 as cagnotte_euros,
  g.game_duration as duration_minutes,
  (SELECT COUNT(*) FROM teams WHERE game_id = g.id) as teams_count,
  (SELECT COUNT(*) FROM players WHERE game_id = g.id) as players_count,
  (SELECT COUNT(*) FROM game_bars WHERE game_id = g.id) as bars_count,
  (SELECT name FROM teams WHERE game_id = g.id AND is_chicken_team = true) as chicken_team_name,
  (SELECT nickname FROM players WHERE game_id = g.id AND id = g.host_player_id) as host_nickname
FROM games g
ORDER BY g.created_at DESC;

-- View to check challenges
CREATE OR REPLACE VIEW dev_challenges_overview AS
SELECT 
  id,
  title,
  type,
  points,
  CASE 
    WHEN length(description) > 50 THEN left(description, 47) || '...'
    ELSE description
  END as description_short,
  correct_answer IS NOT NULL as has_answer
FROM challenges
ORDER BY points DESC, title;

-- Function to clean up old development games (keeps last 5)
CREATE OR REPLACE FUNCTION cleanup_dev_games()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete games older than the 5 most recent ones
  WITH games_to_keep AS (
    SELECT id FROM games 
    ORDER BY created_at DESC 
    LIMIT 5
  ),
  games_to_delete AS (
    DELETE FROM games 
    WHERE id NOT IN (SELECT id FROM games_to_keep)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM games_to_delete;
  
  RETURN format('Cleaned up %s old development games', deleted_count);
END
$$;

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- Display summary of what was created
SELECT 
  'Development data initialization completed!' as status,
  (SELECT COUNT(*) FROM challenges) as total_challenges,
  (SELECT COUNT(*) FROM games WHERE join_code LIKE 'BRUX%') as brussels_games_count,
  (SELECT join_code FROM games WHERE join_code LIKE 'BRUX%' ORDER BY created_at DESC LIMIT 1) as latest_brussels_game;

-- Usage instructions
SELECT 
  'Usage Instructions' as info,
  'Use dev_games_overview view to see all games' as tip1,
  'Use dev_challenges_overview view to see all challenges' as tip2,
  'Call cleanup_dev_games() to remove old test games' as tip3,
  'Use the join code from latest_brussels_game to test the app' as tip4;