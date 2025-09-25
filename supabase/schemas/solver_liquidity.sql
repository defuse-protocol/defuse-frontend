CREATE TABLE solver_liquidity
(
    address_from         TEXT NOT NULL,
    address_to           TEXT NOT NULL,
    validated_amount     TEXT NOT NULL,
    amount               TEXT NOT NULL,
    last_step_size       TEXT NULL,
    last_liquidity_check TEXT NULL,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (address_from, address_to)
);

-- Create an update trigger for updated_at
CREATE TRIGGER solver_liquidity_set_updated_at
    BEFORE UPDATE
    ON solver_liquidity
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();