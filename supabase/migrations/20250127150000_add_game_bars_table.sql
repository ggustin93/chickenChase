-- =================================================================
--  Migration : Ajout de la table game_bars pour stocker les bars à visiter
-- =================================================================
--  Cette migration ajoute une table pour stocker les bars importés
--  depuis Google Maps pour chaque partie
--
--  Auteur: Claude
--  Date: 27/01/2025
-- =================================================================

-- Table game_bars pour stocker les bars à visiter dans chaque partie
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
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(game_id, name, address)
);

COMMENT ON TABLE public.game_bars IS 'Bars à visiter pour chaque partie, importés depuis Google Maps';
COMMENT ON COLUMN public.game_bars.visited IS 'Indique si ce bar a été visité pendant la partie';
COMMENT ON COLUMN public.game_bars.visited_by_team_id IS 'Équipe qui a visité ce bar en premier';
COMMENT ON COLUMN public.game_bars.rating IS 'Note Google Maps du bar (sur 5)';

-- Index pour améliorer les performances
CREATE INDEX idx_game_bars_game_id ON public.game_bars(game_id);
CREATE INDEX idx_game_bars_visited ON public.game_bars(game_id, visited);
CREATE INDEX idx_game_bars_location ON public.game_bars(latitude, longitude);

-- Fonction pour importer des bars dans une partie
CREATE OR REPLACE FUNCTION public.import_bars_to_game(
    p_game_id uuid,
    p_bars jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bar jsonb;
    v_count integer := 0;
BEGIN
    -- Vérifier que le jeu existe et est en lobby
    IF NOT EXISTS (
        SELECT 1 FROM public.games 
        WHERE id = p_game_id 
        AND status = 'lobby'
    ) THEN
        RAISE EXCEPTION 'Game not found or not in lobby status';
    END IF;

    -- Supprimer les bars existants pour ce jeu (au cas où)
    DELETE FROM public.game_bars WHERE game_id = p_game_id;

    -- Insérer chaque bar
    FOR v_bar IN SELECT * FROM jsonb_array_elements(p_bars)
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
            rating
        ) VALUES (
            p_game_id,
            v_bar->>'name',
            v_bar->>'address',
            v_bar->>'description',
            (v_bar->>'latitude')::double precision,
            (v_bar->>'longitude')::double precision,
            v_bar->>'photoUrl',
            v_bar->>'placeId',
            CASE 
                WHEN v_bar->>'rating' IS NOT NULL 
                THEN (v_bar->>'rating')::numeric(2,1)
                ELSE NULL
            END
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.import_bars_to_game IS 'Importe une liste de bars depuis un JSON pour une partie donnée';

-- Fonction pour marquer un bar comme visité
CREATE OR REPLACE FUNCTION public.mark_bar_as_visited(
    p_game_id uuid,
    p_bar_id uuid,
    p_team_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier que le bar n'a pas déjà été visité
    IF EXISTS (
        SELECT 1 FROM public.game_bars 
        WHERE id = p_bar_id 
        AND game_id = p_game_id 
        AND visited = true
    ) THEN
        RETURN false;
    END IF;

    -- Marquer le bar comme visité
    UPDATE public.game_bars 
    SET 
        visited = true,
        visited_by_team_id = p_team_id,
        visited_at = now()
    WHERE id = p_bar_id 
    AND game_id = p_game_id;

    -- Incrémenter le compteur de bars visités pour l'équipe
    UPDATE public.teams 
    SET bars_visited = bars_visited + 1
    WHERE id = p_team_id;

    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.mark_bar_as_visited IS 'Marque un bar comme visité par une équipe';

-- Activer RLS (Row Level Security) pour la table
ALTER TABLE public.game_bars ENABLE ROW LEVEL SECURITY;

-- Politique RLS : tous les joueurs d'une partie peuvent voir les bars
CREATE POLICY "Players can view game bars" ON public.game_bars
    FOR SELECT
    USING (
        game_id IN (
            SELECT game_id FROM public.players 
            WHERE id = auth.uid()::uuid
        )
    );

-- Politique RLS : seul l'hôte peut importer des bars (via la fonction)
-- L'import se fait via la fonction qui a SECURITY DEFINER