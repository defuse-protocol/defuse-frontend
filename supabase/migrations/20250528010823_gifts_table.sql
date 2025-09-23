create table "public"."gifts" (
    "gift_id" uuid PRIMARY KEY,
    "encrypted_payload" text not null,
    "p_key" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);

-- Grant permissions to anon users
grant delete on table "public"."gifts" to "anon";
grant insert on table "public"."gifts" to "anon";
grant references on table "public"."gifts" to "anon";
grant select on table "public"."gifts" to "anon";
grant trigger on table "public"."gifts" to "anon";
grant truncate on table "public"."gifts" to "anon";
grant update on table "public"."gifts" to "anon";

-- Grant permissions to authenticated users
grant delete on table "public"."gifts" to "authenticated";
grant insert on table "public"."gifts" to "authenticated";
grant references on table "public"."gifts" to "authenticated";
grant select on table "public"."gifts" to "authenticated";
grant trigger on table "public"."gifts" to "authenticated";
grant truncate on table "public"."gifts" to "authenticated";
grant update on table "public"."gifts" to "authenticated";

-- Grant permissions to service_role
grant delete on table "public"."gifts" to "service_role";
grant insert on table "public"."gifts" to "service_role";
grant references on table "public"."gifts" to "service_role";
grant select on table "public"."gifts" to "service_role";
grant trigger on table "public"."gifts" to "service_role";
grant truncate on table "public"."gifts" to "service_role";
grant update on table "public"."gifts" to "service_role";

-- Create the trigger on gifts table
CREATE TRIGGER gifts_set_updated_at BEFORE UPDATE ON public.gifts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
