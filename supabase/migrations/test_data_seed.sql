-- =================================================================
--  TEST DATA SEEDING SCRIPT
-- =================================================================
--  This script populates the database with comprehensive test data
--  for the Chicken Chase application, creating a realistic scenario
--  with multiple games, teams, players, and challenges.
--
--  Author: Claude Code Assistant  
--  Date: 27/07/2025
-- =================================================================

-- =================================================================
--  SEED DEFAULT CHALLENGES
-- =================================================================

INSERT INTO public.challenges (title, description, points, type, correct_answer) VALUES
-- Social and Fun Challenges
('Trinquons entre inconnus!', 'Offrez un verre à un parfait inconnu dans le bar et immortalisez ce moment de générosité avec un selfie "tchin-tchin".', 50, 'photo', NULL),
('Meilleure Imitation d''Animal', 'Faites votre meilleure imitation d''un animal de la ferme devant le personnel du bar. Filmez la réaction!', 30, 'photo', NULL),
('Danse de la Poule', 'Dansez "la danse de la poule" pendant 30 secondes dans le bar. Tout l''équipe doit participer!', 35, 'photo', NULL),
('Cocktail Original', 'Demandez au barman de vous créer un cocktail avec au moins 3 ingrédients insolites et prenez une photo du résultat.', 40, 'photo', NULL),
('Karaoké Improvisé', 'Chantez une chanson en français (même si c''est mal!) devant les clients du bar.', 45, 'photo', NULL),
('Histoire du Lieu', 'Demandez au personnel l''histoire du bar/restaurant et racontez-nous en 1 minute en vidéo.', 40, 'photo', NULL),

-- Tourist/Brussels Challenges  
('Faire un "à fond" de groupe devant le Manneken Pis', 'Faire un "à fond" de groupe devant le Manneken Pis', 100, 'photo', NULL),
('Bière Belge Authentique', 'Commandez une bière belge traditionnelle et expliquez pourquoi vous l''avez choisie en vidéo.', 25, 'photo', NULL),
('Selfie avec un Belge', 'Prenez un selfie avec un local belge et demandez-lui de dire "Salut les poulets!" en français.', 35, 'photo', NULL),
('Spécialité Locale', 'Commandez et goûtez une spécialité culinaire belge (frites, gaufres, moules, etc.) et donnez votre avis en vidéo.', 30, 'photo', NULL),
('Guide Touristique', 'Faites un mini-guide touristique de 2 minutes sur le quartier où vous vous trouvez.', 50, 'photo', NULL),
('Monument Mystère', 'Trouvez un monument, statue ou plaque historique dans un rayon de 200m et expliquez son histoire.', 60, 'photo', NULL),
('Accent Belge', 'Imitez l''accent belge pendant une conversation de 2 minutes avec un local.', 45, 'photo', NULL),
('Flemish ou Français?', 'Trouvez quelqu''un qui parle flamand et demandez-lui d''enseigner un mot à votre équipe.', 40, 'photo', NULL),
('Architecture Bruxelloise', 'Photographiez 3 styles architecturaux différents dans la même rue et expliquez les différences.', 55, 'photo', NULL),

-- Creative/Artistic Challenges
('Street Art', 'Trouvez une œuvre de street art ou graffiti et recréez la pose/l''expression avec votre équipe.', 40, 'photo', NULL),
('Mode Belge', 'Chaque membre de l''équipe doit porter quelque chose de typiquement belge (même improvisé) pour la photo.', 35, 'photo', NULL),

-- Riddle/Unlock Challenges
('Qu''est-ce qui est petit et marron?', 'Une énigme pour les plus forts.', 350, 'unlock', 'un marron'),
('Où se trouve la plus ancienne statue de Bruxelles?', 'Indice: Elle est très... exposée.', 200, 'unlock', 'Manneken Pis'),
('Quelle rue abrite le plus célèbre petit bonhomme de Bruxelles?', 'Vous y trouverez celui qui fait pipi depuis des siècles.', 150, 'unlock', 'Rue de l''Étuve');

-- =================================================================
--  CREATE TEST GAME 1: ACTIVE GAME IN PROGRESS
-- =================================================================

DO $$
DECLARE
    test_game_id_1 uuid;
    host_player_id uuid;
    chicken_team_id uuid;
    hunter_team_1_id uuid;
    hunter_team_2_id uuid;
    player_2_id uuid;
    player_3_id uuid;
    player_4_id uuid;
    player_5_id uuid;
    player_6_id uuid;
    challenge_1_id uuid;
    challenge_2_id uuid;
BEGIN
    -- Create Test Game 1
    INSERT INTO public.games (
        join_code, 
        status,
        cagnotte_initial, 
        cagnotte_current,
        max_teams,
        game_duration,
        started_at,
        chicken_hidden_at
    ) VALUES (
        'TEST01', 
        'chicken_hidden',
        8000, 
        6500,
        4,
        120,
        now() - interval '30 minutes',
        now() - interval '20 minutes'
    ) RETURNING id INTO test_game_id_1;

    -- Create Teams
    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, is_chicken_team)
    VALUES (test_game_id_1, 'Les Coqs Dorés', 0, 0, 0, true)
    RETURNING id INTO chicken_team_id;

    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, is_chicken_team)
    VALUES (test_game_id_1, 'Chasseurs de Bruxelles', 120, 2, 3, false)
    RETURNING id INTO hunter_team_1_id;

    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, is_chicken_team)
    VALUES (test_game_id_1, 'Team Waffle', 85, 1, 2, false)
    RETURNING id INTO hunter_team_2_id;

    -- Create Host Player (Chicken team)
    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, chicken_team_id, 'ChickenMaster')
    RETURNING id INTO host_player_id;

    -- Create other players
    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, chicken_team_id, 'PouleDeuxième')
    RETURNING id INTO player_2_id;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, hunter_team_1_id, 'HunterLeader')
    RETURNING id INTO player_3_id;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, hunter_team_1_id, 'DetectiveBrux')
    RETURNING id INTO player_4_id;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, hunter_team_2_id, 'WaffleHunter')
    RETURNING id INTO player_5_id;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_1, hunter_team_2_id, 'FritesDetective')
    RETURNING id INTO player_6_id;

    -- Update game with host and chicken team
    UPDATE public.games 
    SET 
        public.games.host_player_id = host_player_id, 
        public.games.chicken_team_id = chicken_team_id
    WHERE public.games.id = test_game_id_1;

    -- Add Brussels bars to the game
    INSERT INTO public.game_bars (game_id, name, address, description, latitude, longitude, photo_url, rating, visited, visited_by_team_id, visited_at) VALUES
    (test_game_id_1, 'Delirium Café', 'Impasse de la Fidélité 4A, 1000 Bruxelles', 'Famous beer café with over 3000 different beers', 50.8464, 4.3547, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 4.5, true, hunter_team_1_id, now() - interval '15 minutes'),
    (test_game_id_1, 'Au Bon Vieux Temps', 'Rue du Marché aux Herbes 12, 1000 Bruxelles', 'Traditional Belgian pub in historic setting', 50.8476, 4.3552, 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34', 4.2, true, hunter_team_1_id, now() - interval '10 minutes'),
    (test_game_id_1, 'Le Cirio', 'Rue de la Bourse 18-20, 1000 Bruxelles', 'Art nouveau café since 1886', 50.8481, 4.3498, 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa', 4.3, false, NULL, NULL),
    (test_game_id_1, 'Café Central', 'Rue Borgval 14, 1000 Bruxelles', 'Classic Brussels brown café', 50.8459, 4.3523, 'https://images.unsplash.com/photo-1569251650747-7ef8ebe89f8e', 4.1, false, NULL, NULL),
    (test_game_id_1, 'A la Mort Subite', 'Rue Montagne aux Herbes Potagères 7, 1000 Bruxelles', 'Historic lambic beer house', 50.8473, 4.3539, 'https://images.unsplash.com/photo-1436114346892-52de7ca9efdb', 4.4, true, hunter_team_2_id, now() - interval '25 minutes'),
    (test_game_id_1, 'Chez Moeder Lambic', 'Place Fontainas 8, 1000 Bruxelles', 'Specialty craft beer bar', 50.8434, 4.3471, 'https://images.unsplash.com/photo-1549116365-b29c2f938f13', 4.6, false, NULL, NULL);

    -- Add some challenge submissions
    SELECT id INTO challenge_1_id FROM public.challenges WHERE title = 'Bière Belge Authentique' LIMIT 1;
    SELECT id INTO challenge_2_id FROM public.challenges WHERE title = 'Selfie avec un Belge' LIMIT 1;

    INSERT INTO public.challenge_submissions (challenge_id, team_id, game_id, status, photo_url, submitted_at) VALUES
    (challenge_1_id, hunter_team_1_id, test_game_id_1, 'approved', 'https://images.unsplash.com/photo-1558618522-fcd79c4cd296', now() - interval '12 minutes'),
    (challenge_2_id, hunter_team_1_id, test_game_id_1, 'pending', 'https://images.unsplash.com/photo-1529258283598-8d6fe60b27f4', now() - interval '5 minutes'),
    (challenge_1_id, hunter_team_2_id, test_game_id_1, 'approved', 'https://images.unsplash.com/photo-1582992414577-bf67eb4d3c2c', now() - interval '18 minutes');

    -- Add some messages
    INSERT INTO public.messages (game_id, player_id, content, is_system_message, created_at) VALUES
    (test_game_id_1, NULL, 'La partie a commencé! Le poulet a 20 minutes pour se cacher.', true, now() - interval '30 minutes'),
    (test_game_id_1, NULL, '🚨 ATTENTION : Le poulet est maintenant caché! La chasse est officiellement lancée! 🚨', true, now() - interval '20 minutes'),
    (test_game_id_1, player_3_id, 'Let''s check Delirium first, it''s always crowded!', false, now() - interval '18 minutes'),
    (test_game_id_1, player_5_id, 'Team Waffle heading to Grand Place area', false, now() - interval '15 minutes'),
    (test_game_id_1, player_3_id, 'Found them at Delirium! Wait no, false alarm 😅', false, now() - interval '12 minutes'),
    (test_game_id_1, player_4_id, 'Completed the beer challenge! Trying "Tripel Karmeliet" 🍺', false, now() - interval '10 minutes');

    -- Add some game events
    INSERT INTO public.game_events (game_id, event_type, event_data, created_at) VALUES
    (test_game_id_1, 'game_started', '{"message": "La partie a commencé!", "started_by": "ChickenMaster"}', now() - interval '30 minutes'),
    (test_game_id_1, 'chicken_hidden', '{"message": "Le poulet est caché! La chasse est lancée!", "chicken_team_id": "' || chicken_team_id || '", "hidden_at": "' || (now() - interval '20 minutes') || '"}', now() - interval '20 minutes'),
    (test_game_id_1, 'bar_visited', '{"team_id": "' || hunter_team_1_id || '", "bar_name": "Delirium Café", "timestamp": "' || (now() - interval '15 minutes') || '"}', now() - interval '15 minutes'),
    (test_game_id_1, 'challenge_completed', '{"team_id": "' || hunter_team_1_id || '", "challenge_title": "Bière Belge Authentique", "points": 25, "timestamp": "' || (now() - interval '12 minutes') || '"}', now() - interval '12 minutes');

END $$;

-- =================================================================
--  CREATE TEST GAME 2: LOBBY WAITING FOR PLAYERS
-- =================================================================

DO $$
DECLARE
    test_game_id_2 uuid;
    host_player_id_2 uuid;
    team_1_id uuid;
    team_2_id uuid;
    player_2_id uuid;
    player_3_id uuid;
BEGIN
    -- Create Test Game 2 (Lobby state)
    INSERT INTO public.games (
        join_code, 
        status,
        cagnotte_initial, 
        cagnotte_current,
        max_teams,
        game_duration
    ) VALUES (
        'LOBBY2', 
        'lobby',
        5000, 
        5000,
        6,
        90
    ) RETURNING id INTO test_game_id_2;

    -- Create some teams in lobby
    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, is_chicken_team)
    VALUES (test_game_id_2, 'Future Chickens', 0, 0, 0, false)
    RETURNING id INTO team_1_id;

    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, is_chicken_team)
    VALUES (test_game_id_2, 'Early Hunters', 0, 0, 0, false)
    RETURNING id INTO team_2_id;

    -- Create players
    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_2, team_1_id, 'HostPlayer')
    RETURNING id INTO host_player_id_2;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_2, team_1_id, 'TeamMate1')
    RETURNING id INTO player_2_id;

    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_2, team_2_id, 'EagerHunter')
    RETURNING id INTO player_3_id;

    -- Update game with host
    UPDATE public.games 
    SET public.games.host_player_id = host_player_id_2
    WHERE public.games.id = test_game_id_2;

    -- Add some bars for this game too
    INSERT INTO public.game_bars (game_id, name, address, description, latitude, longitude, rating) VALUES
    (test_game_id_2, 'Café de la Gare', 'Place de la Gare 1, 1000 Bruxelles', 'Station café perfect for quick drinks', 50.8357, 4.3369, 3.8),
    (test_game_id_2, 'Le Greenwich', 'Rue des Chartreux 7, 1000 Bruxelles', 'Chess playing café with character', 50.8498, 4.3441, 4.0),
    (test_game_id_2, 'L''Archiduc', 'Rue Antoine Dansaert 6, 1000 Bruxelles', 'Art deco jazz bar', 50.8507, 4.3447, 4.2);

    -- Add lobby messages
    INSERT INTO public.messages (game_id, player_id, content, is_system_message, created_at) VALUES
    (test_game_id_2, NULL, 'Partie créée! En attente de plus de joueurs...', true, now() - interval '5 minutes'),
    (test_game_id_2, player_2_id, 'Ready to hunt some chickens! 🐔', false, now() - interval '3 minutes'),
    (test_game_id_2, player_3_id, 'When do we start?', false, now() - interval '2 minutes'),
    (test_game_id_2, host_player_id_2, 'Waiting for a few more teams to join', false, now() - interval '1 minute');

END $$;

-- =================================================================
--  CREATE TEST GAME 3: FINISHED GAME FOR STATS
-- =================================================================

DO $$
DECLARE
    test_game_id_3 uuid;
    host_player_id_3 uuid;
    chicken_team_id_3 uuid;
    winner_team_id uuid;
    loser_team_id uuid;
BEGIN
    -- Create Test Game 3 (Finished)
    INSERT INTO public.games (
        join_code, 
        status,
        cagnotte_initial, 
        cagnotte_current,
        max_teams,
        game_duration,
        started_at,
        chicken_hidden_at
    ) VALUES (
        'FINISH', 
        'finished',
        6000, 
        2500,
        4,
        120,
        now() - interval '3 hours',
        now() - interval '2 hours 30 minutes'
    ) RETURNING id INTO test_game_id_3;

    -- Create teams
    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, found_chicken, is_chicken_team)
    VALUES (test_game_id_3, 'Escaped Chickens', 200, 0, 0, false, true)
    RETURNING id INTO chicken_team_id_3;

    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, found_chicken, is_chicken_team)
    VALUES (test_game_id_3, 'Master Hunters', 350, 4, 8, true, false)
    RETURNING id INTO winner_team_id;

    INSERT INTO public.teams (game_id, name, score, bars_visited, challenges_completed, found_chicken, is_chicken_team)
    VALUES (test_game_id_3, 'Lost Detectives', 180, 2, 4, false, false)
    RETURNING id INTO loser_team_id;

    -- Create players for finished game
    INSERT INTO public.players (game_id, team_id, nickname)
    VALUES (test_game_id_3, chicken_team_id_3, 'EscapeArtist')
    RETURNING id INTO host_player_id_3;

    INSERT INTO public.players (game_id, team_id, nickname) VALUES
    (test_game_id_3, chicken_team_id_3, 'StealthChicken'),
    (test_game_id_3, winner_team_id, 'SherlockHolmes'),
    (test_game_id_3, winner_team_id, 'WatsonHelper'),
    (test_game_id_3, loser_team_id, 'ConfusedDetective'),
    (test_game_id_3, loser_team_id, 'LostInBrussels');

    -- Update game with host and chicken team
    UPDATE public.games 
    SET 
        public.games.host_player_id = host_player_id_3, 
        public.games.chicken_team_id = chicken_team_id_3
    WHERE public.games.id = test_game_id_3;

    -- Add bars with visit history
    INSERT INTO public.game_bars (game_id, name, address, description, latitude, longitude, rating, visited, visited_by_team_id, visited_at) VALUES
    (test_game_id_3, 'Le Falstaff', 'Rue Henri Maus 19, 1000 Bruxelles', 'Belle époque brasserie', 50.8462, 4.3531, 4.3, true, winner_team_id, now() - interval '2 hours 45 minutes'),
    (test_game_id_3, 'The Sister Brussels Café', 'Place du Jardin aux Fleurs 2-3, 1000 Bruxelles', 'Contemporary beer bar', 50.8445, 4.3568, 4.1, true, winner_team_id, now() - interval '2 hours 30 minutes'),
    (test_game_id_3, 'Café du Sablon', 'Rue de la Régence 78, 1000 Bruxelles', 'Antique district café', 50.8409, 4.3580, 3.9, true, loser_team_id, now() - interval '2 hours 15 minutes'),
    (test_game_id_3, 'Bar du Matin', 'Chaussée de Louvain 453, 1030 Bruxelles', 'Early morning spot', 50.8523, 4.3901, 3.7, false, NULL, NULL);

    -- Add final game event
    INSERT INTO public.game_events (game_id, event_type, event_data, created_at) VALUES
    (test_game_id_3, 'chicken_found', '{"hunter_team_id": "' || winner_team_id || '", "hunter_team_name": "Master Hunters", "chicken_team_id": "' || chicken_team_id_3 || '", "found_at": "Le Falstaff", "timestamp": "' || (now() - interval '45 minutes') || '"}', now() - interval '45 minutes'),
    (test_game_id_3, 'game_finished', '{"winner_team_id": "' || winner_team_id || '", "winner_team_name": "Master Hunters", "final_stats": {"total_bars_visited": 6, "total_challenges_completed": 12, "game_duration": "2h 15min"}, "timestamp": "' || (now() - interval '30 minutes') || '"}', now() - interval '30 minutes');

END $$;

-- =================================================================
--  SUMMARY AND VERIFICATION
-- =================================================================

-- Display summary of created test data
SELECT 
    'GAMES CREATED' as summary_type,
    COUNT(*) as count,
    STRING_AGG(join_code || ' (' || status || ')', ', ') as details
FROM public.games;

SELECT 
    'TEAMS CREATED' as summary_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_chicken_team = true THEN 1 END) as chicken_teams,
    COUNT(CASE WHEN is_chicken_team = false THEN 1 END) as hunter_teams
FROM public.teams;

SELECT 
    'PLAYERS CREATED' as summary_type,
    COUNT(*) as count,
    COUNT(DISTINCT game_id) as games_with_players
FROM public.players;

SELECT 
    'CHALLENGES CREATED' as summary_type,
    COUNT(*) as count,
    COUNT(CASE WHEN type = 'photo' THEN 1 END) as photo_challenges,
    COUNT(CASE WHEN type = 'unlock' THEN 1 END) as unlock_challenges
FROM public.challenges;

SELECT 
    'BARS CREATED' as summary_type,
    COUNT(*) as count,
    COUNT(CASE WHEN visited = true THEN 1 END) as visited_bars,
    COUNT(DISTINCT game_id) as games_with_bars
FROM public.game_bars;

-- Display game states for easy testing
SELECT 
    g.join_code,
    g.status,
    g.cagnotte_current/100.0 as cagnotte_euros,
    COUNT(DISTINCT t.id) as team_count,
    COUNT(DISTINCT p.id) as player_count,
    COUNT(DISTINCT gb.id) as bar_count
FROM public.games g
LEFT JOIN public.teams t ON g.id = t.game_id
LEFT JOIN public.players p ON g.id = p.game_id  
LEFT JOIN public.game_bars gb ON g.id = gb.game_id
GROUP BY g.id, g.join_code, g.status, g.cagnotte_current
ORDER BY g.created_at;