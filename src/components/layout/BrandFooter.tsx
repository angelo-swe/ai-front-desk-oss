import { AGENCY_NAME, LOGO_URL } from "@/lib/constants";

export function BrandFooter() {
  return (
    <footer className="mt-12 flex items-center justify-center gap-2 border-t border-border/60 pt-6 text-foreground-subtle">
      {LOGO_URL ? (
        // eslint-disable-next-line @next/next/no-img-element -- LOGO_URL may be a data URI or arbitrary URL
        <img
          src={LOGO_URL}
          width={18}
          height={18}
          alt={AGENCY_NAME}
          className="opacity-90 invert dark:invert-0"
        />
      ) : null}
      <span className="text-sm">
        Powered by{" "}
        <span className="font-medium text-foreground-muted">{AGENCY_NAME}</span>
      </span>
    </footer>
  );
}
