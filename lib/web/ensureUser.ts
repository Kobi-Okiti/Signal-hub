import type { UserResource } from "@clerk/types";
import { supabase } from "@/lib/supabase";

const allowedRoles = new Set(["user", "community_owner"]);

type MinimalUser = Pick<
  UserResource,
  "id" | "firstName" | "lastName" | "emailAddresses" | "primaryEmailAddress" | "unsafeMetadata"
>;

export async function ensureUser(user: MinimalUser, roleOverride?: string | null) {
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null;

  const inferredRole =
    typeof user.unsafeMetadata?.role === "string" ? user.unsafeMetadata.role : null;

  const role = roleOverride ?? inferredRole;

  const payload = {
    id: user.id,
    email,
    role: role && allowedRoles.has(role) ? role : null,
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
  };

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }
}
