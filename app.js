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
    x: c.x / 100 * p.w + g,
    y: c.y / 100 * p.h + g,
    w: c.w / 100 * p.w - p.gap,
    h: c.h / 100 * p.h - p.gap,
  };
}

function trace(c, shape, x, y, w, h, rad) {
  const cx = x + w / 2, cy = y + h / 2;
  c.beginPath();
  if (shape === "ellipse") {
    c.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === "diamond") {
    c.moveTo(cx, y); c.lineTo(x + w, cy); c.lineTo(cx, y + h); c.lineTo(x, cy);
    c.closePath();
  } else if (shape === "hex") {
    const q = w / 4;
    c.moveTo(x + q, y); c.lineTo(x + w - q, y); c.lineTo(x + w, cy);
    c.lineTo(x + w - q, y + h); c.lineTo(x + q, y + h); c.lineTo(x, cy);
    c.closePath();
  } else if (shape === "tri") {
    c.moveTo(cx, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h);
    c.closePath();
  } else if (shape === "arch") {
    c.moveTo(x, y + h); c.lineTo(x, y + w / 2);
    c.arc(cx, y + w / 2, w / 2, Math.PI, 0);
    c.lineTo(x + w, y + h);
    c.closePath();
  } else if (shape === "heart") {
    c.moveTo(cx, y + h);
    c.bezierCurveTo(x - w * 0.1, y + h * 0.55, x + w * 0.1, y - h * 0.1, cx, y + h * 0.3);
    c.bezierCurveTo(x + w * 0.9, y - h * 0.1, x + w * 1.1, y + h * 0.55, cx, y + h);
    c.closePath();
  } else {
    c.roundRect(x, y, w, h, rad);
  }
}

function paint(c, p, items, s, hint, sel, lite) {
  c.setTransform(s, 0, 0, s, 0, 0);
  c.shadowColor = "transparent";
  if (p.bg2) {
    const g = c.createLinearGradient(0, 0, 0, p.h);
    g.addColorStop(0, p.bg);
    g.addColorStop(1, p.bg2);
    c.fillStyle = g;
  } else {
    c.fillStyle = p.bg;
  }
  c.fillRect(0, 0, p.w, p.h);
  p.cells.forEach((cell, i) => {
    const r = rect(p, cell);
    const it = items && items[i];
    const rad = cell.r == null ? p.radius : cell.r;
    const frame = cell.border > 0 || cell.bottom > 0;
    c.save();
    c.translate(r.x + r.w / 2, r.y + r.h / 2);
    c.rotate(cell.rot * Math.PI / 180);
    let x = -r.w / 2, y = -r.h / 2, w = r.w, h = r.h;
    if (frame || cell.shadow) {
      if (cell.shadow && !lite) {
        c.shadowColor = "rgba(0,0,0,0.35)";
        c.shadowBlur = 24 * s;
        c.shadowOffsetY = 8 * s;
      }
      c.fillStyle = frame ? cell.bc : "#ffffff";
      trace(c, cell.shape, x, y, w, h, rad);
      c.fill();
      c.shadowColor = "transparent";
    }
    if (frame) {
      x += cell.border;
      y += cell.border;
      w = Math.max(1, w - cell.border * 2);
      h = Math.max(1, h - cell.border * 2 - cell.bottom);
    }
    c.save();
    trace(c, cell.shape, x, y, w, h, frame ? 0 : rad);
    c.clip();
    if (it && it.img) {
      const f = Math.max(w / it.img.width, h / it.img.height) * it.z;
      const iw = it.img.width * f, ih = it.img.height * f;
      c.drawImage(it.img, x + (w - iw) / 2 + it.x, y + (h - ih) / 2 + it.y, iw, ih);
    } else {
      c.fillStyle = "#cfcfcf";
      c.fillRect(x - 1, y - 1, w + 2, h + 2);
      if (hint) {
        c.fillStyle = "#888";
        c.font = Math.min(w, h) / 4 + "px monospace";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("+", x + w / 2, y + h / 2);
      }
    }
    c.restore();
    if (hint && i === sel) {
      c.strokeStyle = "#3a9bff";
      c.lineWidth = 5;
      trace(c, cell.shape, -r.w / 2, -r.h / 2, r.w, r.h, rad);
      c.stroke();
    }
    c.restore();
  });
}

let queued = false;

function redraw() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; draw(); });
}

function draw() {
  if (cv.width !== plate.w) cv.width = plate.w;
  if (cv.height !== plate.h) cv.height = plate.h;
  paint(ctx, plate, slots, 1, true, sel);
}

function use(p) {
  plate = structuredClone(p);
  sel = 0;
  slots = plate.cells.map((_, i) => slots[i] ? slots[i] : { img: null, z: 1, x: 0, y: 0 });
  $("gap").value = p.gap;
  $("radius").value = p.radius;
  $("bg").value = p.bg;
  document.querySelectorAll(".tile").forEach(b => {
    const on = b.plate === p;
    b.classList.toggle("on", on);
    if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
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

function slugOf(path) {
  return path.replace(/^templates\//, "").replace(/\.plate$/, "");
}

let cat = "all";
let query = "";

function thumb(el) {
  const p = el.plate;
  const T = 128 * Math.min(2, window.devicePixelRatio || 1);
  const k = T / Math.max(p.w, p.h);
  el.width = Math.round(p.w * k);
  el.height = Math.round(p.h * k);
  paint(el.getContext("2d"), p, null, k, false, -1, true);
}

function filter() {
  const q = query.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll("#list section").forEach(sec => {
    let n = 0;
    const inCat = cat === "all" || sec.dataset.cat === cat;
    sec.querySelectorAll(".tile").forEach(t => {
      const ok = inCat && (!q || t.dataset.q.includes(q));
      t.hidden = !ok;
      if (ok) n++;
    });
    sec.hidden = n === 0;
    shown += n;
  });
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.cat === cat));
  $("none").hidden = shown > 0;
}

function choose(p) {
  use(p);
  if (p.slug) history.replaceState(null, "", "#" + p.slug);
}

function menu() {
  const list = $("list"), chips = $("chips");
  const groups = {};
  for (const p of all) (groups[p.cat] = groups[p.cat] || []).push(p);
  const cats = Object.keys(groups).sort();
  const io = new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      thumb(e.target);
      io.unobserve(e.target);
    }
  }, { root: list, rootMargin: "300px" });
  for (const name of cats) {
    const sec = document.createElement("section");
    sec.dataset.cat = name;
    const h = document.createElement("h4");
    h.textContent = name + " (" + groups[name].length + ")";
    const box = document.createElement("div");
    for (const p of groups[name]) {
      const b = document.createElement("button");
      const c = document.createElement("canvas");
      const l = document.createElement("span");
      b.type = "button";
      b.className = "tile";
      b.plate = p;
      b.title = p.name + (p.author ? " by " + p.author : "");
      b.dataset.q = (p.name + " " + name).toLowerCase();
      b.onclick = () => choose(p);
      c.plate = p;
      l.textContent = p.name;
      b.append(c, l);
      box.append(b);
      io.observe(c);
    }
    sec.append(h, box);
    list.append(sec);
  }
  for (const name of ["all", ...cats]) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = name;
    b.dataset.cat = name;
    b.onclick = () => { cat = name; filter(); };
    chips.append(b);
  }
}

const FALLBACK = [
  "name = Quad", "category = grid", "canvas = 1080x1080", "gap = 8", "bg = #ffffff",
  "cell = 0 0 50 50", "cell = 50 0 50 50", "cell = 0 50 50 50", "cell = 50 50 50 50",
].join("\n");

function pickFromHash() {
  const want = decodeURIComponent(location.hash.slice(1));
  use(all.find(p => p.slug === want) || all[0]);
}

async function boot() {
  try {
    const res = await fetch("plates.bundle");
    if (!res.ok) throw new Error("plates.bundle " + res.status);
    for (const chunk of (await res.text()).split(/^--- /m).slice(1)) {
      const nl = chunk.indexOf("\n");
      const path = chunk.slice(0, nl).trim();
      const p = parsePlate(chunk.slice(nl + 1));
      p.cat = p.category || folderOf(path);
      p.slug = slugOf(path);
      all.push(p);
    }
  } catch (err) {
    $("hint").textContent = "templates not loaded: serve the folder over http (python3 -m http.server) or use GitHub Pages";
  }
  if (!all.length) {
    const p = parsePlate(FALLBACK);
    p.cat = "grid";
    p.slug = "grid/quad";
    all.push(p);
  }
  menu();
  filter();
  pickFromHash();
}

async function loadImage(file) {
  const bm = await createImageBitmap(file);
  const k = 2400 / Math.max(bm.width, bm.height);
  if (k >= 1) return bm;
  const oc = document.createElement("canvas");
  oc.width = Math.round(bm.width * k);
  oc.height = Math.round(bm.height * k);
  const g = oc.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(bm, 0, 0, oc.width, oc.height);
  bm.close();
  return createImageBitmap(oc);
}

function at(e) {
  const b = cv.getBoundingClientRect();
  return { x: (e.clientX - b.left) * plate.w / b.width, y: (e.clientY - b.top) * plate.h / b.height };
}

function hit(pt) {
  for (let i = plate.cells.length - 1; i >= 0; i--) {
    const c = plate.cells[i];
    const r = rect(plate, c);
    const a = -c.rot * Math.PI / 180;
    const dx = pt.x - (r.x + r.w / 2), dy = pt.y - (r.y + r.h / 2);
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= r.w / 2 && Math.abs(ly) <= r.h / 2) return i;
  }
  return -1;
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
  slots[i] = { img: await loadImage(f), z: 1, x: 0, y: 0 };
  redraw();
};

for (const id of ["gap", "radius"]) {
  $(id).oninput = e => { plate[id] = +e.target.value; redraw(); };
}
$("bg").oninput = e => { plate.bg = e.target.value; plate.bg2 = ""; redraw(); };

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
  if (plate.cells.length >= 40) return;
  const c = plate.cells[sel];
  const a = { ...c }, b = { ...c };
  if (vertical) {
    a.w = r2(c.w / 2); b.x = r2(c.x + a.w); b.w = r2(c.w - a.w);
  } else {
    a.h = r2(c.h / 2); b.y = r2(c.y + a.h); b.h = r2(c.h - a.h);
  }
  plate.cells.splice(sel, 1, a, b);
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

$("q").oninput = e => { query = e.target.value; filter(); };
$("q").onkeydown = e => { if (e.key === "Escape") { e.target.value = ""; query = ""; filter(); e.target.blur(); } };

$("list").addEventListener("keydown", e => {
  const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!d) return;
  const tiles = [...document.querySelectorAll(".tile:not([hidden])")];
  const i = tiles.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const n = tiles[Math.min(tiles.length - 1, Math.max(0, i + d))];
  n.focus();
  n.click();
});

document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    $("q").focus();
  }
});

window.addEventListener("hashchange", pickFromHash);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

boot();
