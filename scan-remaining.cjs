const fs = require("fs");
const path = require("path");

const ROOT = path.join("d:\\j", "src", "projects", "profile");
const COLOR = /\btext-(?:slate|blue|red|emerald|amber|green|indigo|violet|purple|rose|teal|orange|white|black|sky|cyan|lime|yellow|pink|fuchsia|gray|zinc)-/;

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
    const cls = m[1];
    const hasFontSize = /\[font-size:\d+px\]/.test(cls);
    const hasTextSize = /\btext-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])/.test(cls);
    const hasColor = COLOR.test(cls);
    if (hasColor && (hasFontSize || (hasTextSize && /\btext-\[(?!length)/.test(cls)))) {
      const line = content.slice(0, m.index).split("\n").length;
      console.log(`${rel}:${line}`);
      total++;
    }
  }
}
console.log("Total:", total);
