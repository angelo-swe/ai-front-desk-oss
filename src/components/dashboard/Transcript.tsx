import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/lib/types";

export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        const isAgent = line.role === "agent";
        return (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-1",
              isAgent ? "items-start" : "items-end",
            )}
          >
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
              {isAgent ? "AI" : "Caller"}
            </span>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                isAgent
                  ? "rounded-tl-sm bg-bg-card text-foreground border border-border"
                  : "rounded-tr-sm bg-primary text-white",
              )}
            >
              {line.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
