-- =================================================================
--  Migration : Ajout d'une contrainte d'unicité sur players
-- =================================================================
--  Cette migration ajoute une contrainte d'unicité explicite sur la table
--  players pour la combinaison game_id et nickname afin d'éviter
--  les doublons de pseudos dans une même partie.
--
--  Auteur: Pwablo & Claude
--  Date: 20/06/2025
-- =================================================================

-- Vérifier si la table players existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'players'
  ) THEN
    -- Ajouter la contrainte d'unicité
    ALTER TABLE public.players
    ADD CONSTRAINT players_game_id_nickname_unique UNIQUE (game_id, nickname);
  ELSE
    RAISE EXCEPTION 'La table players n''existe pas!';
  END IF;
END
$$; 