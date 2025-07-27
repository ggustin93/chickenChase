-- =================================================================
--  CLEAN DATA ONLY SCRIPT
-- =================================================================
--  This script removes all data from the database while preserving
--  the schema structure. Useful for cleaning up test data without
--  recreating the entire database structure.
--
--  Author: Claude Code Assistant
--  Date: 27/07/2025
-- =================================================================

-- Disable triggers to prevent cascading issues
SET session_replication_role = replica;

-- Delete all data in dependency order (child tables first)
DELETE FROM public.game_status_history;
DELETE FROM public.game_events;
DELETE FROM public.challenge_submissions;
DELETE FROM public.messages;
DELETE FROM public.game_bars;
DELETE FROM public.players;
DELETE FROM public.teams;
DELETE FROM public.challenges;
DELETE FROM public.games;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences (if any)
-- Note: We use UUIDs for most PKs, but messages table uses bigserial
SELECT setval('public.messages_id_seq', 1, false);

-- Verify cleanup
SELECT 
    'DATA CLEANUP COMPLETE' as status,
    (SELECT COUNT(*) FROM public.games) as remaining_games,
    (SELECT COUNT(*) FROM public.teams) as remaining_teams,
    (SELECT COUNT(*) FROM public.players) as remaining_players,
    (SELECT COUNT(*) FROM public.challenges) as remaining_challenges,
    (SELECT COUNT(*) FROM public.game_bars) as remaining_bars,
    (SELECT COUNT(*) FROM public.challenge_submissions) as remaining_submissions,
    (SELECT COUNT(*) FROM public.messages) as remaining_messages,
    (SELECT COUNT(*) FROM public.game_events) as remaining_events;

SELECT 'Database is now clean and ready for fresh data!' as message;