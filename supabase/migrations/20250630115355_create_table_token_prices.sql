create table "public"."token_prices"
(
    "symbol"    text not null,
    "price"     bigint not null,
    "timestamp" timestamp with time zone not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,

    PRIMARY KEY (symbol, timestamp)
);

-- Create index for efficient timestamp-based queries
create index "idx_token_prices_timestamp" on "public"."token_prices" ("timestamp");
create index "idx_token_prices_symbol" on "public"."token_prices" ("symbol");

-- Grant permissions to authenticated users
grant delete on table "public"."token_prices" to "authenticated";
grant insert on table "public"."token_prices" to "authenticated";
grant references on table "public"."token_prices" to "authenticated";
grant select on table "public"."token_prices" to "authenticated";
grant trigger on table "public"."token_prices" to "authenticated";
grant truncate on table "public"."token_prices" to "authenticated";
grant update on table "public"."token_prices" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."token_prices" to "service_role";
grant insert on table "public"."token_prices" to "service_role";
grant references on table "public"."token_prices" to "service_role";
grant select on table "public"."token_prices" to "service_role";
grant trigger on table "public"."token_prices" to "service_role";
grant truncate on table "public"."token_prices" to "service_role";
grant update on table "public"."token_prices" to "service_role"; 