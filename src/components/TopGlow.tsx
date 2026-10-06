// A soft light behind the top of a page, fading to the background before the
// edges. The page's root must be `relative isolate`: `isolate` lets the -z-10
// glow paint above the root's background but below its content. Absolute
// rather than fixed, so on a page that scrolls it leaves with the header
// instead of staying pinned.
function TopGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50dvh] bg-radial-[ellipse_70%_100%_at_50%_0%] from-indigo-700/40 to-transparent to-70%"
    />
  );
}

export default TopGlow;
