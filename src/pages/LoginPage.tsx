import { useState } from "react";
import { useAuth } from "../auth";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";

type LoginPageProps = {
  onBack: () => void;
};

export function LoginPage({ onBack }: LoginPageProps) {
  const { supabaseConfigured, session, user, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const configured = supabaseConfigured;
  const client = getSupabaseBrowserClient();

  async function handleSignIn() {
    setError(null);
    setStatus(null);
    if (!client) {
      setError("Cloud sign-in is not available on this device right now.");
      return;
    }
    setBusy(true);
    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setStatus("Signed in.");
    setPassword("");
  }

  async function handleSignUp() {
    setError(null);
    setStatus(null);
    if (!client) {
      setError("Cloud sign-in is not available on this device right now.");
      return;
    }
    setBusy(true);
    const { error: signUpError } = await client.auth.signUp({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setStatus(
      "Sign-up request sent. If email confirmation is enabled on your project, check your inbox before signing in.",
    );
    setPassword("");
  }

  async function handleSignOut() {
    setError(null);
    setStatus(null);
    setBusy(true);
    await signOut();
    setBusy(false);
    setStatus("Signed out.");
  }

  const formDisabled = !configured || busy || loading;
  const showSignedIn = Boolean(session && user);

  return (
    <WorkspacePageShell>
      <ModuleWorkspaceHeader
        description="Account session for future cloud sync. Your household workspace still loads from this browser only."
        eyebrow="Access"
        title="Sign in"
        action={
          <Button type="button" variant="ghost" onClick={onBack}>
            Back to hub
          </Button>
        }
      />

      <Card tone="light">
        <CardHeader title="Cloud sign-in" eyebrow="Optional" tone="light" />
        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <p>
            Your household workspace is saved on this device. Signing in prepares an account for
            future cloud sync; it does not move data yet.
          </p>

          {!configured ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
              <p className="font-medium text-slate-800">
                Cloud sign-in is not set up for this install
              </p>
              <p className="mt-2">
                You can keep using the full app with data saved in this browser. When your household
                is ready for hosted accounts, an administrator can add the Supabase project URL and
                anonymous key to the app configuration and refresh the page.
              </p>
            </div>
          ) : loading ? (
            <p className="text-slate-700">Checking session…</p>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Auth status
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {showSignedIn
                    ? `Signed in as ${user?.email ?? "account"}`
                    : "Signed out"}
                </p>
                {status ? (
                  <p className="mt-2 font-medium text-emerald-800">{status}</p>
                ) : null}
                {error ? (
                  <p className="mt-2 font-medium text-rose-800">{error}</p>
                ) : null}
              </div>

              {showSignedIn ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    type="button"
                    variant="secondary"
                    onClick={() => void handleSignOut()}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      Email
                    </span>
                    <Input
                      autoComplete="email"
                      disabled={formDisabled}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      Password
                    </span>
                    <Input
                      autoComplete="new-password"
                      disabled={formDisabled}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      disabled={
                        formDisabled || !email.trim() || password.length < 6
                      }
                      type="button"
                      variant="primary"
                      onClick={() => void handleSignIn()}
                    >
                      Sign in
                    </Button>
                    <Button
                      disabled={
                        formDisabled || !email.trim() || password.length < 6
                      }
                      type="button"
                      variant="secondary"
                      onClick={() => void handleSignUp()}
                    >
                      Sign up
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Use at least 6 characters for password. Hosted projects may
                    require email confirmation for new accounts.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </WorkspacePageShell>
  );
}
