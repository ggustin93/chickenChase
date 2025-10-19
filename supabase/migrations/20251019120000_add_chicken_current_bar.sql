-- Add chicken current bar tracking to games table
-- This stores which bar the chicken is currently hiding at

ALTER TABLE public.games 
ADD COLUMN chicken_current_bar_id uuid,
ADD CONSTRAINT games_chicken_current_bar_id_fkey 
    FOREIGN KEY (chicken_current_bar_id) 
    REFERENCES public.game_bars (id) 
    ON DELETE SET NULL;

COMMENT ON COLUMN public.games.chicken_current_bar_id IS 'ID du bar où le poulet se cache actuellement';

-- Create index for performance
CREATE INDEX idx_games_chicken_current_bar ON public.games(chicken_current_bar_id);