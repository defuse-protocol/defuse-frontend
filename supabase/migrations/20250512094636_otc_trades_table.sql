create table "public"."otc_trades" (
    "trade_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "encrypted_payload" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);

-- Grant permissions to anon users
grant delete on table "public"."otc_trades" to "anon";
grant insert on table "public"."otc_trades" to "anon";
grant references on table "public"."otc_trades" to "anon";
grant select on table "public"."otc_trades" to "anon";
grant trigger on table "public"."otc_trades" to "anon";
grant truncate on table "public"."otc_trades" to "anon";
grant update on table "public"."otc_trades" to "anon";

-- Grant permissions to authenticated users
grant delete on table "public"."otc_trades" to "authenticated";
grant insert on table "public"."otc_trades" to "authenticated";
grant references on table "public"."otc_trades" to "authenticated";
grant select on table "public"."otc_trades" to "authenticated";
grant trigger on table "public"."otc_trades" to "authenticated";
grant truncate on table "public"."otc_trades" to "authenticated";
grant update on table "public"."otc_trades" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."otc_trades" to "service_role";
grant insert on table "public"."otc_trades" to "service_role";
grant references on table "public"."otc_trades" to "service_role";
grant select on table "public"."otc_trades" to "service_role";
grant trigger on table "public"."otc_trades" to "service_role";
grant truncate on table "public"."otc_trades" to "service_role";
grant update on table "public"."otc_trades" to "service_role";