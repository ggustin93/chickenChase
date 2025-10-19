-- Drop existing update_game_status functions to resolve overloading
DROP FUNCTION IF EXISTS update_game_status(text, text);
DROP FUNCTION IF EXISTS update_game_status(text, text, text, jsonb);

-- Create a single update_game_status function with optional parameters
CREATE OR REPLACE FUNCTION update_game_status(
  game_id text,
  new_status text,
  changed_by text DEFAULT NULL,
  metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  game_record games%ROWTYPE;
BEGIN
  -- Check if game exists
  SELECT * INTO game_record
  FROM games
  WHERE id = game_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Game not found',
      'game_id', game_id
    );
  END IF;
  
  -- Update the game status
  UPDATE games 
  SET 
    status = new_status,
    updated_at = now(),
    -- Set chicken_hidden_at if status is chicken_hidden
    chicken_hidden_at = CASE 
      WHEN new_status = 'chicken_hidden' THEN now()
      ELSE chicken_hidden_at
    END,
    -- Set started_at if status is in_progress
    started_at = CASE 
      WHEN new_status = 'in_progress' THEN COALESCE(started_at, now())
      ELSE started_at
    END
  WHERE id = game_id;
  
  -- Log the change if changed_by is provided
  IF changed_by IS NOT NULL THEN
    INSERT INTO game_events (game_id, event_type, event_data, created_at)
    VALUES (
      game_id,
      'status_changed',
      jsonb_build_object(
        'from_status', game_record.status,
        'to_status', new_status,
        'changed_by', changed_by,
        'metadata', COALESCE(metadata, '{}'::jsonb),
        'timestamp', now()
      ),
      now()
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'game_id', game_id,
    'old_status', game_record.status,
    'new_status', new_status,
    'timestamp', now()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'game_id', game_id
    );
END;
$$;
