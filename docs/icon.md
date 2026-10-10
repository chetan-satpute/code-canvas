# App icon

The mark is a three-node tree: a glowing gold root joined to two pearl
children, on a sapphire tile.

## Why this mark

The icon is chosen for how it looks and how well it fits the theme. It
borrows the theme's own story — sapphire, gold jewelry, the ivory drape, a
cosmic midnight sky — and gives it one idea from the product: a structure
with a single node under attention, which the gold root carries. The nodes
take the canvas's node shape (`src/canvas/elements/node.ts`): equal 2:1
rounded rectangles with a corner radius of a quarter of their height, lit
from the top, with only the color marking the highlighted one. The lighting
is simplified: a full-height gradient instead of the canvas's top-half sheen,
and no hairline rim.

An image file cannot read CSS custom properties, so the colors are copied from
`src/index.css` into the drawings:

| Role                           | Token                                      | Value                           |
| ------------------------------ | ------------------------------------------ | ------------------------------- |
| Tile, top-left to bottom-right | `--sapphire-500` to `--sapphire-800`       | `#3e6dae` to `#1b3557`          |
| Halo behind the tree           | `--sapphire-400`                           | `#5d89c5`                       |
| Gold root, light to shade      | `--gold-200`, `--gold-400`, `--gold-600`   | `#e1d5b9`, `#cca757`, `#97752b` |
| Glow around the root           | `--gold-300`                               | `#d5be8b`                       |
| Pearl children, light to shade | `--pearl-25`, `--pearl-100`, `--pearl-200` | `#fcfcfa`, `#f4efe2`, `#ded5bc` |
| Edges                          | `--pearl-100`                              | `#f4efe2`                       |
| Theme and background color     | `--background` (`midnight-950`)            | `#0d0e1a`                       |

`public/favicon.svg` is flat and uses its own set:

| Role     | Token            | Value     |
| -------- | ---------------- | --------- |
| Root     | `--gold-400`     | `#cca757` |
| Children | `--pearl-100`    | `#f4efe2` |
| Edges    | `--sapphire-200` | `#bccadf` |

## The files

Sources live in `assets/icon/` and are not served. Everything served is in
`public/`.

| Served file                    | Drawn from                      | Used for                                                       |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------- |
| `public/favicon.svg`           | itself                          | The tab icon in browsers that read SVG favicons.               |
| `public/favicon.ico`           | `public/favicon.svg`            | 16, 32 and 48 pixel frames for browsers that do not.           |
| `public/apple-touch-icon.png`  | `assets/icon/icon-apple.svg`    | 180 pixels, for the iOS home screen.                           |
| `public/icon-192.png`          | `assets/icon/icon.svg`          | Manifest icon.                                                 |
| `public/icon-512.png`          | `assets/icon/icon.svg`          | Manifest icon, and the large icon in Android's install prompt. |
| `public/icon-maskable-512.png` | `assets/icon/icon-maskable.svg` | Manifest icon that Android crops to its own shape.             |
| `public/manifest.json`         | —                               | The app's name, its manifest icons, and its theme colors.      |

One drawing cannot serve every size and every mask, so there are four:

- `assets/icon/icon.svg` is the master: top-lit nodes, the root's glow (a
  blurred rounded rectangle, so it follows the root's shape), the halo and
  the tile's lit rim.
- `public/favicon.svg` is a separate drawing for 16 to 48 pixels, which is
  also all a browser tab ever shows of the SVG. The master's glow turns to a
  grey smudge there. This one is flat: no glow, halo or rim, solid
  `--gold-400` and `--pearl-100` nodes, edges over twice as thick in
  `--sapphire-200`, and no tile, so the tree spans the whole square and the
  tab shows just the tree. Its colors are tuned for a dark tab bar; on a
  light one the pearl children and edges are faint. The device icons keep
  the tile, since a home screen or install prompt needs the icon to bring its
  own background.
- `assets/icon/icon-apple.svg` is the master without the tile's rounded
  corners or rim. iOS applies its own mask, and our corners inside it would
  leave dark slivers.
- `assets/icon/icon-maskable.svg` is the Apple drawing with the `tree` group
  scaled to 86%, keeping the nodes well inside the safe zone: the centered
  circle of 80% diameter that Android guarantees not to crop.

Both full-bleed drawings are the master with those changes applied, so an edit
to the master must be carried into them.

## Regenerating

The PNGs and the `.ico` are committed, so a build needs no extra tooling.
Regenerate them after editing a drawing. Inkscape rasterizes, and Pillow
quantizes the PNGs with libimagequant and assembles the `.ico`. Quantizing
cuts the PNGs' size by about half. libimagequant dithers; palette methods that
do not would band the glow. The PyPI Pillow wheels are built without
libimagequant, so `Image.LIBIMAGEQUANT` raises there; use a Pillow linked
against it, such as Homebrew's (`features.check('libimagequant')` is `True`).

```sh
inkscape assets/icon/icon.svg -o public/icon-192.png -w 192 -h 192
inkscape assets/icon/icon.svg -o public/icon-512.png -w 512 -h 512
inkscape assets/icon/icon-apple.svg -o public/apple-touch-icon.png -w 180 -h 180
inkscape assets/icon/icon-maskable.svg -o public/icon-maskable-512.png -w 512 -h 512
for size in 16 32 48; do
  inkscape public/favicon.svg -o "${TMPDIR:-/tmp}/favicon-$size.png" -w $size -h $size
done

python3 - <<'PY'
import os
from PIL import Image

for path in [
    'public/icon-192.png',
    'public/icon-512.png',
    'public/apple-touch-icon.png',
    'public/icon-maskable-512.png',
]:
    image = Image.open(path).convert('RGBA')
    image.quantize(colors=255, method=Image.LIBIMAGEQUANT).save(path, optimize=True)

tmp = os.environ.get('TMPDIR', '/tmp')
frames = [Image.open(f'{tmp}/favicon-{size}.png').convert('RGBA') for size in (16, 32, 48)]
# Each size is passed as its own frame; Pillow would otherwise downscale the
# 48 pixel frame, undoing the per-size rendering.
frames[-1].save(
    'public/favicon.ico',
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=frames[:-1],
)
PY
```
