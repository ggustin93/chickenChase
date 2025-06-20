-- =================================================================
--  Migration de Correction : Assurer la génération d'UUID pour les joueurs
-- =================================================================
--  Cette migration corrige un problème où la colonne `id` de la table
--  `players` ne générait plus de valeur par défaut.
--
--  Auteur: Pwablo & Gemini
--  Date: 20/06/2025
-- =================================================================

ALTER TABLE public.players
ALTER COLUMN id SET DEFAULT gen_random_uuid(); 