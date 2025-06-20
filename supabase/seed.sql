-- supabase/seed.sql
-- Insère des données de test.
-- Version modifiée pour éviter RETURNING INTO (pour compatibilité éditeur SQL Supabase)
-- Important: Remplace '<your-auth-user-id>' par un vrai UUID d'utilisateur de ta table auth.users

-- 1. Crée un profil pour un utilisateur existant (remplace l'UUID)
INSERT INTO public.profiles (id, profile_info)
VALUES ('<your-auth-user-id>', '{"username": "AdminTestUser"}')
ON CONFLICT (id) DO NOTHING;

-- Optionnel: Crée un deuxième profil pour un autre utilisateur test
-- INSERT INTO public.profiles (id, profile_info)
-- VALUES ('<another-auth-user-id>', '{"username": "PlayerTestUser"}')
-- ON CONFLICT (id) DO NOTHING;

-- Définir les UUIDs pour la partie et les équipes (pour éviter RETURNING INTO)
-- Tu peux utiliser gen_random_uuid() dans l'éditeur SQL si tu préfères des ID uniques à chaque run,
-- mais pour un seed script prévisible, les fixer est plus simple.
-- Notons les IDs:
-- Game ID: a1b2c3d4-e5f6-7890-1234-567890abcdef
-- Team 1 ID: team-1111-1111-1111-111111111111
-- Team 2 ID: team-2222-2222-2222-222222222222

-- 2. Crée une partie de test avec un ID fixe
INSERT INTO public.games (id, settings, status, cagnotte_initiale, cagnotte_remaining)
VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', '{"zone_coords": "...", "max_teams": 5}', 'pending', 500.00, 500.00)
ON CONFLICT (id) DO NOTHING; -- Évite les erreurs si tu relances le script

-- 3. Crée deux équipes pour cette partie avec des IDs fixes
INSERT INTO public.teams (id, game_id, name, user_ids)
VALUES 
  ('team-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Les Poulets Fous', ARRAY['<your-auth-user-id>'::uuid]), -- L'admin est dans la première équipe
  ('team-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Les Renards Rusés', ARRAY[]::uuid[]) -- Deuxième équipe vide
ON CONFLICT (id) DO NOTHING; -- Évite les erreurs si tu relances le script

-- 4. Attribue un rôle de poulet à la première équipe (en utilisant les IDs fixes)
UPDATE public.games 
SET chicken_team_id = 'team-1111-1111-1111-111111111111' 
WHERE id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

-- 5. Crée des participants liant les profils aux équipes et au jeu (en utilisant les IDs fixes)
INSERT INTO public.participants (user_id, game_id, team_id, role)
VALUES 
  ('<your-auth-user-id>', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'team-1111-1111-1111-111111111111', 'admin') -- L'admin dans l'équipe 1
ON CONFLICT (user_id, game_id) DO NOTHING; -- Évite les erreurs si tu relances

-- Ajoute d'autres participants si tu as créé d'autres profils/équipes
-- INSERT INTO public.participants (user_id, game_id, team_id, role)
-- VALUES ('<another-auth-user-id>', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'team-2222-2222-2222-222222222222', 'hunter')
-- ON CONFLICT (user_id, game_id) DO NOTHING;

-- Optionnel: Ajoute une visite test pour l'équipe 1 (en utilisant ID fixe)
-- INSERT INTO public.visits (team_id, game_id, bar_name, location, status)
-- VALUES ('team-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Le Perchoir', ST_SetSRID(ST_MakePoint(2.3522, 48.8566), 4326), 'gps_validated');

-- Optionnel: Ajoute un défi test soumis par l'équipe 2 (en utilisant ID fixe)
-- INSERT INTO public.challenges (game_id, team_id, custom_title, custom_description, custom_points, status)
-- VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'team-2222-2222-2222-222222222222', 'Selfie avec un chat', 'Trouver un chat et prendre un selfie.', 50, 'pending_validation');

-- Optionnel: Ajoute un message test global (en utilisant ID fixe)
-- INSERT INTO public.messages (game_id, user_id, content)
-- VALUES ('a1b2c3d4-e5f6-7890-1234-567890abcdef', '<your-auth-user-id>', 'Que la chasse commence !'); 