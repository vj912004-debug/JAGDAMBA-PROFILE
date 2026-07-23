const fs = require("fs");
const path = require("path");

const ROOT = path.join("d:\\j", "src", "projects", "profile");

const REPLACEMENTS = [
  // Labels (most common)
  ["block [font-size:10px] font-bold text-slate-400 mb-1 uppercase tracking-wider", "field-label mb-1"],
  ["block [font-size:10px] font-bold text-slate-400 uppercase tracking-wider", "field-label"],
  ["flex items-center justify-between [font-size:10px] font-bold text-slate-400 mb-1 uppercase tracking-wider", "field-label-row mb-1"],
  ["flex items-center justify-between [font-size:10px] font-bold text-slate-400 uppercase tracking-wider", "field-label-row"],

  // OrderEntry / MaterialReceipt xs labels
  ["block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider", "field-label-sm mb-1"],
  ["block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", "field-label-sm"],

  // Table headers
  ["[font-size:10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase", "table-head-cell"],
  ["[font-size:10px] uppercase font-bold text-slate-500 dark:text-slate-400", "table-head-cell"],
  ["bg-slate-50 dark:bg-slate-800/50 [font-size:10px] uppercase font-bold text-slate-500 dark:text-slate-400", "bg-slate-50 dark:bg-slate-800/50 table-head-cell"],

  // Sidebar / meta text
  ["[font-size:10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest", "meta-10"],
  ["[font-size:10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]", "meta-10 font-extrabold tracking-[0.15em]"],
  ["[font-size:10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest", "meta-10"],
  ["[font-size:10px] text-slate-400 dark:text-slate-500", "meta-10 font-bold normal-case tracking-normal"],

  // Captions
  ["[font-size:9px] font-medium text-slate-400 dark:text-slate-500", "caption-2"],
  ["[font-size:9px] font-black text-slate-400 dark:text-slate-500", "caption-2 font-black"],
  ["[font-size:8px] font-bold text-slate-400", "caption-3"],

  // CNCQuotation / PartyMaster bold labels
  ["block text-xs font-bold text-slate-400 uppercase mb-1", "field-label-sm mb-1"],
  ["block text-xs font-bold text-slate-400 uppercase", "field-label-sm"],

  // TCManagement form labels
  ["block [font-size:10px] font-bold text-slate-400 uppercase mb-1", "field-label mb-1"],
  ["block [font-size:10px] font-bold text-slate-400 uppercase", "field-label"],

  // Quotation form labels
  ["block [font-size:10px] font-bold text-slate-400 uppercase mb-1", "field-label mb-1"],

  // Inline badge sizes - keep color separate
  ["[font-size:10px] text-blue-500 font-bold normal-case tracking-normal", "text-[length:10px] text-blue-500 font-bold normal-case tracking-normal"],
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, acc);
    else if (/\.(tsx|jsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

let files = 0;
for (const fp of walk(ROOT)) {
  let c = fs.readFileSync(fp, "utf8");
  const orig = c;
  for (const [from, to] of REPLACEMENTS) {
    c = c.split(from).join(to);
  }
  if (c !== orig) {
    fs.writeFileSync(fp, c);
    files++;
    console.log(path.relative("d:\\j", fp));
  }
}
console.log(`\nUpdated ${files} files`);
