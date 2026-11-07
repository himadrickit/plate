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

Cells are drawn in order. Photos are never stored in a plate.

## layout

    index.html  style.css  app.js  plate.js  plates.txt
    templates/<category>/<name>.plate    curated by hand
    community/<name>-<issue>.plate       opened by the action, merge or close
    .github/check.sh                     validates posted plates
    .github/workflows/post.yml           issue -> pull request
    .github/workflows/index.yml          rebuilds plates.txt on push

## editing

Click a cell to select it (blue outline). Split it in two, remove it, zoom or
clear its photo. Save the result as a .plate or post it.

## posting

"post template" opens a prefilled GitHub issue titled `[plate] name`.
post.yml validates it and opens a PR adding the file to community/.
Merge it, optionally move it into templates/<category>/.
Repo settings > Actions > General > allow Actions to create pull requests.
