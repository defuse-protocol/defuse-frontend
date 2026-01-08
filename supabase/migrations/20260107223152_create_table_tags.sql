-- Create enum type for auth methods
CREATE TYPE auth_method AS ENUM (
	'near',
	'evm',
	'solana',
	'webauthn',
	'ton',
	'stellar',
	'tron'
);

-- Create tags table
CREATE TABLE tags (
	auth_tag TEXT PRIMARY KEY,
	auth_identifier TEXT NOT NULL,
	auth_method auth_method NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	-- Validate that auth_tag starts with @ and contains exactly one @
	CONSTRAINT auth_tag_format_check CHECK (auth_tag ~ '^@[^@]*$')
);

-- Create unique constraint on auth_tag (already enforced by PRIMARY KEY, but explicit for clarity)
-- The PRIMARY KEY already ensures uniqueness, but we can add a unique index for performance
CREATE UNIQUE INDEX tags_auth_tag_unique ON tags (auth_tag);

-- Create index on auth_identifier and auth_method for faster lookups
CREATE INDEX tags_identifier_method_idx ON tags (auth_identifier, auth_method);

-- Create index on auth_method for filtering
CREATE INDEX tags_method_idx ON tags (auth_method);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tags_updated_at
	BEFORE UPDATE ON tags
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE tags IS 'Stores authentication identities with unique tags';
COMMENT ON COLUMN tags.auth_tag IS 'Unique identifier for the auth identity (must start with @ and contain exactly one @)';
COMMENT ON COLUMN tags.auth_identifier IS 'The user identifier (blockchain address, account name, or public key)';
COMMENT ON COLUMN tags.auth_method IS 'The type of authentication method used';

