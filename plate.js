// .plate parser / writer. format is documented in PLATE.md

function parsePlate(text) {
  const p = { name: "untitled", w: 1080, h: 1080, gap: 8, radius: 0, bg: "#ffffff", cells: [] };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line[0] === "#") continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (key === "cell") {
      const n = val.split(/\s+/).map(Number);
      if (n.length === 4 && n.every(x => x >= 0 && x <= 100)) p.cells.push(n);
    } else if (key === "canvas") {
      const m = val.match(/^(\d+)x(\d+)$/);
      if (m) { p.w = Math.min(+m[1], 4000); p.h = Math.min(+m[2], 4000); }
    } else if (key === "gap" || key === "radius") {
      p[key] = Number(val) || 0;
    } else if (key === "bg") {
      if (/^#[0-9a-f]{6}$/i.test(val)) p.bg = val;
    } else if (key === "name" || key === "author" || key === "category") {
      p[key] = val;
    }
  }
  return p;
}

function dumpPlate(p) {
  const out = ["name = " + p.name];
  if (p.author) out.push("author = " + p.author);
  out.push("category = " + (p.category || p.cat || "community"));
  out.push("canvas = " + p.w + "x" + p.h);
  out.push("gap = " + p.gap, "radius = " + p.radius, "bg = " + p.bg);
  for (const c of p.cells) out.push("cell = " + c.join(" "));
  return out.join("\n") + "\n";
}
