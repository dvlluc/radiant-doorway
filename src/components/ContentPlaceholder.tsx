/** Lightweight lazy-load placeholder — no full-screen spinner */
export function ContentPlaceholder() {
  return (
    <div
      className="min-h-[32vh] w-full animate-pulse rounded-lg bg-muted/20"
      aria-busy="true"
      aria-hidden
    />
  );
}
