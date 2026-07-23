const fs = require("fs");
const path = require("path");

const ROOT = path.join("d:\\j", "src", "projects", "profile");

// Tailwind v4 IntelliSense: text-xs/text-sm (font-size) conflicts with text-slate-* (color)
const SIZE_COLOR = /\b(text-(xs|sm|base|lg|xl|[2-9]xl))\b[^"]*\b(text-(?:slate|blue|red|emerald|amber|green|indigo|violet|purple|rose|teal|orange|white|black|gray|zinc|neutral|stone|sky|cyan|lime|yellow|fuchsia|pink)-\d+)\b/;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, acc);
    else if (/\.(tsx|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let total = 0;
for (const fp of walk(ROOT)) {
  const content = fs.readFileSync(fp, "utf8");
  const rel = path.relative("d:\\j", fp);
  for (const m of content.matchAll(/className="([^"{}]+)"/g)) {
    if (SIZE_COLOR.test(m[1])) {
      const line = content.slice(0, m.index).split("\n").length;
      console.log(`${rel}:${line} ${m[1].slice(0, 90)}`);
      total++;
    }
  }
}
console.log("Total:", total);
