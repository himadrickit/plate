// .plate parser / writer. format is documented in PLATE.md

const SHAPES = ["rect", "ellipse", "diamond", "hex", "heart", "tri", "arch"];
const CELL_NUM = ["rot", "r", "border", "bottom", "shadow"];

function parseCell(v) {
  const t = v.split(/\s+/);
  const n = t.slice(0, 4).map(Number);
  if (n.length < 4 || n.some(x => !(x >= -50 && x <= 150))) return null;
  const c = { x: n[0], y: n[1], w: n[2], h: n[3], rot: 0, shape: "rect", r: null, border: 0, bottom: 0, bc: "#ffffff", shadow: 0 };
  for (const kv of t.slice(4)) {
    const [k, val = ""] = kv.split("=");
    if (k === "shape" && SHAPES.includes(val)) c.shape = val;
    else if (k === "bc" && /^#[0-9a-f]{6}$/i.test(val)) c.bc = val;
    else if (CELL_NUM.includes(k)) c[k] = Number(val) || 0;
  }
  return c;
}

function parsePlate(text) {
  const p = { name: "untitled", w: 1080, h: 1080, gap: 8, radius: 0, bg: "#ffffff", bg2: "", cells: [] };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line[0] === "#") continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (key === "cell") {
      const c = parseCell(val);
      if (c && p.cells.length < 40) p.cells.push(c);
    } else if (key === "canvas") {
      const m = val.match(/^(\d+)x(\d+)$/);
      if (m) { p.w = Math.min(+m[1], 4000); p.h = Math.min(+m[2], 4000); }
    } else if (key === "gap" || key === "radius") {
      p[key] = Number(val) || 0;
    } else if (key === "bg" || key === "bg2") {
      if (/^#[0-9a-f]{6}$/i.test(val)) p[key] = val;
    } else if (key === "name" || key === "author" || key === "category") {
      p[key] = val;
    }
  }
  return p;
}

function dumpCell(c) {
  const s = ["cell = " + [c.x, c.y, c.w, c.h].join(" ")];
  if (c.rot) s.push("rot=" + c.rot);
  if (c.shape !== "rect") s.push("shape=" + c.shape);
  if (c.r != null) s.push("r=" + c.r);
  if (c.border) s.push("border=" + c.border);
  if (c.bottom) s.push("bottom=" + c.bottom);
  if (c.border || c.bottom) s.push("bc=" + c.bc);
  if (c.shadow) s.push("shadow=1");
  return s.join(" ");
}

function dumpPlate(p) {
  const out = ["name = " + p.name];
  if (p.author) out.push("author = " + p.author);
  out.push("category = " + (p.category || p.cat || "community"));
  out.push("canvas = " + p.w + "x" + p.h);
  out.push("gap = " + p.gap, "radius = " + p.radius, "bg = " + p.bg);
  if (p.bg2) out.push("bg2 = " + p.bg2);
  for (const c of p.cells) out.push(dumpCell(c));
  return out.join("\n") + "\n";
}
