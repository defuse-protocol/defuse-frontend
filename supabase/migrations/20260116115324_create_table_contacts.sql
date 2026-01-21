create table "public"."contacts" (
    "contact_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" text NOT NULL,
    "address" text NOT NULL,
    "name" text NOT NULL,
    "blockchain" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contacts_account_address_blockchain_unique UNIQUE (account_id, address, blockchain)
);

-- Create index for faster lookups by account_id
CREATE INDEX contacts_account_id_idx ON public.contacts USING btree (account_id);

-- Create index for faster lookups by address and blockchain
CREATE INDEX contacts_address_blockchain_idx ON public.contacts USING btree (address, blockchain);

-- Create the update trigger for updated_at
CREATE TRIGGER contacts_set_updated_at 
    BEFORE UPDATE ON public.contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
-- Note:Authorization is handled in the application layer via API routes that verify
-- the account_id matches the authenticated wallet's AccountId.
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon users (authorization handled in API layer)
grant delete on table "public"."contacts" to "anon";
grant insert on table "public"."contacts" to "anon";
grant references on table "public"."contacts" to "anon";
grant select on table "public"."contacts" to "anon";
grant trigger on table "public"."contacts" to "anon";
grant truncate on table "public"."contacts" to "anon";
grant update on table "public"."contacts" to "anon";

-- Grant permissions to authenticated users (if Supabase Auth is added later)
grant delete on table "public"."contacts" to "authenticated";
grant insert on table "public"."contacts" to "authenticated";
grant references on table "public"."contacts" to "authenticated";
grant select on table "public"."contacts" to "authenticated";
grant trigger on table "public"."contacts" to "authenticated";
grant truncate on table "public"."contacts" to "authenticated";
grant update on table "public"."contacts" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."contacts" to "service_role";
grant insert on table "public"."contacts" to "service_role";
grant references on table "public"."contacts" to "service_role";
grant select on table "public"."contacts" to "service_role";
grant trigger on table "public"."contacts" to "service_role";
grant truncate on table "public"."contacts" to "service_role";
grant update on table "public"."contacts" to "service_role";
