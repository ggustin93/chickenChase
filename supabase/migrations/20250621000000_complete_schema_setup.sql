-- =================================================================
--  Migration : Complete Database Schema Setup for Chicken Chase
-- =================================================================
--  This migration creates a complete, clean database schema for the
--  Chicken Chase application with all tables, constraints, and functions.
--
--  Author: Claude Code Assistant
--  Date: 27/07/2025
--  Version: 2.0
-- =================================================================

-- =================================================================
--  CLEAN-UP: Remove all existing data and schema
-- =================================================================

-- Remove all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.game_bars CASCADE;
DROP TABLE IF EXISTS public.game_status_history CASCADE;
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.challenge_submissions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Remove all existing functions
DROP FUNCTION IF EXISTS public.update_game_status(uuid, text);
DROP FUNCTION IF EXISTS public.update_chicken_hidden_status(uuid);
DROP FUNCTION IF EXISTS public.create_game_and_host(text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.create_game_and_host(text);
DROP FUNCTION IF EXISTS public.import_bars_to_game(uuid, jsonb);
DROP FUNCTION IF EXISTS public.mark_bar_as_visited(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.log_game_status_change();

-- Remove RLS policies
DROP POLICY IF EXISTS "Allow public read access to games" ON public.games;
DROP POLICY IF EXISTS "Allow public read access to challenges" ON public.challenges;
DROP POLICY IF EXISTS "Allow public read access to game bars" ON public.game_bars;
DROP POLICY IF EXISTS "Allow all users to create players" ON public.players;
DROP POLICY IF EXISTS "Allow all users to create teams" ON public.teams;
DROP POLICY IF EXISTS "Players can view players in the same game" ON public.players;
DROP POLICY IF EXISTS "Players can view teams in the same game" ON public.teams;
DROP POLICY IF EXISTS "Players can update their own player data" ON public.players;
DROP POLICY IF EXISTS "Players can update their own team" ON public.teams;
DROP POLICY IF EXISTS "Host can update their game" ON public.games;
DROP POLICY IF EXISTS "Players can view messages in their game" ON public.messages;
DROP POLICY IF EXISTS "Players can view game bars" ON public.game_bars;

-- =================================================================
--  SCHEMA CREATION: Create all tables in dependency order
-- =================================================================

-- Table games (main table)
CREATE TABLE public.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    join_code varchar NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'lobby' CHECK (status = ANY (ARRAY['lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled'])),
    host_player_id uuid,
    chicken_team_id uuid,
    cagnotte_initial integer NOT NULL DEFAULT 5000,
    cagnotte_current integer NOT NULL DEFAULT 5000,
    chicken_hidden_at timestamptz,
    max_teams integer,
    game_duration integer DEFAULT 120,
    started_at timestamptz
);

COMMENT ON TABLE public.games IS 'Table principale des parties de jeu';
COMMENT ON COLUMN public.games.status IS 'État du jeu: lobby (en attente), in_progress (partie commencée), chicken_hidden (poulet caché), finished (terminé), cancelled (annulé)';
COMMENT ON COLUMN public.games.cagnotte_initial IS 'Stored in cents';
COMMENT ON COLUMN public.games.cagnotte_current IS 'Stored in cents';
COMMENT ON COLUMN public.games.chicken_hidden_at IS 'Timestamp when the chicken was hidden and the hunt officially started';

-- Table challenges
CREATE TABLE public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    points integer NOT NULL DEFAULT 10,
    type text NOT NULL CHECK (type = ANY (ARRAY['photo', 'unlock', 'location', 'quiz'])),
    correct_answer text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.challenges IS 'Défis disponibles dans le jeu';
COMMENT ON COLUMN public.challenges.type IS 'Type de défi: photo, unlock, location, quiz';

-- Table game_bars (bars in a specific game)
CREATE TABLE public.game_bars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text NOT NULL,
    description text,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    photo_url text,
    google_place_id text,
    rating numeric(2,1),
    visited boolean DEFAULT false,
    visited_by_team_id uuid,
    visited_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_bars IS 'Bars associés à une partie spécifique';
COMMENT ON COLUMN public.game_bars.latitude IS 'Latitude (7 decimal places for ~1cm precision)';
COMMENT ON COLUMN public.game_bars.longitude IS 'Longitude (7 decimal places for ~1cm precision)';
COMMENT ON COLUMN public.game_bars.rating IS 'Rating from 0.0 to 5.0';

-- Add indexes for performance
CREATE INDEX idx_game_bars_game_id ON public.game_bars(game_id);
CREATE INDEX idx_game_bars_location ON public.game_bars(latitude, longitude);
CREATE INDEX idx_game_bars_visited ON public.game_bars(visited, game_id);

-- Table teams
CREATE TABLE public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    name text NOT NULL,
    score integer NOT NULL DEFAULT 0,
    bars_visited integer NOT NULL DEFAULT 0,
    challenges_completed integer NOT NULL DEFAULT 0,
    found_chicken boolean NOT NULL DEFAULT false,
    is_chicken_team boolean DEFAULT false,
    UNIQUE(game_id, name)
);

COMMENT ON TABLE public.teams IS 'Équipes participant à une partie';

-- Table players
CREATE TABLE public.players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    nickname text NOT NULL,
    UNIQUE(game_id, nickname),
    UNIQUE(game_id, user_id)
);

COMMENT ON TABLE public.players IS 'Joueurs participant à une partie';

-- Update cross-references
ALTER TABLE public.games ADD CONSTRAINT games_host_player_id_fkey 
    FOREIGN KEY (host_player_id) REFERENCES public.players(id) ON DELETE SET NULL;
    
ALTER TABLE public.games ADD CONSTRAINT games_chicken_team_id_fkey 
    FOREIGN KEY (chicken_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Update game_bars foreign key for visited_by_team_id
ALTER TABLE public.game_bars ADD CONSTRAINT game_bars_visited_by_team_id_fkey 
    FOREIGN KEY (visited_by_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Table messages
CREATE TABLE public.messages (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
    content text NOT NULL,
    is_system_message boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE public.messages IS 'Messages échangés pendant une partie';

-- Table challenge_submissions
CREATE TABLE public.challenge_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    photo_url text,
    submitted_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.challenge_submissions IS 'Soumissions des défis par les équipes';

-- Table game_events (pour les notifications en temps réel)
CREATE TABLE public.game_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_events IS 'Événements de jeu pour les notifications en temps réel';

-- Table game_status_history (pour l'audit trail)
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

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_status_history ENABLE ROW LEVEL SECURITY;

-- =================================================================
--  ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Create comprehensive RLS policies
-- Public read access for games and challenges (for joining and gameplay)
CREATE POLICY "Allow public read access to games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public read access to challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Allow public read access to game bars" ON public.game_bars FOR SELECT USING (true);

-- Les utilisateurs peuvent insérer des joueurs et des équipes
CREATE POLICY "Allow all users to create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to create teams" ON public.teams FOR INSERT WITH CHECK (true);

-- Les joueurs peuvent voir les autres joueurs et les équipes de la même partie
CREATE POLICY "Players can view players in the same game" ON public.players FOR SELECT to authenticated
  USING (game_id IN (SELECT game_id FROM public.players WHERE user_id = auth.uid()));

CREATE POLICY "Players can view teams in the same game" ON public.teams FOR SELECT to authenticated
  USING (game_id IN (SELECT game_id FROM public.players WHERE user_id = auth.uid()));
  
-- Les joueurs peuvent mettre à jour leur propre personnage (ex: rejoindre une équipe) ou l'équipe qu'ils ont créée
CREATE POLICY "Players can update their own player data" ON public.players FOR UPDATE to authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Players can update their own team" ON public.teams FOR UPDATE to authenticated
  USING (id IN (SELECT team_id FROM public.players WHERE user_id = auth.uid()));
  
-- Seul l'hôte de la partie peut la mettre à jour (ex: démarrer la partie)
CREATE POLICY "Host can update their game" ON public.games FOR UPDATE to authenticated
  USING (host_player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid()));
  
-- Les joueurs peuvent voir les messages de leur partie
CREATE POLICY "Players can view messages in their game" ON public.messages FOR SELECT to authenticated
  USING (game_id IN (SELECT game_id FROM public.players p WHERE user_id = auth.uid()));

-- Activer les publications pour les notifications en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- =================================================================
--  FUNCTION: create_game_and_host
-- =================================================================
CREATE OR REPLACE FUNCTION public.create_game_and_host(
    host_nickname text DEFAULT 'Hôte',
    cagnotte_initial integer DEFAULT 5000,
    max_teams integer DEFAULT NULL,
    game_duration integer DEFAULT 120
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_join_code text;
  new_player_id uuid;
  new_game_id uuid;
  attempts integer := 0;
BEGIN
  -- 1. Generate unique, readable join code (without O, I, 0, 1)
  LOOP
    new_join_code := (
      SELECT string_agg(ch, '')
      FROM (
        SELECT (array['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'])[floor(random() * 32) + 1]
        FROM generate_series(1, 6)
      ) AS a(ch)
    );
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.games g WHERE g.join_code = new_join_code);
    
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique join code.';
    END IF;
  END LOOP;

  -- 2. Create the game
  INSERT INTO public.games (
    join_code, 
    cagnotte_initial, 
    cagnotte_current,
    max_teams,
    game_duration
  )
  VALUES (
    new_join_code, 
    cagnotte_initial, 
    cagnotte_initial,
    max_teams,
    game_duration
  )
  RETURNING id INTO new_game_id;

  -- 3. Create the host player
  INSERT INTO public.players (game_id, nickname)
  VALUES (new_game_id, host_nickname)
  RETURNING id INTO new_player_id;

  -- 4. Link the host to the game
  UPDATE public.games
  SET host_player_id = new_player_id
  WHERE id = new_game_id;

  -- 5. Return all information in a clean JSON object
  RETURN json_build_object(
    'success', true,
    'game_id', new_game_id,
    'player_id', new_player_id,
    'join_code', new_join_code
  );
END;
$$;

-- Grant execution permissions for create_game_and_host
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text, integer, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text) TO authenticated;

-- =================================================================
--  Fonction : update_game_status
-- =================================================================
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
  -- 1. Vérifier que la partie existe et récupérer ses informations
  SELECT * INTO game_record FROM public.games WHERE id = game_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partie non trouvée avec l''ID: %', game_id;
  END IF;
  
  old_status := game_record.status;
  
  -- 2. Vérifier que le nouveau statut est valide
  IF new_status NOT IN ('lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled') THEN
    RAISE EXCEPTION 'Statut invalide: %. Les statuts valides sont: lobby, in_progress, chicken_hidden, finished, cancelled', new_status;
  END IF;
  
  -- 3. Vérifier que chicken_team_id est défini si on passe à in_progress ou chicken_hidden
  IF (new_status = 'in_progress' OR new_status = 'chicken_hidden') AND game_record.chicken_team_id IS NULL THEN
    RAISE EXCEPTION 'L''équipe poulet n''est pas définie pour cette partie';
  END IF;
  
  -- 4. Mettre à jour le statut
  UPDATE public.games
  SET 
    status = new_status,
    updated_at = NOW(),
    -- Mettre à jour chicken_hidden_at uniquement si on passe à chicken_hidden
    chicken_hidden_at = CASE WHEN new_status = 'chicken_hidden' THEN NOW() ELSE chicken_hidden_at END
  WHERE id = game_id
  RETURNING * INTO updated_game;
  
  -- 5. Enregistrer le changement de statut dans l'historique
  INSERT INTO public.game_status_history (
    game_id,
    old_status,
    new_status,
    metadata
  ) VALUES (
    game_id,
    old_status,
    new_status,
    jsonb_build_object(
      'chicken_team_id', updated_game.chicken_team_id,
      'chicken_hidden_at', updated_game.chicken_hidden_at
    )
  );
  
  -- 6. Insérer un événement de notification pour tous les clients
  INSERT INTO public.game_events (
    game_id,
    event_type,
    event_data
  ) VALUES (
    game_id,
    'status_change',
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
  
  -- 7. Retourner les informations mises à jour
  RETURN jsonb_build_object(
    'success', true,
    'game_id', updated_game.id,
    'old_status', old_status,
    'new_status', updated_game.status,
    'chicken_hidden_at', updated_game.chicken_hidden_at
  );
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_game_status(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_game_status(uuid, text) TO authenticated;

-- Maintenir la fonction update_chicken_hidden_status pour la rétrocompatibilité
CREATE OR REPLACE FUNCTION public.update_chicken_hidden_status(game_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appeler simplement la nouvelle fonction update_game_status
  RETURN public.update_game_status(game_id, 'chicken_hidden');
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.update_chicken_hidden_status(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.update_chicken_hidden_status(uuid) TO authenticated; 

-- =================================================================
--  FUNCTION: import_bars_to_game
-- =================================================================
CREATE OR REPLACE FUNCTION public.import_bars_to_game(
    p_game_id uuid,
    p_bars jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bar_record jsonb;
    inserted_count integer := 0;
BEGIN
    -- Iterate through each bar in the jsonb array
    FOR bar_record IN SELECT * FROM jsonb_array_elements(p_bars)
    LOOP
        INSERT INTO public.game_bars (
            game_id,
            name,
            address,
            description,
            latitude,
            longitude,
            photo_url,
            google_place_id,
            rating,
            visited,
            created_at
        ) VALUES (
            p_game_id,
            bar_record->>'name',
            bar_record->>'address',
            COALESCE(bar_record->>'description', ''),
            (bar_record->>'latitude')::numeric,
            (bar_record->>'longitude')::numeric,
            bar_record->>'photo_url',
            bar_record->>'google_place_id',
            CASE WHEN bar_record->>'rating' IS NOT NULL 
                 THEN (bar_record->>'rating')::numeric 
                 ELSE NULL END,
            COALESCE((bar_record->>'visited')::boolean, false),
            COALESCE((bar_record->>'created_at')::timestamptz, now())
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'inserted_count', inserted_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execution permissions for import_bars_to_game
GRANT EXECUTE ON FUNCTION public.import_bars_to_game(uuid, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.import_bars_to_game(uuid, jsonb) TO authenticated;

-- =================================================================
--  FUNCTION: mark_bar_as_visited
-- =================================================================
CREATE OR REPLACE FUNCTION public.mark_bar_as_visited(
    p_game_id uuid,
    p_bar_id uuid,
    p_team_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bar_exists boolean;
    already_visited boolean;
BEGIN
    -- Check if bar exists in this game
    SELECT EXISTS(
        SELECT 1 FROM public.game_bars 
        WHERE id = p_bar_id AND game_id = p_game_id
    ) INTO bar_exists;
    
    IF NOT bar_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bar not found in this game'
        );
    END IF;
    
    -- Check if already visited
    SELECT visited INTO already_visited
    FROM public.game_bars 
    WHERE id = p_bar_id AND game_id = p_game_id;
    
    IF already_visited THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bar already visited'
        );
    END IF;
    
    -- Mark as visited
    UPDATE public.game_bars
    SET 
        visited = true,
        visited_by_team_id = p_team_id,
        visited_at = now()
    WHERE id = p_bar_id AND game_id = p_game_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Bar marked as visited'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execution permissions for mark_bar_as_visited
GRANT EXECUTE ON FUNCTION public.mark_bar_as_visited(uuid, uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_bar_as_visited(uuid, uuid, uuid) TO authenticated;

-- =================================================================
--  REALTIME SUBSCRIPTIONS
-- =================================================================
-- Enable realtime for game_bars table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_bars;

-- =================================================================
--  INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_games_join_code ON public.games(join_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON public.players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_game_id ON public.teams(game_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_game_id ON public.challenge_submissions(game_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_team_id ON public.challenge_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON public.game_events(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_game_id ON public.messages(game_id);

-- Remove obsolete functions
DROP FUNCTION IF EXISTS public.requesting_user_claim(text); 