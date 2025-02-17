create table "public"."webauthn_credentials" (
    "raw_id" text not null,
    "public_key" text not null,
    "hostname" text not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX webauthn_credentials_pkey ON public.webauthn_credentials USING btree (raw_id);

alter table "public"."webauthn_credentials" add constraint "webauthn_credentials_pkey" PRIMARY KEY using index "webauthn_credentials_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."webauthn_credentials" to "anon";

grant insert on table "public"."webauthn_credentials" to "anon";

grant references on table "public"."webauthn_credentials" to "anon";

grant select on table "public"."webauthn_credentials" to "anon";

grant trigger on table "public"."webauthn_credentials" to "anon";

grant truncate on table "public"."webauthn_credentials" to "anon";

grant update on table "public"."webauthn_credentials" to "anon";

grant delete on table "public"."webauthn_credentials" to "authenticated";

grant insert on table "public"."webauthn_credentials" to "authenticated";

grant references on table "public"."webauthn_credentials" to "authenticated";

grant select on table "public"."webauthn_credentials" to "authenticated";

grant trigger on table "public"."webauthn_credentials" to "authenticated";

grant truncate on table "public"."webauthn_credentials" to "authenticated";

grant update on table "public"."webauthn_credentials" to "authenticated";

grant delete on table "public"."webauthn_credentials" to "service_role";

grant insert on table "public"."webauthn_credentials" to "service_role";

grant references on table "public"."webauthn_credentials" to "service_role";

grant select on table "public"."webauthn_credentials" to "service_role";

grant trigger on table "public"."webauthn_credentials" to "service_role";

grant truncate on table "public"."webauthn_credentials" to "service_role";

grant update on table "public"."webauthn_credentials" to "service_role";

CREATE TRIGGER webauthn_credentials_set_updated_at BEFORE UPDATE ON public.webauthn_credentials FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


