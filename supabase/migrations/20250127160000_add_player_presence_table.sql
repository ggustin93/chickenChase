-- Add player presence tracking table for real-time detection of lobby joiners/leavers
CREATE TABLE IF NOT EXISTS player_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one presence record per player per game
    UNIQUE(player_id, game_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_presence_game_id ON player_presence(game_id);
CREATE INDEX IF NOT EXISTS idx_player_presence_active ON player_presence(game_id, is_active);
CREATE INDEX IF NOT EXISTS idx_player_presence_last_seen ON player_presence(last_seen);

-- Enable RLS
ALTER TABLE player_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Players can manage their own presence" ON player_presence
    FOR ALL USING (
        player_id IN (
            SELECT id FROM players 
            WHERE id = auth.uid()::uuid 
            OR game_id IN (
                SELECT game_id FROM players WHERE id = auth.uid()::uuid
            )
        )
    );

-- Allow reading presence for players in the same game
CREATE POLICY "Players can see presence in their game" ON player_presence
    FOR SELECT USING (
        game_id IN (
            SELECT game_id FROM players WHERE id = auth.uid()::uuid
        )
    );

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_player_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS trigger_update_player_presence_updated_at ON player_presence;
CREATE TRIGGER trigger_update_player_presence_updated_at
    BEFORE UPDATE ON player_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_player_presence_updated_at();

-- Function to cleanup inactive players
CREATE OR REPLACE FUNCTION cleanup_inactive_players(game_uuid UUID, timeout_seconds INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    cutoff_time TIMESTAMP WITH TIME ZONE;
    inactive_count INTEGER;
BEGIN
    cutoff_time := NOW() - INTERVAL '1 second' * timeout_seconds;
    
    -- Remove players from teams if they're inactive
    UPDATE players 
    SET team_id = NULL 
    WHERE game_id = game_uuid 
    AND id IN (
        SELECT player_id 
        FROM player_presence 
        WHERE game_id = game_uuid 
        AND (last_seen < cutoff_time OR is_active = false)
    );
    
    -- Delete inactive presence records
    DELETE FROM player_presence 
    WHERE game_id = game_uuid 
    AND (last_seen < cutoff_time OR is_active = false);
    
    GET DIAGNOSTICS inactive_count = ROW_COUNT;
    
    RETURN inactive_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON player_presence TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_players TO authenticated;