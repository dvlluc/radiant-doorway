import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthAccountType = "individual" | "business";

const AUTH_CALLBACK_URL = `${window.location.origin}/auth`;

function getGoogleProviderSetupHint(): string {
  const projectRef =
    import.meta.env.VITE_SUPABASE_PROJECT_ID ||
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  const supabaseCallback = projectRef
    ? `https://${projectRef}.supabase.co/auth/v1/callback`
    : "https://<project-ref>.supabase.co/auth/v1/callback";

  return (
    "Enable Google in Supabase Dashboard → Authentication → Providers → Google. " +
    `Google Cloud redirect URI: ${supabaseCallback}. ` +
    `App redirect URL: ${AUTH_CALLBACK_URL} (Authentication → URL Configuration).`
  );
}

export function isGoogleProviderSetupError(message: string): boolean {
  return message.includes("Supabase Dashboard → Authentication → Providers → Google");
}

/** Maps Supabase auth errors to actionable messages (e.g. provider not enabled). */
export function getGoogleAuthErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: string }).message)
      : error && typeof error === "object" && "msg" in error
        ? String((error as { msg: string }).msg)
        : "";

  if (
    message.includes("provider is not enabled") ||
    message.includes("Unsupported provider")
  ) {
    return getGoogleProviderSetupHint();
  }

  return message || "Please try again";
}

export async function signInWithGoogle(options?: {
  accountType?: OAuthAccountType;
  redirectPath?: string;
}) {
  if (options?.accountType) {
    sessionStorage.setItem("oauth_account_type", options.accountType);
  } else {
    sessionStorage.removeItem("oauth_account_type");
  }

  if (options?.redirectPath) {
    sessionStorage.setItem("oauth_redirect", options.redirectPath);
  } else {
    sessionStorage.removeItem("oauth_redirect");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_CALLBACK_URL,
      queryParams: {
        access_type: "online",
        prompt: "select_account",
      },
      ...(options?.accountType && {
        data: { account_type: options.accountType },
      }),
    },
  });

  if (error) throw error;
}

function getOAuthNameParts(user: User) {
  const meta = user.user_metadata ?? {};
  const fullName = String(meta.full_name || meta.name || "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: String(meta.first_name || nameParts[0] || ""),
    lastName: String(meta.last_name || nameParts.slice(1).join(" ") || ""),
    displayName: String(
      meta.display_name || fullName || user.email?.split("@")[0] || "User",
    ),
    avatarUrl: (meta.avatar_url || meta.picture || null) as string | null,
  };
}

const PROFILE_WAIT_MS = 200;
const PROFILE_WAIT_ATTEMPTS = 8;

async function waitForProfileRow(userId: string): Promise<boolean> {
  for (let attempt = 0; attempt < PROFILE_WAIT_ATTEMPTS; attempt += 1) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (data) return true;
    await new Promise((resolve) => setTimeout(resolve, PROFILE_WAIT_MS));
  }

  return false;
}

/** Fills missing profile fields from Google user_metadata without overwriting user edits. */
async function syncOAuthProfileData(user: User) {
  const { firstName, lastName, displayName, avatarUrl } = getOAuthNameParts(user);
  const hasOAuthData = Boolean(firstName || lastName || displayName || avatarUrl || user.email);
  if (!hasOAuthData) return;

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    console.error("[oauth] Failed to read profile:", readError);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: user.email?.split("@")[0] ?? "user",
      email: user.email,
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
      avatar_url: avatarUrl,
    });

    if (insertError) console.error("[oauth] Profile insert failed:", insertError);
    return;
  }

  const updates: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } = {};

  if (!existing.email && user.email) updates.email = user.email;
  if (!existing.first_name && firstName) updates.first_name = firstName;
  if (!existing.last_name && lastName) updates.last_name = lastName;
  if (!existing.display_name && displayName) updates.display_name = displayName;
  if (!existing.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;

  if (Object.keys(updates).length === 0) return;

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) console.error("[oauth] Profile update failed:", updateError);
}

async function ensureBusinessProfileForOAuth(user: User) {
  const { firstName, lastName } = getOAuthNameParts(user);

  const { data: existing } = await supabase
    .from("business_profiles")
    .select("user_id, first_name, last_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("business_profiles").insert({
      user_id: user.id,
      email: user.email ?? "",
      business_name: "",
      address: "",
      first_name: firstName,
      last_name: lastName,
    });

    if (error) console.error("[oauth] Business profile insert failed:", error);
    return;
  }

  const updates: {
    email?: string;
    first_name?: string;
    last_name?: string;
  } = {};

  if (!existing.email && user.email) updates.email = user.email;
  if (!existing.first_name && firstName) updates.first_name = firstName;
  if (!existing.last_name && lastName) updates.last_name = lastName;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("business_profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (error) console.error("[oauth] Business profile update failed:", error);
}

async function provisionNewOAuthUser(user: User, accountType: OAuthAccountType) {
  await waitForProfileRow(user.id);
  await syncOAuthProfileData(user);

  const { error: roleError } = await supabase.from("user_roles").upsert(
    { user_id: user.id, account_type: accountType },
    { onConflict: "user_id" },
  );

  if (roleError) console.error("[oauth] User role upsert failed:", roleError);

  if (accountType === "business") {
    await ensureBusinessProfileForOAuth(user);
  }
}

export async function resolvePostAuthRedirect(
  user: User,
  defaultRedirect?: string,
): Promise<string> {
  const storedAccountType = sessionStorage.getItem("oauth_account_type") as OAuthAccountType | null;
  const storedRedirect = sessionStorage.getItem("oauth_redirect");
  sessionStorage.removeItem("oauth_account_type");
  sessionStorage.removeItem("oauth_redirect");

  const accountType: OAuthAccountType =
    user.user_metadata?.account_type === "business" || storedAccountType === "business"
      ? "business"
      : "individual";

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingRole) {
    await provisionNewOAuthUser(user, accountType);
  } else {
    await waitForProfileRow(user.id);
    await syncOAuthProfileData(user);

    const resolvedType = existingRole.account_type ?? accountType;
    if (resolvedType === "business") {
      await ensureBusinessProfileForOAuth(user);
    }
  }

  const resolvedType = existingRole?.account_type ?? accountType;

  if (resolvedType === "business") {
    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!businessProfile?.business_name) {
      return storedRedirect || "/profile-completion";
    }
  }

  return storedRedirect || defaultRedirect || "/directory";
}
