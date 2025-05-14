CREATE TABLE otc_trades (
    trade_id TEXT PRIMARY KEY,
    encrypted_payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an update trigger for updated_at
CREATE TRIGGER otc_trades_set_updated_at
    BEFORE UPDATE ON otc_trades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Create a trigger for trade_id
CREATE TRIGGER otc_trades_gen_trade_id
    BEFORE INSERT ON otc_trades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gen_trade_id();