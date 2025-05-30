CREATE TABLE otc_trades (
    trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_payload TEXT NOT NULL,
    iv TEXT,
    p_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an update trigger for updated_at
CREATE TRIGGER otc_trades_set_updated_at
    BEFORE UPDATE ON otc_trades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();