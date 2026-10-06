// Falls from a section's top border, as the page's top glow does from the
// header, and fades out before the content below the section's heading, so
// nothing in the section is lit more than the rest. The section must be
// `relative`; the glow paints below the content through the page root's
// `isolate`.
function SectionGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-radial-[ellipse_40%_100%_at_50%_0%] from-indigo-700/30 to-transparent"
    />
  );
}

export default SectionGlow;
