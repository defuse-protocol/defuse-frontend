alter table "public"."solver_liquidity" enable row level security;

CREATE TRIGGER otc_trades_set_updated_at BEFORE UPDATE ON public.otc_trades FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER solver_liquidity_set_updated_at BEFORE UPDATE ON public.solver_liquidity FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
