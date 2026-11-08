export default function Loading() {
  return (
    // min-h-screen keeps the document tall while loading. A short skeleton
    // makes the page shrink, the browser clamps your scroll to the new
    // bottom, and the next page then opens part-way down instead of at
    // the top.
    <main className="mx-auto min-h-screen w-full max-w-5xl flex-1 px-6 py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-2/3 rounded-lg bg-foreground/10" />
        <div className="h-4 w-1/2 rounded bg-foreground/10" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-foreground/10"
            >
              <div className="aspect-[3/2] w-full bg-foreground/10" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 rounded bg-foreground/10" />
                <div className="h-3 w-1/2 rounded bg-foreground/10" />
                <div className="h-2 w-full rounded bg-foreground/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
