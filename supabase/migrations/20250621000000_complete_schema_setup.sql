-- =================================================================
--  Migration : Recréation complète des tables de l'application
-- =================================================================
--  Cette migration supprime et recrée toutes les tables de l'application
--  avec la structure correcte et les contraintes appropriées.
--
--  Auteur: Claude
--  Date: 21/06/2025
-- =================================================================

-- Supprimer d'abord toutes les tables (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS public.game_status_history CASCADE;
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.challenge_submissions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.update_game_status(uuid, text);
DROP FUNCTION IF EXISTS public.update_chicken_hidden_status(uuid);
DROP FUNCTION IF EXISTS public.create_game_and_host(text);
DROP FUNCTION IF EXISTS public.log_game_status_change();

-- Recréer les tables dans l'ordre des dépendances

-- Table games (table principale)
CREATE TABLE public.games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    join_code varchar NOT NULL,
    status text NOT NULL DEFAULT 'lobby' CHECK (status = ANY (ARRAY['lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled'])),
    host_player_id uuid,
    chicken_team_id uuid,
    cagnotte_initial integer NOT NULL,
    cagnotte_current integer NOT NULL,
    chicken_hidden_at timestamptz
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
    points integer NOT NULL,
    type text NOT NULL,
    correct_answer text
);

COMMENT ON TABLE public.challenges IS 'Défis disponibles dans le jeu';

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
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    nickname text NOT NULL,
    UNIQUE(game_id, nickname)
);

COMMENT ON TABLE public.players IS 'Joueurs participant à une partie';

-- Mettre à jour les références croisées
ALTER TABLE public.games ADD CONSTRAINT games_host_player_id_fkey 
    FOREIGN KEY (host_player_id) REFERENCES public.players(id) ON DELETE SET NULL;
    
ALTER TABLE public.games ADD CONSTRAINT games_chicken_team_id_fkey 
    FOREIGN KEY (chicken_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

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

-- Activer RLS sur toutes les tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_status_history ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS pour permettre l'accès anonyme
CREATE POLICY games_policy ON public.games FOR ALL TO anon, authenticated USING (true);
CREATE POLICY challenges_policy ON public.challenges FOR ALL TO anon, authenticated USING (true);
CREATE POLICY teams_policy ON public.teams FOR ALL TO anon, authenticated USING (true);
CREATE POLICY players_policy ON public.players FOR ALL TO anon, authenticated USING (true);
CREATE POLICY messages_policy ON public.messages FOR ALL TO anon, authenticated USING (true);
CREATE POLICY challenge_submissions_policy ON public.challenge_submissions FOR ALL TO anon, authenticated USING (true);
CREATE POLICY game_events_policy ON public.game_events FOR ALL TO anon, authenticated USING (true);
CREATE POLICY game_status_history_policy ON public.game_status_history FOR ALL TO anon, authenticated USING (true);

-- Activer les publications pour les notifications en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_events;

-- =================================================================
--  Fonction : create_game_and_host
-- =================================================================
CREATE OR REPLACE FUNCTION public.create_game_and_host(host_nickname text default 'Hôte')
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
  -- 1. Génère un code de partie unique et facile à lire (sans O, I, 0, 1)
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
      RAISE EXCEPTION 'Impossible de générer un code de partie unique.';
    END IF;
  END LOOP;

  -- 2. Crée la partie
  INSERT INTO public.games (join_code, cagnotte_initial, cagnotte_current)
  VALUES (new_join_code, 5000, 5000)
  RETURNING id INTO new_game_id;

  -- 3. Crée le joueur Hôte
  INSERT INTO public.players (game_id, nickname)
  VALUES (new_game_id, host_nickname)
  RETURNING id INTO new_player_id;

  -- 4. Lie l'hôte à la partie
  UPDATE public.games
  SET host_player_id = new_player_id
  WHERE id = new_game_id;

  -- 5. Retourne toutes les informations dans un seul objet JSON propre
  RETURN json_build_object(
    'game_id', new_game_id,
    'player_id', new_player_id,
    'join_code', new_join_code
  );
END;
$$;

-- Accorder les permissions d'exécution
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