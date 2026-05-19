import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthContextValue = {
  /** Both `VITE_SUPABASE_*` variables are non-empty. */
  supabaseConfigured: boolean;
  session: Session | null;
  user: User | null;
  /** Initial `getSession` resolved when Supabase is configured. */
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
