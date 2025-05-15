ALTER TABLE otc_trades ADD COLUMN iv TEXT;

UPDATE otc_trades
-- No reason to use a random IV as it wasn't used in encryption for old records
SET iv = 'DUMMYivbQYiwcEpKD'
WHERE iv IS NULL;

ALTER TABLE otc_trades ALTER COLUMN iv SET NOT NULL;
