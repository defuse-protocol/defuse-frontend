CREATE TABLE gifts (
    gift_id UUID PRIMARY KEY,
    encrypted_payload TEXT NOT NULL,
    p_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an update trigger for updated_at
CREATE TRIGGER gifts_set_updated_at
    BEFORE UPDATE ON gifts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
