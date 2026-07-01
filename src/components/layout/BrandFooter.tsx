import { AGENCY_NAME } from "@/lib/constants";

export function BrandFooter() {
  return (
    <footer className="mt-12 flex items-center justify-center gap-2 border-t border-border/60 pt-6 text-foreground-subtle">
      <span className="text-sm">
        Powered by{" "}
        <span className="font-medium text-foreground-muted">{AGENCY_NAME}</span>
      </span>
    </footer>
  );
}
