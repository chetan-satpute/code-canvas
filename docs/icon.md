# App icon

The application's mark is three rounded nodes joined by two edges — a root
above two children, the root filled gold and the children pearl — set on a
rounded tile that runs from indigo to sapphire.

## Why this mark

The glyph is the renderer's own vocabulary rather than a generic code symbol.
Nodes on the canvas are rounded rectangles whose corner radius is a quarter of
their height (`src/canvas/elements/node.ts`), and edges are the lines drawn
between them, so the icon is a miniature of what the explore route actually
draws. The gold node is the accent color the app reserves for the element
under attention, which is the single idea the product is about: a structure
with one position highlighted, advancing a step at a time.

The colors are taken from the palette in `src/index.css` and are hard-coded in
the asset files, because an image file cannot read CSS custom properties:

| Role        | Token            | Value     |
| ----------- | ---------------- | --------- |
| Tile, start | `--indigo-400`   | `#6572bd` |
| Tile, end   | `--sapphire-500` | `#3e6dae` |
| Root node   | `--gold-400`     | `#cca757` |
| Child nodes | `--pearl-100`    | `#f4efe2` |
| Theme color | `--midnight-950` | `#0d0e1a` |

The header on the home route draws the same mark from
`src/routes/home/components/BrandMark.tsx`, which reads the tokens directly.
That component and the asset files are two copies of one geometry; changing
one means changing the other.

## The files

Sources live in `assets/icon/` and are not served. The served assets are in
`public/`.

| File                                | Source                          | Purpose                                                                           |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `public/favicon.svg`                | itself — the master geometry    | What modern browsers use for the tab icon, at any size.                           |
| `public/favicon.ico`                | `assets/icon/icon-small.svg`    | 16, 32 and 48 pixel renders, for browsers that ignore the SVG.                    |
| `public/apple-touch-icon.png`       | `assets/icon/icon-apple.svg`    | 180 pixels, for the iOS home screen.                                              |
| `public/android-chrome-192x192.png` | `public/favicon.svg`            | Manifest icon.                                                                    |
| `public/android-chrome-512x512.png` | `public/favicon.svg`            | Manifest icon, and the install prompt's large icon.                               |
| `public/maskable-icon-512x512.png`  | `assets/icon/icon-maskable.svg` | Manifest icon declared `purpose: maskable`, which Android crops to its own shape. |
| `public/manifest.json`              | —                               | Names the app, the three manifest icons, and the theme and background colors.     |

Three of the sources exist because one drawing cannot serve every size and
every mask:

- `icon-small.svg` thickens the edges and enlarges the nodes. At 16 pixels the
  master's 26-unit strokes fall below one pixel and the three nodes blur into
  a single smudge; the tuned drawing still reads as a branching structure.
- `icon-apple.svg` and `icon-maskable.svg` drop the tile's rounded corners,
  because iOS and Android apply their own mask and would otherwise leave dark
  slivers where our corners fall inside theirs.
- `icon-maskable.svg` additionally scales the glyph to 72% so it stays inside
  the safe zone — the circle of 80% diameter that Android guarantees it will
  not crop.

## Regenerating

The PNGs and the `.ico` are committed, so a normal build needs no tooling.
Regenerate them only after editing a source drawing. The commands below use
Inkscape to rasterize and Pillow to assemble the `.ico` and to quantize the
PNGs, which cuts their size by roughly two thirds with no visible banding.

```sh
inkscape public/favicon.svg -o public/android-chrome-512x512.png -w 512 -h 512
inkscape public/favicon.svg -o public/android-chrome-192x192.png -w 192 -h 192
inkscape assets/icon/icon-apple.svg -o public/apple-touch-icon.png -w 180 -h 180
inkscape assets/icon/icon-maskable.svg -o public/maskable-icon-512x512.png -w 512 -h 512

python3 - <<'PY'
from PIL import Image

for path in [
    'public/android-chrome-192x192.png',
    'public/android-chrome-512x512.png',
    'public/apple-touch-icon.png',
    'public/maskable-icon-512x512.png',
]:
    image = Image.open(path).convert('RGBA')
    image.quantize(colors=255, method=Image.LIBIMAGEQUANT).save(path, optimize=True)

sizes = (16, 32, 48)
renders = []
for size in sizes:
    import subprocess, tempfile, os
    out = os.path.join(tempfile.gettempdir(), f'icon-{size}.png')
    subprocess.run(
        ['inkscape', 'assets/icon/icon-small.svg', '-o', out, '-w', str(size), '-h', str(size)],
        check=True,
    )
    renders.append(Image.open(out).convert('RGBA'))

renders[-1].save(
    'public/favicon.ico',
    format='ICO',
    sizes=[(48, 48), (32, 32), (16, 16)],
    append_images=renders[:-1],
)
PY
```

Quantization uses libimagequant, which dithers; the palette methods that do
not dither leave a visible seam across the tile's gradient.
