create table "public"."solver_liquidity"
(
    "address_from_to"      text PRIMARY KEY,
    "validated_amount"     text not null,
    "amount"               text not null,
    "last_step_size"       text null,
    "last_liquidity_check" text null,
    "created_at"           timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at"           timestamp with time zone default CURRENT_TIMESTAMP
);


-- Grant permissions to anon users
grant delete on table "public"."solver_liquidity" to "anon";
grant insert on table "public"."solver_liquidity" to "anon";
grant references on table "public"."solver_liquidity" to "anon";
grant select on table "public"."solver_liquidity" to "anon";
grant trigger on table "public"."solver_liquidity" to "anon";
grant
truncate
on table "public"."solver_liquidity" to "anon";
grant update on table "public"."solver_liquidity" to "anon";

-- Grant permissions to authenticated users
grant delete on table "public"."solver_liquidity" to "authenticated";
grant insert on table "public"."solver_liquidity" to "authenticated";
grant references on table "public"."solver_liquidity" to "authenticated";
grant select on table "public"."solver_liquidity" to "authenticated";
grant trigger on table "public"."solver_liquidity" to "authenticated";
grant
truncate
on table "public"."solver_liquidity" to "authenticated";
grant update on table "public"."solver_liquidity" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."solver_liquidity" to "service_role";
grant insert on table "public"."solver_liquidity" to "service_role";
grant references on table "public"."solver_liquidity" to "service_role";
grant select on table "public"."solver_liquidity" to "service_role";
grant trigger on table "public"."solver_liquidity" to "service_role";
grant
truncate
on table "public"."solver_liquidity" to "service_role";
grant update on table "public"."solver_liquidity" to "service_role";