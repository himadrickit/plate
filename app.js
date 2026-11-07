// change this to your repo (owner/name)
const REPO = "HimadriChakra12/plate";

const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
const $ = id => document.getElementById(id);

let plate = null;
let slots = [];
let all = [];
let drag = null;
let sel = 0;

function rect(p, c) {
  const g = p.gap / 2;
  return {
    x: c[0] / 100 * p.w + g,
    y: c[1] / 100 * p.h + g,
    w: c[2] / 100 * p.w - p.gap,
    h: c[3] / 100 * p.h - p.gap,
  };
}

function paint(c, p, items, s, hint, sel) {
  c.setTransform(s, 0, 0, s, 0, 0);
  c.fillStyle = p.bg;
  c.fillRect(0, 0, p.w, p.h);
  p.cells.forEach((cell, i) => {
    const r = rect(p, cell);
    const it = items && items[i];
    c.save();
    c.beginPath();
    c.roundRect(r.x, r.y, r.w, r.h, p.radius);
    c.clip();
    if (it && it.img) {
      const f = Math.max(r.w / it.img.width, r.h / it.img.height) * it.z;
      const w = it.img.width * f, h = it.img.height * f;
      c.drawImage(it.img, r.x + (r.w - w) / 2 + it.x, r.y + (r.h - h) / 2 + it.y, w, h);
    } else {
      c.fillStyle = "#cfcfcf";
      c.fillRect(r.x, r.y, r.w, r.h);
      if (hint) {
        c.fillStyle = "#888";
        c.font = Math.min(r.w, r.h) / 4 + "px monospace";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("+", r.x + r.w / 2, r.y + r.h / 2);
      }
    }
    c.restore();
    if (hint && i === sel) {
      c.strokeStyle = "#3a9bff";
      c.lineWidth = 5;
      c.strokeRect(r.x, r.y, r.w, r.h);
    }
  });
}

function redraw() {
  cv.width = plate.w;
  cv.height = plate.h;
  paint(ctx, plate, slots, 1, true, sel);
}

function use(p) {
  plate = structuredClone(p);
  sel = 0;
  slots = plate.cells.map((_, i) => slots[i] ? slots[i] : { img: null, z: 1, x: 0, y: 0 });
  $("gap").value = p.gap;
  $("radius").value = p.radius;
  $("bg").value = p.bg;
  document.querySelectorAll("#side canvas").forEach(c => c.classList.toggle("on", c.plate === p));
  syncZoom();
  redraw();
}

function syncZoom() {
  $("zoom").value = slots[sel] ? slots[sel].z : 1;
}

function folderOf(path) {
  const parts = path.split("/");
  return parts[0] === "templates" ? parts[1] : parts[0];
}

function menu() {
  const side = $("side");
  const groups = {};
  for (const p of all) (groups[p.cat] = groups[p.cat] || []).push(p);
  for (const cat of Object.keys(groups).sort()) {
    const h = document.createElement("h4");
    h.textContent = cat;
    side.appendChild(h);
    for (const p of groups[cat]) {
      const t = document.createElement("canvas");
      const s = 160 / p.w;
      t.width = 160;
      t.height = Math.round(p.h * s);
      t.title = p.name + (p.author ? " by " + p.author : "");
      t.plate = p;
      paint(t.getContext("2d"), p, null, s, false);
      t.onclick = () => use(p);
      side.appendChild(t);
    }
  }
}

const FALLBACK = [
  "name = Quad", "category = grid", "canvas = 1080x1080", "gap = 8", "bg = #ffffff",
  "cell = 0 0 50 50", "cell = 50 0 50 50", "cell = 0 50 50 50", "cell = 50 50 50 50",
].join("\n");

async function boot() {
  try {
    const res = await fetch("plates.txt");
    if (!res.ok) throw new Error("plates.txt " + res.status);
    const list = (await res.text()).split("\n").filter(Boolean);
    for (const path of list) {
      const r = await fetch(path);
      if (!r.ok) continue;
      const p = parsePlate(await r.text());
      p.cat = p.category || folderOf(path);
      all.push(p);
    }
  } catch (err) {
    $("side").textContent = "templates not loaded. serve the folder over http (python3 -m http.server) or use GitHub Pages.";
  }
  if (!all.length) {
    const p = parsePlate(FALLBACK);
    p.cat = "grid";
    all.push(p);
  }
  menu();
  use(all[0]);
}

function at(e) {
  const b = cv.getBoundingClientRect();
  return { x: (e.clientX - b.left) * plate.w / b.width, y: (e.clientY - b.top) * plate.h / b.height };
}

function hit(pt) {
  return plate.cells.findIndex(c => {
    const r = rect(plate, c);
    return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
  });
}

cv.addEventListener("pointerdown", e => {
  const pt = at(e);
  const i = hit(pt);
  if (i < 0) return;
  sel = i;
  syncZoom();
  redraw();
  cv.setPointerCapture(e.pointerId);
  drag = { i, sx: pt.x, sy: pt.y, ox: slots[i].x, oy: slots[i].y, moved: false };
});

cv.addEventListener("pointermove", e => {
  if (!drag) return;
  const pt = at(e);
  const dx = pt.x - drag.sx, dy = pt.y - drag.sy;
  if (Math.hypot(dx, dy) > 6) drag.moved = true;
  if (drag.moved && slots[drag.i].img) {
    slots[drag.i].x = drag.ox + dx;
    slots[drag.i].y = drag.oy + dy;
    redraw();
  }
});

cv.addEventListener("pointerup", () => {
  if (drag && !drag.moved) {
    $("pick").dataset.cell = drag.i;
    $("pick").click();
  }
  drag = null;
});

cv.addEventListener("wheel", e => {
  const i = hit(at(e));
  if (i < 0 || !slots[i].img) return;
  e.preventDefault();
  slots[i].z = Math.min(5, Math.max(1, slots[i].z * (e.deltaY < 0 ? 1.08 : 0.92)));
  if (i === sel) syncZoom();
  redraw();
}, { passive: false });

$("pick").onchange = async e => {
  const f = e.target.files[0];
  const i = +e.target.dataset.cell;
  e.target.value = "";
  if (!f) return;
  slots[i] = { img: await createImageBitmap(f), z: 1, x: 0, y: 0 };
  redraw();
};

for (const id of ["gap", "radius"]) {
  $(id).oninput = e => { plate[id] = +e.target.value; redraw(); };
}
$("bg").oninput = e => { plate.bg = e.target.value; redraw(); };

$("zoom").oninput = e => {
  if (!slots[sel]) return;
  slots[sel].z = +e.target.value;
  redraw();
};

$("clear").onclick = () => {
  slots[sel] = { img: null, z: 1, x: 0, y: 0 };
  syncZoom();
  redraw();
};

const r2 = n => Math.round(n * 100) / 100;

function split(vertical) {
  const [x, y, w, h] = plate.cells[sel];
  const pair = vertical
    ? [[x, y, r2(w / 2), h], [r2(x + w / 2), y, r2(w - r2(w / 2)), h]]
    : [[x, y, w, r2(h / 2)], [x, r2(y + h / 2), w, r2(h - r2(h / 2))]];
  if (plate.cells.length >= 24) return;
  plate.cells.splice(sel, 1, pair[0], pair[1]);
  slots.splice(sel + 1, 0, { img: null, z: 1, x: 0, y: 0 });
  redraw();
}

$("vsplit").onclick = () => split(true);
$("hsplit").onclick = () => split(false);

$("rm").onclick = () => {
  if (plate.cells.length < 2) return;
  plate.cells.splice(sel, 1);
  slots.splice(sel, 1);
  sel = Math.min(sel, plate.cells.length - 1);
  syncZoom();
  redraw();
};

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$("save").onclick = () => {
  download(new Blob([dumpPlate(plate)], { type: "text/plain" }), plate.name.replace(/\W+/g, "-") + ".plate");
};

$("open").onclick = () => $("load").click();
$("load").onchange = async e => {
  const f = e.target.files[0];
  e.target.value = "";
  if (f) use(parsePlate(await f.text()));
};

$("export").onclick = () => {
  paint(ctx, plate, slots, 1, false);
  cv.toBlob(b => { download(b, "collage.png"); redraw(); });
};

$("post").onclick = () => {
  const name = prompt("name for this plate", plate.name === "untitled" ? "" : plate.name);
  if (!name) return;
  plate.name = name;
  plate.author = prompt("your name (optional, shown publicly)") || "";
  const body = "```plate\n" + dumpPlate(plate) + "```\n";
  const url = "https://github.com/" + REPO + "/issues/new?title=" +
    encodeURIComponent("[plate] " + name) + "&body=" + encodeURIComponent(body);
  window.open(url, "_blank");
};

boot();
