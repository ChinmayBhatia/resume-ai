import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/format";

export function ScoreRing({ value, size = 112 }: { value: number; size?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative shrink-0", scoreTone(value))} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-border" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-foreground">
        {value}
      </span>
    </div>
  );
}