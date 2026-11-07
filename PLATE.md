# .plate

Plain text, one `key = value` per line. `#` starts a comment.

    name     = Trio              # shown on hover
    author   = someone           # optional
    category = grid              # sidebar group (templates/ uses the folder name)
    canvas   = 1080x1080         # pixels, max 4000 per side
    gap      = 8                 # px between cells
    radius   = 0                 # px corner radius
    bg       = #ffffff           # 6 digit hex
    cell     = x y w h           # percent of canvas, one line per cell

Cells are drawn in order, so later cells sit on top. x y w h may range
from -50 to 150 (cells can overflow the canvas). Max 40 cells.

    bg2 = #6a82fb       optional, makes bg a top to bottom gradient

A cell can take options after the four numbers:

    rot=-6              rotation in degrees
    shape=heart         rect ellipse diamond hex heart tri arch
    r=12                corner radius for this cell (rect only)
    border=16 bottom=64 frame in px, bottom adds extra space (polaroid)
    bc=#ffffff          frame color
    shadow=1            drop shadow

Example: cell = 8 12 38 44 rot=-6 border=16 bottom=64 shadow=1

Cells are drawn in order. Photos are never stored in a plate.

## layout

    index.html  style.css  app.js  plate.js  plates.bundle
    templates/<category>/<name>.plate    curated by hand
    community/<name>-<issue>.plate       opened by the action, merge or close
    .github/check.sh                     validates posted plates
    .github/workflows/post.yml           issue -> pull request
    .github/workflows/index.yml          rebuilds plates.bundle on push

## editing

Click a cell to select it (blue outline). Split it in two, remove it, zoom or
clear its photo. Save the result as a .plate or post it.

## speed

build.sh packs every .plate into plates.bundle (one request instead of ~60);
index.yml runs it on push. Run `sh build.sh` yourself after adding a template
locally. sw.js caches the site for instant repeat loads and offline use; after a
deploy the new version shows on the second visit.

## posting

"post template" opens a prefilled GitHub issue titled `[plate] name`.
post.yml validates it and opens a PR adding the file to community/.
Merge it, optionally move it into templates/<category>/.
Repo settings > Actions > General > allow Actions to create pull requests.
