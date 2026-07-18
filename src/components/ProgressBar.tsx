export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
