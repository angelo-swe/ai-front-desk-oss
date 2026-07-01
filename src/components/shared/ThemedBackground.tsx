/**
 * Theme-aware ambient background: soft brand-gradient "aurora" glows that read
 * well in BOTH light and dark mode. Opacity scales via the --aurora-opacity
 * token per theme.
 *
 * Promoted to its own GPU layer (transform-gpu) so the glass cards' backdrop
 * filter samples a STABLE cached texture — without this, page animations cause
 * Chrome to re-rasterize the backdrop and the aurora tint flickers.
 */
export function ThemedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transform-gpu overflow-hidden [backface-visibility:hidden]"
    >
      <div className="absolute inset-0 bg-bg" />

      <div
        className="absolute inset-0"
        style={{ opacity: "var(--aurora-opacity)" }}
      >
        <div
          className="absolute -left-[12%] -top-[18%] h-[60vh] w-[60vh] rounded-full blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.9), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-[12%] top-[6%] h-[55vh] w-[55vh] rounded-full blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.85), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[22%] left-[18%] h-[58vh] w-[58vh] rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(244,63,94,0.5), transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}
