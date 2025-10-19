-- Brussels Bar Crawl Game Initialization Migration
-- Migration: 20250817000000_brussels_game_initializer.sql
-- Purpose: Creates a realistic Brussels game setup with authentic bars and Belgian beer challenges
-- Author: Claude Code
-- Date: 2025-08-17

-- This migration provides a function to create realistic Brussels bar crawl games
-- for testing and demonstration purposes.

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS create_brussels_game();

-- Create the Brussels game initialization function
CREATE OR REPLACE FUNCTION create_brussels_game()
RETURNS TABLE(
  game_id UUID,
  join_code TEXT,
  game_summary JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  new_game_id UUID;
  new_join_code TEXT;
  chicken_team_id UUID;
  host_player_id UUID;
BEGIN
  -- Generate unique join code
  new_join_code := 'BRUX' || upper(substring(md5(random()::text) from 1 for 2));
  
  -- Step 1: Create a new game with realistic Brussels settings
  INSERT INTO games (
    id,
    join_code,
    status,
    host_player_id,
    chicken_team_id,
    cagnotte_initial,
    cagnotte_current,
    max_teams,
    game_duration,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_join_code,
    'lobby',
    NULL, -- Will be set after creating host player
    NULL, -- Will be set after creating chicken team
    10000, -- 100€ in cents
    10000,
    8,
    180, -- 3 hours for proper Brussels bar crawl
    NOW(),
    NOW()
  )
  RETURNING id INTO new_game_id;

  -- Step 2: Create Brussels bars data directly in game_bars
  INSERT INTO game_bars (id, game_id, name, address, description, latitude, longitude, photo_url, rating, visited, created_at)
  VALUES 
    (gen_random_uuid(), new_game_id, 'Delirium Café', 'Impasse de la Fidélité 4A, 1000 Bruxelles', 'World-famous beer café with over 3000 beer varieties. Home of Delirium Tremens.', 50.8467, 4.3525, NULL, 4.7, false, NOW()),
    (gen_random_uuid(), new_game_id, 'À la Mort Subite', 'Rue Montagne aux Herbes Potagères 7, 1000 Bruxelles', 'Historic Brussels café serving traditional lambic beers since 1928.', 50.8485, 4.3556, NULL, 4.3, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Brussels Beer Project', 'Rue Antoine Dansaert 188, 1000 Bruxelles', 'Modern craft brewery with innovative Belgian beer styles and local ingredients.', 50.8513, 4.3462, NULL, 4.5, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Café du Sablon', 'Rue de la Paille 4, 1000 Bruxelles', 'Elegant café in the historic Sablon district, perfect for Belgian beer tasting.', 50.8407, 4.3582, NULL, 4.4, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Le Cirio', 'Rue de la Bourse 18-20, 1000 Bruxelles', 'Art Nouveau café from 1886, serving traditional Belgian beers in historic setting.', 50.8484, 4.3515, NULL, 4.2, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Poechenellekelder', 'Rue du Chêne 5, 1000 Bruxelles', 'Traditional puppet-themed café near Manneken Pis, serving authentic Belgian ales.', 50.8449, 4.3497, NULL, 4.3, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Goupil le Fol', 'Rue de la Violette 22, 1000 Bruxelles', 'Medieval-themed tavern with extensive Belgian beer menu and traditional atmosphere.', 50.8458, 4.3544, NULL, 4.1, false, NOW()),
    (gen_random_uuid(), new_game_id, 'Au Bon Vieux Temps', 'Impasse Saint-Nicolas 4, 1000 Bruxelles', 'Hidden gem café in narrow alley, serving rare Belgian beers in intimate setting.', 50.8475, 4.3533, NULL, 4.6, false, NOW());

  -- Step 3: Create Belgian beer-themed challenges (only if they don't exist)
  INSERT INTO challenges (id, title, description, points, type, correct_answer)
  SELECT * FROM (VALUES
    (gen_random_uuid(), 'Belgian Beer Style Master', 'Take a photo of yourself with a Trappist beer and name the 6 official Trappist breweries in Belgium', 150, 'photo', 'Achel, Chimay, Orval, Rochefort, Westmalle, Westvleteren'),
    (gen_random_uuid(), 'Lambic Knowledge', 'What is the traditional aging process for lambic beers?', 100, 'question', 'Spontaneous fermentation with wild yeasts for 1-3 years in oak barrels'),
    (gen_random_uuid(), 'Brussels Brewery Hunt', 'Take a selfie outside a Brussels brewery and tag your team location', 120, 'photo', NULL),
    (gen_random_uuid(), 'Beer Glass Expert', 'Match the beer to its proper glass: Take photos of 3 different Belgian beers in their correct glassware', 180, 'photo', 'Duvel - tulip glass, Chimay - goblet, Stella - chalice'),
    (gen_random_uuid(), 'ABV Calculator', 'Calculate: If you drink 2 Delirium Tremens (8.5% ABV, 330ml) and 1 Chimay Blue (9% ABV, 330ml), what is your total alcohol consumption in standard units?', 100, 'question', '3.3 units'),
    (gen_random_uuid(), 'Belgian Beer History', 'Which Belgian beer style was created by accident due to a brewery fire?', 80, 'question', 'Saison'),
    (gen_random_uuid(), 'Team Spirit Photo', 'Take a creative team photo with traditional Belgian bar decorations in the background', 100, 'photo', NULL),
    (gen_random_uuid(), 'Local Interaction', 'Ask a local Belgian for their favorite beer recommendation and take a photo with them', 140, 'photo', NULL)
  ) AS new_challenges(id, title, description, points, type, correct_answer)
  WHERE NOT EXISTS (
    SELECT 1 FROM challenges c WHERE c.title = new_challenges.title
  );

  -- Step 4: Create chicken team
  INSERT INTO teams (id, game_id, name, is_chicken_team, score, bars_visited, challenges_completed, found_chicken)
  VALUES (gen_random_uuid(), new_game_id, 'Les Coqs de Bruxelles', true, 0, 0, 0, false)
  RETURNING id INTO chicken_team_id;

  -- Step 5: Create hunter teams
  INSERT INTO teams (id, game_id, name, is_chicken_team, score, bars_visited, challenges_completed, found_chicken)
  VALUES 
    (gen_random_uuid(), new_game_id, 'Les Chasseurs de Manneken', false, 0, 0, 0, false),
    (gen_random_uuid(), new_game_id, 'Équipe Atomium', false, 0, 0, 0, false),
    (gen_random_uuid(), new_game_id, 'Brussels Detectives', false, 0, 0, 0, false),
    (gen_random_uuid(), new_game_id, 'Les Gaufres Warriors', false, 0, 0, 0, false);

  -- Step 6: Create host player (chicken team)
  INSERT INTO players (id, game_id, team_id, nickname)
  VALUES (gen_random_uuid(), new_game_id, chicken_team_id, 'Amélie-' || substr(md5(random()::text), 1, 4))
  RETURNING id INTO host_player_id;

  -- Step 7: Create other players for hunter teams
  INSERT INTO players (id, game_id, team_id, nickname)
  SELECT 
    gen_random_uuid(),
    new_game_id,
    t.id,
    player_data.nickname || '-' || substr(md5(random()::text), 1, 3)
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
    FROM teams 
    WHERE game_id = new_game_id AND is_chicken_team = false
    LIMIT 4
  ) t
  CROSS JOIN (VALUES 
    (1, 'Pierre'),
    (2, 'Marie'),
    (3, 'Jean-Baptiste'),
    (4, 'Sophie')
  ) AS player_data(rn, nickname)
  WHERE t.rn = player_data.rn;

  -- Step 8: Update the game with host and chicken team
  UPDATE games 
  SET 
    host_player_id = host_player_id,
    chicken_team_id = chicken_team_id,
    updated_at = NOW()
  WHERE id = new_game_id;

  -- Step 9: Create initial game event
  INSERT INTO game_events (game_id, event_type, event_data, created_at)
  VALUES (
    new_game_id,
    'game_created',
    json_build_object(
      'host_nickname', (SELECT nickname FROM players WHERE id = host_player_id),
      'initial_cagnotte', 100.00,
      'max_teams', 8,
      'duration_hours', 3,
      'bars_count', 8,
      'challenges_count', 8,
      'location', 'Brussels, Belgium',
      'created_by', 'Brussels Game Initializer Function',
      'timestamp', NOW()
    ),
    NOW()
  );

  -- Return game information
  RETURN QUERY
  SELECT 
    new_game_id,
    new_join_code,
    json_build_object(
      'message', 'Brussels Bar Crawl Game Created Successfully!',
      'join_code', new_join_code,
      'status', 'lobby',
      'host', (SELECT nickname FROM players WHERE id = host_player_id),
      'chicken_team', 'Les Coqs de Bruxelles',
      'teams_count', (SELECT COUNT(*) FROM teams WHERE game_id = new_game_id),
      'players_count', (SELECT COUNT(*) FROM players WHERE game_id = new_game_id),
      'bars_count', (SELECT COUNT(*) FROM game_bars WHERE game_id = new_game_id),
      'challenges_available', (SELECT COUNT(*) FROM challenges),
      'location', 'Brussels, Belgium',
      'duration', '3 hours',
      'cagnotte', '100€',
      'instructions', 'To join this game, use join code: ' || new_join_code || '. The game includes 8 authentic Brussels bars and Belgian beer challenges!'
    );
END;
$$;

-- Add a comment describing the function
COMMENT ON FUNCTION create_brussels_game() IS 
'Creates a realistic Brussels bar crawl game with 8 authentic venues, Belgian beer challenges, and test teams/players. Returns game information including join code.';