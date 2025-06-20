CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- Enable PostGIS extension if not already enabled (usually is on Supabase)
-- CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Profiles table to store public user information linked to auth.users
CREATE TABLE profiles (
  id uuid references auth.users not null primary key,
  profile_info jsonb null
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Games table
CREATE TABLE games (
  id uuid primary key default gen_random_uuid(),
  settings jsonb null,
  status text null, -- e.g., 'pending', 'in_progress', 'finished'
  chicken_team_id uuid null, -- FK added later after teams table exists
  created_at timestamp with time zone not null default now(),
  cagnotte_initiale numeric null,
  cagnotte_remaining numeric null
);
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  user_ids uuid[] null, -- Array of profile IDs (references profiles.id)
  name text null,
  avatar_url text null,
  score integer not null default 0,
  bars_visited_count integer not null default 0,
  found_chicken_at timestamp with time zone null,
  found_order integer null
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Add the foreign key constraint from games to teams now that teams exists
ALTER TABLE games ADD CONSTRAINT fk_chicken_team FOREIGN KEY (chicken_team_id) REFERENCES teams(id);

-- Participants table linking users (profiles) to teams and games
CREATE TABLE participants (
  id uuid primary key default gen_random_uuid(), -- Added a primary key for potential direct reference
  user_id uuid not null references profiles(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  role text not null, -- e.g., 'chicken', 'hunter', 'admin'
  unique(user_id, game_id) -- A user can only be in one team per game
);
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Visits table
CREATE TABLE visits (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  bar_name text null,
  location geometry(Point, 4326) not null,
  validation_photo_url text null,
  status text not null default 'pending_gps_check', -- 'pending_gps_check', 'gps_validated', 'pending_photo_validation', 'photo_validated', 'photo_rejected'
  created_at timestamp with time zone not null default now(),
  validated_at timestamp with time zone null
);
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
-- Optional: Add a spatial index for faster location queries
-- CREATE INDEX visits_location_idx ON visits USING GIST (location);

-- Challenges table
CREATE TABLE challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  challenge_def_id uuid null, -- FK to potential CMS table, or null if custom
  custom_title text null,
  custom_description text null,
  custom_points integer null,
  custom_proof_type text null, -- e.g., 'photo'
  status text not null default 'pending_submission', -- 'pending_submission', 'pending_validation', 'approved', 'rejected'
  proof_photo_url text null,
  submitted_at timestamp with time zone null,
  validated_at timestamp with time zone null
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE messages (
  id bigserial primary key, -- Using bigserial for ordered message IDs
  game_id uuid not null references games(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid null references teams(id) on delete cascade, -- Nullable for global/admin messages
  content text not null,
  timestamp timestamp with time zone not null default now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Partner Bars table (Optional)
CREATE TABLE partner_bars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text null,
  coords geometry(Point, 4326) null,
  description text null,
  logo_url text null,
  offers jsonb null
);
ALTER TABLE partner_bars ENABLE ROW LEVEL SECURITY;
-- Optional: Add a spatial index
-- CREATE INDEX partner_bars_coords_idx ON partner_bars USING GIST (coords);
