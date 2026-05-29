import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearAuthCallbackHash, hasAuthCallbackHash } from "@/lib/auth/oauth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const sessionVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const isOAuthCallbackRef = { current: hasAuthCallbackHash() };

    const applySession = (session: Session | null) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      previousUserIdRef.current = session?.user?.id ?? null;

      if (session) {
        sessionVersionRef.current = `${session.user.id}-${session.access_token.substring(0, 10)}`;
      }

      isInitializedRef.current = true;
      setLoading(false);

      if (isOAuthCallbackRef.current) {
        isOAuthCallbackRef.current = false;
        clearAuthCallbackHash();
      }
    };

    const initAuth = async () => {
      // Tokens in #hash are applied asynchronously by detectSessionInUrl — wait for INITIAL_SESSION
      if (isOAuthCallbackRef.current) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        const storedVersion = sessionVersionRef.current;
        const currentVersion = `${session.user.id}-${session.access_token.substring(0, 10)}`;

        if (!isInitializedRef.current && storedVersion && storedVersion !== currentVersion) {
          console.error("[AuthContext] SECURITY: Session mismatch detected - clearing all sessions");
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("supabase.auth")) {
              localStorage.removeItem(key);
            }
          });
          await supabase.auth.signOut({ scope: "global" });
          applySession(null);
          sessionVersionRef.current = null;
          return;
        }
      }

      console.log("[AuthContext] Initial session loaded:", session?.user?.id || "none");
      applySession(session);
    };

    initAuth();

    const callbackTimeoutId = isOAuthCallbackRef.current
      ? window.setTimeout(() => {
          if (!isMounted || isInitializedRef.current) return;
          console.warn("[AuthContext] OAuth callback timed out");
          isOAuthCallbackRef.current = false;
          clearAuthCallbackHash();
          setLoading(false);
        }, 10000)
      : undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (
        isOAuthCallbackRef.current &&
        (event === "INITIAL_SESSION" || event === "SIGNED_IN")
      ) {
        console.log("[AuthContext] OAuth callback session:", session?.user?.id || "none");
        applySession(session);
        return;
      }

      const currentUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;

      console.log("[AuthContext] Auth state change:", {
        event,
        currentUserId,
        previousUserId,
        changed: currentUserId !== previousUserId,
      });

      if (
        currentUserId !== previousUserId &&
        previousUserId !== null &&
        currentUserId !== null &&
        !isOAuthCallbackRef.current
      ) {
        console.error("[AuthContext] SECURITY: Unauthorized user switch detected - blocking");
        // Clear everything and force sign out
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth')) {
            localStorage.removeItem(key);
          }
        });
        await supabase.auth.signOut({ scope: 'global' });
        setSession(null);
        setUser(null);
        previousUserIdRef.current = null;
        sessionVersionRef.current = null;
        window.location.reload();
        return;
      }

      // Handle explicit sign out
      if (event === "SIGNED_OUT") {
        console.log("[AuthContext] User signed out - clearing all state");
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.auth')) {
            localStorage.removeItem(key);
          }
        });
        setSession(null);
        setUser(null);
        previousUserIdRef.current = null;
        sessionVersionRef.current = null;
        return;
      }

      if (currentUserId !== previousUserId) {
        console.log("[AuthContext] User changed, updating state");
        applySession(session);
      } else if (event === "TOKEN_REFRESHED") {
        // Update session for token refresh but don't trigger full reload
        console.log("[AuthContext] Token refreshed, updating session only");
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
      if (callbackTimeoutId) window.clearTimeout(callbackTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
