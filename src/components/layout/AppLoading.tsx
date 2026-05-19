/** Full-route Suspense fallback — warm neutral shell while lazy chunks load. */
export function AppLoading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center bg-gradient-to-b from-[#faf7f1] via-[#f5f0e8] to-[#efeae2] px-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-stone-200/90 bg-white/90 p-8 text-center shadow-md ring-1 ring-stone-950/[0.04]">
        <div
          className="motion-safe:animate-spin mx-auto h-10 w-10 rounded-full border-2 border-stone-200 border-t-[#F26522]"
          aria-hidden
        />
        <p className="mt-6 text-base font-semibold tracking-tight text-stone-800">
          Loading FamilySite…
        </p>
        <p className="mt-2 text-sm text-stone-600">Just a moment while the next screen loads.</p>
      </div>
    </div>
  );
}
