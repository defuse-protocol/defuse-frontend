CREATE TABLE webauthn_credentials (
    raw_id TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    hostname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an update trigger for updated_at
CREATE TRIGGER webauthn_credentials_set_updated_at
    BEFORE UPDATE ON webauthn_credentials
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
