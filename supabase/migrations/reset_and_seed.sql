-- =================================================================
--  RESET AND SEED DATABASE SCRIPT
-- =================================================================
--  This script provides a quick way to reset the entire database
--  and populate it with test data. Use this for development and testing.
--
--  Usage:
--  1. Run this script in Supabase SQL Editor
--  2. Or use: psql -f reset_and_seed.sql
--
--  Author: Claude Code Assistant
--  Date: 27/07/2025
-- =================================================================

-- First, run the complete schema setup
\i 20250621000000_complete_schema_setup.sql

-- Then, seed with test data
\i test_data_seed.sql

-- Display final summary
SELECT '=== DATABASE RESET AND SEEDING COMPLETE ===' as status;

SELECT 
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM public.games) as total_games,
    (SELECT COUNT(*) FROM public.teams) as total_teams,
    (SELECT COUNT(*) FROM public.players) as total_players,
    (SELECT COUNT(*) FROM public.challenges) as total_challenges,
    (SELECT COUNT(*) FROM public.game_bars) as total_bars,
    (SELECT COUNT(*) FROM public.challenge_submissions) as total_submissions;

-- Show test games available for testing
SELECT 
    'TEST GAMES AVAILABLE' as info,
    join_code as "Join Code",
    status as "Status",
    (SELECT COUNT(*) FROM public.teams WHERE game_id = g.id) as "Teams",
    (SELECT COUNT(*) FROM public.players WHERE game_id = g.id) as "Players",
    CASE 
        WHEN status = 'lobby' THEN 'Use this code to test joining a game'
        WHEN status = 'chicken_hidden' THEN 'Active game in progress - test gameplay'
        WHEN status = 'finished' THEN 'Completed game - test statistics/history'
        ELSE 'Available for testing'
    END as "Use Case"
FROM public.games g
ORDER BY g.created_at;

SELECT '=== READY FOR TESTING! ===' as final_status;