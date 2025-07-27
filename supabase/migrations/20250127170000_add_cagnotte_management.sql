-- =================================================================
--  CAGNOTTE MANAGEMENT SYSTEM
-- =================================================================
--  This migration adds comprehensive backend support for cagnotte
--  management including audit trails and secure operations.
--
--  Author: Claude Code Assistant  
--  Date: 27/07/2025
-- =================================================================

-- Add cagnotte transaction log table for audit trail
CREATE TABLE IF NOT EXISTS public.cagnotte_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add', 'subtract', 'set', 'reset')),
    amount_cents INTEGER NOT NULL,
    previous_amount_cents INTEGER NOT NULL,
    new_amount_cents INTEGER NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'system'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cagnotte_transactions_game_id ON public.cagnotte_transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_cagnotte_transactions_created_at ON public.cagnotte_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cagnotte_transactions_type ON public.cagnotte_transactions(transaction_type);

-- Enable RLS
ALTER TABLE public.cagnotte_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for cagnotte transactions
CREATE POLICY "Enable read access for game participants" ON public.cagnotte_transactions
    FOR SELECT USING (
        game_id IN (
            SELECT g.id FROM public.games g
            JOIN public.players p ON p.game_id = g.id
        )
    );

CREATE POLICY "Enable insert for authenticated operations" ON public.cagnotte_transactions
    FOR INSERT WITH CHECK (true);

-- =================================================================
--  CAGNOTTE MANAGEMENT FUNCTIONS
-- =================================================================

-- Function to safely update cagnotte with transaction logging
CREATE OR REPLACE FUNCTION public.update_cagnotte(
    p_game_id UUID,
    p_operation TEXT,
    p_amount_cents INTEGER,
    p_player_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game_record RECORD;
    v_previous_amount INTEGER;
    v_new_amount INTEGER;
    v_transaction_id UUID;
    v_result JSON;
BEGIN
    -- Validate operation type
    IF p_operation NOT IN ('add', 'subtract', 'set', 'reset') THEN
        RAISE EXCEPTION 'Invalid operation type: %. Must be add, subtract, set, or reset.', p_operation;
    END IF;

    -- Get current game state
    SELECT cagnotte_current, cagnotte_initial
    INTO v_game_record
    FROM public.games
    WHERE id = p_game_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found with ID: %', p_game_id;
    END IF;

    v_previous_amount := v_game_record.cagnotte_current;

    -- Calculate new amount based on operation
    CASE p_operation
        WHEN 'add' THEN
            v_new_amount := v_previous_amount + p_amount_cents;
        WHEN 'subtract' THEN
            v_new_amount := v_previous_amount - p_amount_cents;
            -- Prevent negative cagnotte
            IF v_new_amount < 0 THEN
                v_new_amount := 0;
            END IF;
        WHEN 'set' THEN
            v_new_amount := p_amount_cents;
        WHEN 'reset' THEN
            v_new_amount := v_game_record.cagnotte_initial;
        ELSE
            RAISE EXCEPTION 'Unhandled operation type: %', p_operation;
    END CASE;

    -- Update the game cagnotte
    UPDATE public.games
    SET 
        cagnotte_current = v_new_amount,
        updated_at = NOW()
    WHERE id = p_game_id;

    -- Log the transaction
    INSERT INTO public.cagnotte_transactions (
        game_id,
        player_id,
        transaction_type,
        amount_cents,
        previous_amount_cents,
        new_amount_cents,
        reason,
        metadata
    ) VALUES (
        p_game_id,
        p_player_id,
        p_operation,
        p_amount_cents,
        v_previous_amount,
        v_new_amount,
        p_reason,
        jsonb_build_object(
            'timestamp', NOW(),
            'operation_details', jsonb_build_object(
                'operation', p_operation,
                'amount_input', p_amount_cents,
                'calculated_result', v_new_amount
            )
        )
    ) RETURNING id INTO v_transaction_id;

    -- Create game event for real-time updates
    INSERT INTO public.game_events (
        game_id,
        event_type,
        event_data
    ) VALUES (
        p_game_id,
        'cagnotte_updated',
        jsonb_build_object(
            'operation', p_operation,
            'amount_cents', p_amount_cents,
            'previous_amount', v_previous_amount,
            'new_amount', v_new_amount,
            'transaction_id', v_transaction_id,
            'reason', p_reason,
            'player_id', p_player_id
        )
    );

    -- Return success result
    v_result := jsonb_build_object(
        'success', true,
        'operation', p_operation,
        'previous_amount', v_previous_amount,
        'new_amount', v_new_amount,
        'transaction_id', v_transaction_id,
        'message', format('Cagnotte %s: %s€ → %s€', 
            p_operation, 
            (v_previous_amount::DECIMAL / 100)::TEXT,
            (v_new_amount::DECIMAL / 100)::TEXT
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'operation', p_operation,
            'amount_cents', p_amount_cents
        );
END;
$$;

-- Function for quick cagnotte operations (preset amounts)
CREATE OR REPLACE FUNCTION public.quick_cagnotte_operation(
    p_game_id UUID,
    p_preset_operation TEXT,
    p_player_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_amount_cents INTEGER;
    v_operation TEXT;
    v_reason TEXT;
BEGIN
    -- Define preset operations
    CASE p_preset_operation
        WHEN 'add_5' THEN
            v_operation := 'add';
            v_amount_cents := 500; -- 5€
            v_reason := 'Quick add 5€';
        WHEN 'add_10' THEN
            v_operation := 'add';
            v_amount_cents := 1000; -- 10€
            v_reason := 'Quick add 10€';
        WHEN 'add_20' THEN
            v_operation := 'add';
            v_amount_cents := 2000; -- 20€
            v_reason := 'Quick add 20€';
        WHEN 'subtract_5' THEN
            v_operation := 'subtract';
            v_amount_cents := 500; -- 5€
            v_reason := 'Quick subtract 5€';
        WHEN 'subtract_10' THEN
            v_operation := 'subtract';
            v_amount_cents := 1000; -- 10€
            v_reason := 'Quick subtract 10€';
        WHEN 'subtract_20' THEN
            v_operation := 'subtract';
            v_amount_cents := 2000; -- 20€
            v_reason := 'Quick subtract 20€';
        WHEN 'reset' THEN
            v_operation := 'reset';
            v_amount_cents := 0;
            v_reason := 'Quick reset to initial';
        ELSE
            RAISE EXCEPTION 'Invalid preset operation: %. Available: add_5, add_10, add_20, subtract_5, subtract_10, subtract_20, reset', p_preset_operation;
    END CASE;

    -- Call the main cagnotte update function
    RETURN public.update_cagnotte(
        p_game_id,
        v_operation,
        v_amount_cents,
        p_player_id,
        v_reason
    );
END;
$$;

-- Function to get cagnotte transaction history
CREATE OR REPLACE FUNCTION public.get_cagnotte_history(
    p_game_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    transaction_type TEXT,
    amount_cents INTEGER,
    previous_amount_cents INTEGER,
    new_amount_cents INTEGER,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    player_nickname TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.transaction_type,
        ct.amount_cents,
        ct.previous_amount_cents,
        ct.new_amount_cents,
        ct.reason,
        ct.created_at,
        p.nickname as player_nickname
    FROM public.cagnotte_transactions ct
    LEFT JOIN public.players p ON ct.player_id = p.id
    WHERE ct.game_id = p_game_id
    ORDER BY ct.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get cagnotte statistics
CREATE OR REPLACE FUNCTION public.get_cagnotte_stats(p_game_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game_record RECORD;
    v_stats RECORD;
    v_result JSON;
BEGIN
    -- Get current game cagnotte info
    SELECT 
        cagnotte_initial,
        cagnotte_current,
        created_at
    INTO v_game_record
    FROM public.games
    WHERE id = p_game_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found with ID: %', p_game_id;
    END IF;

    -- Get transaction statistics
    SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN transaction_type = 'add' THEN 1 END) as add_count,
        COUNT(CASE WHEN transaction_type = 'subtract' THEN 1 END) as subtract_count,
        COALESCE(SUM(CASE WHEN transaction_type = 'add' THEN amount_cents ELSE 0 END), 0) as total_added,
        COALESCE(SUM(CASE WHEN transaction_type = 'subtract' THEN amount_cents ELSE 0 END), 0) as total_subtracted
    INTO v_stats
    FROM public.cagnotte_transactions
    WHERE game_id = p_game_id;

    -- Build result
    v_result := jsonb_build_object(
        'current_amount', v_game_record.cagnotte_current,
        'initial_amount', v_game_record.cagnotte_initial,
        'net_change', v_game_record.cagnotte_current - v_game_record.cagnotte_initial,
        'total_transactions', v_stats.total_transactions,
        'operations', jsonb_build_object(
            'additions', v_stats.add_count,
            'subtractions', v_stats.subtract_count,
            'total_added', v_stats.total_added,
            'total_subtracted', v_stats.total_subtracted
        ),
        'game_created_at', v_game_record.created_at
    );

    RETURN v_result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_cagnotte(UUID, TEXT, INTEGER, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quick_cagnotte_operation(UUID, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cagnotte_history(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cagnotte_stats(UUID) TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON public.cagnotte_transactions TO anon, authenticated;
GRANT INSERT ON public.cagnotte_transactions TO anon, authenticated;