import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes('--prod');
const dist = path.join(__dirname, 'dist');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Clean dist
fs.rmSync(dist, { recursive: true, force: true });

// Copy directories (skip node_modules, .git, dist, .superpowers, .github)
for (const dir of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const name = dir.name;
  if (name === 'node_modules' || name === 'dist' || name === '.git' || name === '.superpowers' || name === '.github' || name === 'tests' || name === 'docs') continue;
  copyDir(path.join(__dirname, name), path.join(dist, name));
}

// Copy root files
for (const file of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (file.isFile() && (file.name.endsWith('.html') || file.name.endsWith('.ico') || file.name === 'CNAME' || file.name === '.nojekyll')) {
    fs.copyFileSync(path.join(__dirname, file.name), path.join(dist, file.name));
  }
}

// Minify CSS
const cssFiles = walk(dist).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const result = await esbuild.transform(content, { loader: 'css', minify: isProd });
  fs.writeFileSync(file, result.code);
}

// Minify JS (no bundle — preserve module structure)
const jsFiles = walk(dist).filter(f => f.endsWith('.js'));
for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const result = await esbuild.transform(content, { loader: 'js', minify: isProd, format: 'esm' });
  fs.writeFileSync(file, result.code);
}

console.log(isProd ? `Production build: ${dist}` : `Dev build: ${dist}`);
console.log(`  CSS: ${cssFiles.length} files minified`);
console.log(`  JS: ${jsFiles.length} files minified`);
