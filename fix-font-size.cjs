const fs = require("fs");
const path = require("path");

const ROOT = path.join("d:\\j", "src", "projects", "profile");

const REPLACEMENTS = [
  [/\btext-\[length:8px\]/g, "[font-size:8px]"],
  [/\btext-\[length:9px\]/g, "[font-size:9px]"],
  [/\btext-\[length:10px\]/g, "[font-size:10px]"],
  [/\btext-\[length:11px\]/g, "[font-size:11px]"],
  // legacy if any remain
  [/\btext-\[8px\]/g, "[font-size:8px]"],
  [/\btext-\[9px\]/g, "[font-size:9px]"],
  [/\btext-\[10px\]/g, "[font-size:10px]"],
  [/\btext-\[11px\]/g, "[font-size:11px]"],
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, acc);
    else if (/\.(tsx|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let n = 0;
for (const fp of walk(ROOT)) {
  let c = fs.readFileSync(fp, "utf8");
  const orig = c;
  for (const [re, rep] of REPLACEMENTS) c = c.replace(re, rep);
  if (c !== orig) {
    fs.writeFileSync(fp, c);
    n++;
  }
}
console.log(`Updated ${n} files`);
