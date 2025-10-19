-- Complete Database Reset and Clean Setup
-- Migration: 20250817100000_clean_reset.sql
-- Purpose: Clean reset of the entire database with latest schema and game flow testing
-- Author: Claude Code
-- Date: 2025-08-17

-- This migration replaces all previous migrations with a clean, unified schema
-- and provides tools for rapid game phase testing

-- =================================================================
--  COMPLETE CLEAN RESET
-- =================================================================

-- Drop all existing tables and functions (clean slate)
DROP TABLE IF EXISTS public.cagnotte_transactions CASCADE;
DROP TABLE IF EXISTS public.player_presence CASCADE;
DROP TABLE IF EXISTS public.game_bars CASCADE;
DROP TABLE IF EXISTS public.game_status_history CASCADE;
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.challenge_submissions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.create_brussels_game();
DROP FUNCTION IF EXISTS public.update_game_status(uuid, text);
DROP FUNCTION IF EXISTS public.create_game_and_host(text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.create_game_and_host(text);
DROP FUNCTION IF EXISTS public.import_bars_to_game(uuid, jsonb);
DROP FUNCTION IF EXISTS public.mark_bar_as_visited(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.cleanup_dev_games();

-- Drop development views
DROP VIEW IF EXISTS public.dev_games_overview;
DROP VIEW IF EXISTS public.dev_challenges_overview;

-- =================================================================
--  CORE SCHEMA CREATION
-- =================================================================

-- Table: games (main game sessions)
CREATE TABLE public.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    join_code varchar NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'lobby' CHECK (status = ANY (ARRAY[
        'lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled'
    ])),
    host_player_id uuid,
    chicken_team_id uuid,
    cagnotte_initial integer NOT NULL DEFAULT 10000, -- 100€ in cents
    cagnotte_current integer NOT NULL DEFAULT 10000,
    chicken_hidden_at timestamptz,
    max_teams integer DEFAULT 8,
    game_duration integer DEFAULT 180, -- 3 hours in minutes
    started_at timestamptz
);

COMMENT ON TABLE public.games IS 'Table principale des parties de jeu';
COMMENT ON COLUMN public.games.status IS 'État du jeu: lobby, in_progress, chicken_hidden, finished, cancelled';
COMMENT ON COLUMN public.games.cagnotte_initial IS 'Stored in cents';
COMMENT ON COLUMN public.games.cagnotte_current IS 'Stored in cents';
COMMENT ON COLUMN public.games.chicken_hidden_at IS 'Timestamp when the chicken was hidden and the hunt officially started';
COMMENT ON COLUMN public.games.max_teams IS 'Limite maximale d équipes autorisées (NULL = illimité)';
COMMENT ON COLUMN public.games.game_duration IS 'Durée de la partie en minutes (par défaut: 180 min)';
COMMENT ON COLUMN public.games.started_at IS 'Timestamp when the game was actually started (status changed to in_progress)';

-- Table: challenges (available challenges)
CREATE TABLE public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    points integer NOT NULL DEFAULT 10,
    type text NOT NULL CHECK (type = ANY (ARRAY['photo', 'question', 'location', 'quiz'])),
    correct_answer text
);

COMMENT ON TABLE public.challenges IS 'Défis disponibles dans le jeu';

-- Table: teams
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    score integer NOT NULL DEFAULT 0,
    bars_visited integer NOT NULL DEFAULT 0,
    challenges_completed integer NOT NULL DEFAULT 0,
    found_chicken boolean NOT NULL DEFAULT false,
    is_chicken_team boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(game_id, name)
);

COMMENT ON TABLE public.teams IS 'Équipes participant à une partie';

-- Table: players (temporary sessions, no auth required)
CREATE TABLE public.players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    nickname text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(game_id, nickname)
);

COMMENT ON TABLE public.players IS 'Joueurs participant à une partie';

-- Add foreign key constraints for games
ALTER TABLE public.games ADD CONSTRAINT games_host_player_id_fkey 
    FOREIGN KEY (host_player_id) REFERENCES public.players(id) ON DELETE SET NULL;
    
ALTER TABLE public.games ADD CONSTRAINT games_chicken_team_id_fkey 
    FOREIGN KEY (chicken_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Table: game_bars (bars for each game)
CREATE TABLE public.game_bars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    photo_url text,
    google_place_id text,
    rating numeric(2,1),
    visited boolean DEFAULT false,
    visited_by_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    visited_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_bars IS 'Bars à visiter pour chaque partie, importés depuis Google Maps';
COMMENT ON COLUMN public.game_bars.rating IS 'Note Google Maps du bar (sur 5)';
COMMENT ON COLUMN public.game_bars.visited IS 'Indique si ce bar a été visité pendant la partie';
COMMENT ON COLUMN public.game_bars.visited_by_team_id IS 'Équipe qui a visité ce bar en premier';

-- Table: messages (chat system)
CREATE TABLE public.messages (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
    content text NOT NULL,
    is_system_message boolean NOT NULL DEFAULT false,
    sender text,
    user_id text,
    timestamp timestamptz DEFAULT now(),
    is_clue boolean DEFAULT false,
    photo_url text,
    is_cagnotte_event boolean DEFAULT false,
    is_bar_removal boolean DEFAULT false,
    amount integer,
    bar_id uuid
);

COMMENT ON TABLE public.messages IS 'Messages échangés pendant une partie avec support pour indices et événements spéciaux';

-- Table: challenge_submissions
CREATE TABLE public.challenge_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    photo_url text,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    photo_urls text[] DEFAULT '{}',
    photo_metadata jsonb DEFAULT '{}'
);

COMMENT ON TABLE public.challenge_submissions IS 'Soumissions des défis par les équipes';
COMMENT ON COLUMN public.challenge_submissions.photo_urls IS 'Array of photo URLs uploaded for this challenge submission';
COMMENT ON COLUMN public.challenge_submissions.photo_metadata IS 'Metadata for uploaded photos (dimensions, sizes, upload timestamps, etc.)';

-- Table: game_events (real-time notifications)
CREATE TABLE public.game_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_events IS 'Événements de jeu pour les notifications en temps réel';

-- Table: game_status_history (audit trail)
CREATE TABLE public.game_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata jsonb
);

COMMENT ON TABLE public.game_status_history IS 'Historique des changements de statut des parties';

-- Table: player_presence (session management)
CREATE TABLE public.player_presence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    last_seen timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    session_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: cagnotte_transactions (financial audit)
CREATE TABLE public.cagnotte_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
    transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['add', 'subtract', 'set', 'reset'])),
    amount_cents integer NOT NULL,
    previous_amount_cents integer NOT NULL,
    new_amount_cents integer NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- =================================================================
--  INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX idx_games_join_code ON public.games(join_code);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_players_game_id ON public.players(game_id);
CREATE INDEX idx_teams_game_id ON public.teams(game_id);
CREATE INDEX idx_game_bars_game_id ON public.game_bars(game_id);
CREATE INDEX idx_game_bars_location ON public.game_bars(latitude, longitude);
CREATE INDEX idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX idx_messages_game_id ON public.messages(game_id);
CREATE INDEX idx_challenge_submissions_game_id ON public.challenge_submissions(game_id);

-- =================================================================
--  ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_presence ENABLE ROW LEVEL SECURITY;

-- Public read access for core tables
CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public read access to challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Allow public read access to game bars" ON public.game_bars FOR SELECT USING (true);

-- Allow anonymous users to create players and teams
CREATE POLICY "Allow all users to create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to create teams" ON public.teams FOR INSERT WITH CHECK (true);

-- Allow updates for game participants
CREATE POLICY "Players can view players in the same game" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players can view teams in the same game" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow updates to players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Allow updates to teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Allow updates to games" ON public.games FOR UPDATE USING (true);

-- Messages and events
CREATE POLICY "Allow reading messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow creating messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow reading game events" ON public.game_events FOR SELECT USING (true);

-- Challenge submissions
CREATE POLICY "Allow reading challenge submissions" ON public.challenge_submissions FOR SELECT USING (true);
CREATE POLICY "Allow creating challenge submissions" ON public.challenge_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow updating challenge submissions" ON public.challenge_submissions FOR UPDATE USING (true);

-- =================================================================
--  CORE FUNCTIONS
-- =================================================================

-- Function: update_game_status
CREATE OR REPLACE FUNCTION public.update_game_status(game_id uuid, new_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  game_record record;
  updated_game record;
  old_status text;
BEGIN
  -- Check if game exists
  SELECT * INTO game_record FROM public.games WHERE id = game_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partie non trouvée avec l''ID: %', game_id;
  END IF;
  
  old_status := game_record.status;
  
  -- Validate new status
  IF new_status NOT IN ('lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled') THEN
    RAISE EXCEPTION 'Statut invalide: %. Les statuts valides sont: lobby, in_progress, chicken_hidden, finished, cancelled', new_status;
  END IF;
  
  -- Check chicken team is set for game start
  IF (new_status = 'in_progress' OR new_status = 'chicken_hidden') AND game_record.chicken_team_id IS NULL THEN
    RAISE EXCEPTION 'L''équipe poulet n''est pas définie pour cette partie';
  END IF;
  
  -- Update status
  UPDATE public.games
  SET 
    status = new_status,
    updated_at = NOW(),
    started_at = CASE WHEN new_status = 'in_progress' AND started_at IS NULL THEN NOW() ELSE started_at END,
    chicken_hidden_at = CASE WHEN new_status = 'chicken_hidden' AND chicken_hidden_at IS NULL THEN NOW() ELSE chicken_hidden_at END
  WHERE id = game_id
  RETURNING * INTO updated_game;
  
  -- Log status change
  INSERT INTO public.game_status_history (
    game_id, old_status, new_status, metadata
  ) VALUES (
    game_id, old_status, new_status,
    jsonb_build_object(
      'chicken_team_id', updated_game.chicken_team_id,
      'started_at', updated_game.started_at,
      'chicken_hidden_at', updated_game.chicken_hidden_at
    )
  );
  
  -- Create game event
  INSERT INTO public.game_events (game_id, event_type, event_data) VALUES (
    game_id, 'status_change',
    jsonb_build_object(
      'status', new_status,
      'message', CASE 
        WHEN new_status = 'in_progress' THEN 'La partie a commencé!'
        WHEN new_status = 'chicken_hidden' THEN 'Le poulet est caché! La chasse est lancée!'
        WHEN new_status = 'finished' THEN 'La partie est terminée!'
        WHEN new_status = 'cancelled' THEN 'La partie a été annulée!'
        ELSE 'Le statut de la partie a changé!'
      END
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'game_id', updated_game.id,
    'old_status', old_status,
    'new_status', updated_game.status,
    'started_at', updated_game.started_at,
    'chicken_hidden_at', updated_game.chicken_hidden_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_game_status(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_game_status(uuid, text) TO authenticated;

-- =================================================================
--  REALTIME SUBSCRIPTIONS
-- =================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_bars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;