import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

    // Get initial session immediately with validation
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;
      
      // SECURITY: Validate session integrity
      if (session) {
        const storedVersion = sessionVersionRef.current;
        const currentVersion = `${session.user.id}-${session.access_token.substring(0, 10)}`;
        
        // If we're initializing and there's a stored version that doesn't match, reject
        if (!isInitializedRef.current && storedVersion && storedVersion !== currentVersion) {
          console.error("[AuthContext] SECURITY: Session mismatch detected - clearing all sessions");
          // Clear all possible auth keys
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
          setLoading(false);
          return;
        }
        
        sessionVersionRef.current = currentVersion;
      }
      
      console.log("[AuthContext] Initial session loaded:", session?.user?.id || "none");
      setSession(session);
      setUser(session?.user ?? null);
      previousUserIdRef.current = session?.user?.id ?? null;
      isInitializedRef.current = true;
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes - SINGLE listener for entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const currentUserId = session?.user?.id ?? null;
      const previousUserId = previousUserIdRef.current;
      
      console.log("[AuthContext] Auth state change:", {
        event,
        currentUserId,
        previousUserId,
        changed: currentUserId !== previousUserId
      });

      // SECURITY: Detect unauthorized user switching
      if (currentUserId !== previousUserId && previousUserId !== null && currentUserId !== null) {
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

      // Only update if user actually changed
      if (currentUserId !== previousUserId) {
        console.log("[AuthContext] User changed, updating state");
        setSession(session);
        setUser(session?.user ?? null);
        previousUserIdRef.current = currentUserId;
        if (session) {
          sessionVersionRef.current = `${session.user.id}-${session.access_token.substring(0, 10)}`;
        }
      } else if (event === "TOKEN_REFRESHED") {
        // Update session for token refresh but don't trigger full reload
        console.log("[AuthContext] Token refreshed, updating session only");
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, session, loading }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
