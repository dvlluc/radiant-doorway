import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthAccountType = "individual" | "business";

const AUTH_CALLBACK_URL = `${window.location.origin}/auth`;

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

async function provisionNewOAuthUser(user: User, accountType: OAuthAccountType) {
  const { firstName, lastName, displayName, avatarUrl } = getOAuthNameParts(user);

  await supabase
    .from("profiles")
    .update({
      email: user.email,
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  await supabase.from("user_roles").upsert(
    { user_id: user.id, account_type: accountType },
    { onConflict: "user_id" },
  );

  if (accountType === "business") {
    await supabase.from("business_profiles").upsert(
      {
        user_id: user.id,
        email: user.email ?? "",
        business_name: "",
        address: "",
        first_name: firstName,
        last_name: lastName,
      },
      { onConflict: "user_id" },
    );
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
