// Read-only static checks. Does not execute browser code or contact cloud services.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = ['.', 'js', 'css'].flatMap(dir => fs.readdirSync(path.join(root, dir))
  .filter(name => /\.(html|js|css)$/i.test(name))
  .map(name => path.posix.join(dir, name)));
const exists = file => fs.existsSync(path.join(root, file));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [], warnings = [], pages = [];
const references = new Map();
function reference(from, url, relative = false) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(url) || /\$\{|[<>\n]/.test(url)) return;
  let target;
  try { target = decodeURIComponent(url.split(/[?#]/)[0]); } catch { return; }
  if (!target) return;
  target = path.posix.normalize(path.posix.join(relative ? path.posix.dirname(from) : '.', target));
  if (!exists(target)) errors.push(`${from}: 找不到 ${url}`);
  else references.set(target, [...(references.get(target) || []), from]);
}
for (const file of files) {
  const raw = read(file);
  if (/\.html$/i.test(file)) {
    const source = raw.replace(/<!--[\s\S]*?-->/g, '');
    const scripts = []; const seen = new Set(); let index = 0;
    for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      index++;
      const type = match[1].match(/\btype\s*=\s*["']([^"']*)/i)?.[1];
      const src = match[1].match(/\bsrc\s*=\s*["']([^"']*)/i)?.[1];
      if (src) {
        reference(file, src, true);
        if (seen.has(src)) errors.push(`${file}: 重複載入 ${src}`);
        seen.add(src);
      }
      if (type && !/^(?:text|application)\/javascript$/i.test(type)) {
        if (type === 'application/json' || type === 'application/ld+json') {
          try { JSON.parse(match[2]); } catch (e) { errors.push(`${file}: JSON ${e.message}`); }
        }
        continue;
      }
      let code = match[2];
      if (src) {
        if (/^(?:https?:|\/\/)/i.test(src)) continue;
        const target = src.split(/[?#]/)[0];
        if (!exists(target)) continue;
        code = read(target);
      }
      try { new vm.Script(code, { filename: `${file}:${index}` }); }
      catch (e) { errors.push(`${file}: script ${index}: ${e.message}`); }
      scripts.push(code);
    }
    try { new vm.Script(scripts.join('\n;\n')); }
    catch (e) { errors.push(`${file}: 同頁腳本衝突 ${e.message}`); }
    for (const match of source.matchAll(/<(?:link|a)\b[^>]*?\bhref\s*=\s*["']([^"']+)["']/gi)) reference(file, match[1], true);
    pages.push({ file, title: source.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || file,
      scripts: [...seen] });
  } else if (/\.js$/i.test(file)) {
    try { new vm.Script(raw, { filename: file }); }
    catch (e) { errors.push(`${file}: ${e.message}`); }
  }
  if (file !== 'js/stars.js' && /localStorage\.setItem\(\s*['"]totalStars['"]/.test(raw)) {
    errors.push(`${file}: 星星寫入必須經過 StarSystem`);
  }
  // Literal page destinations include onclick handlers and route registries.
  for (const match of raw.matchAll(/["'`]([\w./-]+\.html(?:[?#][^"'`<>\s]*)?)["'`]/gi)) reference(file, match[1]);
  if (/\.css$/i.test(file)) {
    for (const match of raw.matchAll(/@import\s+["']([^"']+)["']/gi)) reference(file, match[1], true);
  }
}
for (const page of pages) {
  if (page.scripts[0] !== 'js/stars.js') errors.push(`${page.file}: 共用星星系統必須先載入`);
}
for (const file of files.filter(f => /\.(js|css)$/i.test(f))) {
  if (!references.has(file)) warnings.push(`${file}: 未偵測到靜態引用；可能是命令列工具、動態載入或保留資料，不代表可刪除。`);
}
const report = { checkedPages: pages.length, checkedFiles: files.length,
  errors: [...new Set(errors)], warnings, pages };
if (process.argv.includes('--write')) {
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/site-audit.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ checkedPages: report.checkedPages, checkedFiles: report.checkedFiles, errors: report.errors, reviewCandidates: warnings.length }, null, 2));
process.exitCode = report.errors.length ? 1 : 0;
