import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthAccountType = "individual" | "business";
type OAuthFlow = "signup" | "signin";

const AUTH_CALLBACK_URL = `${window.location.origin}/auth`;

function parseAuthHashParams() {
  const raw = window.location.hash.replace(/^#/, "");
  return raw ? new URLSearchParams(raw) : null;
}

/** OAuth / magic-link redirect puts tokens in the URL hash (e.g. /auth#access_token=...). */
export function hasAuthCallbackHash(): boolean {
  const params = parseAuthHashParams();
  return Boolean(params?.has("access_token") || params?.has("error"));
}

export function getAuthCallbackError(): string | null {
  const params = parseAuthHashParams();
  if (!params) return null;
  return params.get("error_description") || params.get("error");
}

export function clearAuthCallbackHash() {
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

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

/** App registration = user completed signup (role row exists). */
export async function isAppUserRegistered(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

/** True while the auth user was created in this session (OAuth INSERT trigger race). */
function wasAccountJustCreated(user: User, thresholdMs = 120_000): boolean {
  const createdAt = new Date(user.created_at).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt < thresholdMs;
}

async function startGoogleOAuth(
  flow: OAuthFlow,
  options?: { accountType?: OAuthAccountType; redirectPath?: string },
) {
  sessionStorage.setItem("oauth_flow", flow);

  if (flow === "signup" && options?.accountType) {
    sessionStorage.setItem("oauth_account_type", options.accountType);
  } else {
    sessionStorage.removeItem("oauth_account_type");
  }

  if (options?.redirectPath) {
    sessionStorage.setItem("oauth_redirect", options.redirectPath);
  } else {
    sessionStorage.removeItem("oauth_redirect");
  }

  const oauthOptions: {
    redirectTo: string;
    queryParams: Record<string, string>;
    data?: { account_type: OAuthAccountType };
  } = {
    redirectTo: AUTH_CALLBACK_URL,
    queryParams: {
      access_type: "online",
      prompt: "select_account",
    },
  };

  if (flow === "signup" && options?.accountType) {
    oauthOptions.data = { account_type: options.accountType };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: oauthOptions,
  });

  if (error) throw error;
}

export function signUpWithGoogle(options: {
  accountType: OAuthAccountType;
  redirectPath?: string;
}) {
  return startGoogleOAuth("signup", options);
}

export function signInWithGoogle(options?: { redirectPath?: string }) {
  return startGoogleOAuth("signin", options);
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

async function syncOAuthUser(user: User, accountType: OAuthAccountType) {
  const { firstName, lastName, displayName, avatarUrl } = getOAuthNameParts(user);

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: user.email?.split("@")[0] ?? "user",
      email: user.email,
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );

  await supabase.from("user_roles").upsert(
    { user_id: user.id, account_type: accountType },
    { onConflict: "user_id" },
  );

  if (accountType === "business") {
    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!businessProfile) {
      await supabase.from("business_profiles").insert({
        user_id: user.id,
        email: user.email ?? "",
        business_name: "",
        address: "",
        first_name: firstName,
        last_name: lastName,
      });
    }
  }
}

export class AuthFlowError extends Error {
  constructor(
    readonly code: "NOT_REGISTERED" | "ALREADY_REGISTERED",
    message: string,
  ) {
    super(message);
    this.name = "AuthFlowError";
  }
}

/** After email/password sign-in — only allow users who completed registration. */
export async function assertRegisteredForSignIn(user: User): Promise<void> {
  if (await isAppUserRegistered(user.id)) return;
  await supabase.auth.signOut();
  throw new AuthFlowError(
    "NOT_REGISTERED",
    "This account is not registered. Please create an account first.",
  );
}

function clearOAuthSessionStorage() {
  sessionStorage.removeItem("oauth_flow");
  sessionStorage.removeItem("oauth_account_type");
  sessionStorage.removeItem("oauth_redirect");
}

/** Redirect path after successful sign-in (email or Google). */
export async function resolveSignInRedirect(
  user: User,
  defaultRedirect?: string,
): Promise<string> {
  const storedRedirect = sessionStorage.getItem("oauth_redirect");
  sessionStorage.removeItem("oauth_redirect");

  const { data: role } = await supabase
    .from("user_roles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.account_type === "business") {
    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!businessProfile?.business_name) {
      return storedRedirect || "/profile-completion";
    }
  }

  return storedRedirect || defaultRedirect || "/explore-styles";
}

/** Google OAuth callback — registration flow. */
export async function resolveOAuthSignupRedirect(
  user: User,
  defaultRedirect?: string,
): Promise<string> {
  const storedAccountType = sessionStorage.getItem("oauth_account_type") as OAuthAccountType | null;
  const storedRedirect = sessionStorage.getItem("oauth_redirect");
  clearOAuthSessionStorage();

  if (await isAppUserRegistered(user.id) && !wasAccountJustCreated(user)) {
    await supabase.auth.signOut();
    throw new AuthFlowError(
      "ALREADY_REGISTERED",
      "This account is already registered. Please sign in with your email.",
    );
  }

  const accountType: OAuthAccountType =
    user.user_metadata?.account_type === "business" || storedAccountType === "business"
      ? "business"
      : "individual";

  await syncOAuthUser(user, accountType);

  const resolvedType = accountType;

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

  return storedRedirect || defaultRedirect || "/explore-styles";
}
