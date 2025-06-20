-- =================================================================
--  Première migration : Création de la fonction create_game_and_host
-- =================================================================
--  Cette fonction gère la création d'une partie et de son hôte
--  en une seule transaction atomique et sécurisée.
--
--  Auteur: Pwablo & Gemini
--  Date: 20/06/2025
-- =================================================================

-- D'abord, on supprime l'ancienne fonction pour éviter tout conflit
DROP FUNCTION IF EXISTS public.create_game_and_host(text);

-- Ensuite, on crée la nouvelle version, plus robuste, qui retourne du JSON
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

-- Finalement, on ré-accorde la permission d'exécution au rôle anonyme
GRANT EXECUTE ON FUNCTION public.create_game_and_host(text) TO anon; 