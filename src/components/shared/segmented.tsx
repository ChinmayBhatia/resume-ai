"use client";
import { cn } from "@/lib/utils";

export function Segmented<T extends string | number>({
  value, onChange, options, label,
}: { value: T; onChange: (v: T) => void; options: T[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm transition-colors",
            value === o ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}