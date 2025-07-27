-- =================================================================
--  Migration : Ajout des colonnes de configuration pour les parties
-- =================================================================
--  Cette migration ajoute les colonnes nécessaires pour la configuration
--  des parties en mode Wooclap (max_teams, game_duration, started_at)
--
--  Auteur: Claude Code SuperClaude
--  Date: 27/01/2025
-- =================================================================

-- Ajouter les nouvelles colonnes à la table games
ALTER TABLE public.games 
  ADD COLUMN IF NOT EXISTS max_teams integer,
  ADD COLUMN IF NOT EXISTS game_duration integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Ajouter des commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.games.max_teams IS 'Limite maximale d\équipes autorisées (NULL = illimité)';
COMMENT ON COLUMN public.games.game_duration IS 'Durée de la partie en minutes (par défaut: 120 min)';
COMMENT ON COLUMN public.games.started_at IS 'Timestamp when the game was actually started (status changed to in_progress)';

-- Ajouter des contraintes de validation
ALTER TABLE public.games 
  ADD CONSTRAINT check_max_teams_positive CHECK (max_teams IS NULL OR max_teams > 0),
  ADD CONSTRAINT check_game_duration_positive CHECK (game_duration > 0);

-- Créer des index pour améliorer les performances des requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_games_max_teams ON public.games(max_teams) WHERE max_teams IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_duration ON public.games(game_duration);
CREATE INDEX IF NOT EXISTS idx_games_started_at ON public.games(started_at) WHERE started_at IS NOT NULL;

-- Mettre à jour les parties existantes avec les valeurs par défaut
UPDATE public.games 
SET 
  game_duration = 120,
  started_at = CASE 
    WHEN status IN ('in_progress', 'chicken_hidden', 'finished') THEN updated_at 
    ELSE NULL 
  END
WHERE game_duration IS NULL;

-- =================================================================
--  Fonction améliorée : create_game_and_host
-- =================================================================
CREATE OR REPLACE FUNCTION public.create_game_and_host(
  host_nickname text DEFAULT 'Hôte',
  cagnotte_initial integer DEFAULT 5000,  -- En centimes (50€)
  max_teams integer DEFAULT NULL,
  game_duration integer DEFAULT 120       -- En minutes
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
  -- 1. Validation des paramètres d'entrée
  IF host_nickname IS NULL OR trim(host_nickname) = '' THEN
    RAISE EXCEPTION 'Le pseudo de l\hôte ne peut pas être vide';
  END IF;
  
  IF cagnotte_initial < 0 THEN
    RAISE EXCEPTION 'La cagnotte initiale ne peut pas être négative';
  END IF;
  
  IF max_teams IS NOT NULL AND max_teams <= 0 THEN
    RAISE EXCEPTION 'Le nombre maximum d\équipes doit être positif';
  END IF;
  
  IF game_duration <= 0 THEN
    RAISE EXCEPTION 'La durée de la partie doit être positive';
  END IF;

  -- 2. Génère un code de partie unique et facile à lire (sans O, I, 0, 1)
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
      RAISE EXCEPTION 'Impossible de générer un code de partie unique après 10 tentatives';
    END IF;
  END LOOP;

  -- 3. Crée la partie avec les nouveaux paramètres
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

  -- 4. Crée le joueur Hôte avec pseudo personnalisé
  INSERT INTO public.players (game_id, nickname)
  VALUES (new_game_id, trim(host_nickname))
  RETURNING id INTO new_player_id;

  -- 5. Lie l'hôte à la partie
  UPDATE public.games
  SET host_player_id = new_player_id
  WHERE id = new_game_id;

  -- 6. Crée un événement de création de partie
  INSERT INTO public.game_events (
    game_id,
    event_type,
    event_data
  ) VALUES (
    new_game_id,
    'game_created',
    jsonb_build_object(
      'host_nickname', trim(host_nickname),
      'cagnotte_initial', cagnotte_initial,
      'max_teams', max_teams,
      'game_duration', game_duration,
      'join_code', new_join_code
    )
  );

  -- 7. Retourne toutes les informations dans un seul objet JSON propre
  RETURN json_build_object(
    'success', true,
    'game_id', new_game_id,
    'player_id', new_player_id,
    'join_code', new_join_code,
    'host_nickname', trim(host_nickname),
    'cagnotte_initial', cagnotte_initial,
    'max_teams', max_teams,
    'game_duration', game_duration
  );
END;
$$;

-- Maintenir la compatibilité avec l'ancienne signature
CREATE OR REPLACE FUNCTION public.create_game_and_host(host_nickname text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.create_game_and_host(host_nickname, 5000, NULL, 120);
END;
$$;

-- Accorder les permissions d'exécution pour toutes les signatures
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text, integer, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text) TO authenticated;

-- =================================================================
--  Amélioration de la fonction update_game_status
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
  
  -- 4. Mettre à jour le statut avec started_at si nécessaire
  UPDATE public.games
  SET 
    status = new_status,
    updated_at = NOW(),
    -- Mettre à jour started_at quand la partie commence réellement
    started_at = CASE 
      WHEN new_status = 'in_progress' AND old_status = 'lobby' THEN NOW() 
      ELSE started_at 
    END,
    -- Mettre à jour chicken_hidden_at uniquement si on passe à chicken_hidden
    chicken_hidden_at = CASE 
      WHEN new_status = 'chicken_hidden' THEN NOW() 
      ELSE chicken_hidden_at 
    END
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
      'chicken_hidden_at', updated_game.chicken_hidden_at,
      'started_at', updated_game.started_at,
      'max_teams', updated_game.max_teams,
      'game_duration', updated_game.game_duration
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
      'old_status', old_status,
      'started_at', updated_game.started_at,
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
    'started_at', updated_game.started_at,
    'chicken_hidden_at', updated_game.chicken_hidden_at
  );
END;
$$;