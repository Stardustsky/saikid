#!/usr/bin/env node
/**
 * 把纯静态站点同步到 Android 壳的 assets/www 目录。
 * 用法：node tools/build_android_www.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'www');

// 页面运行需要的入口文件
const FILES = ['index.html', 'manifest.json', 'sw.js'];
// 需要整目录同步的资源
const DIRS = ['assets'];
// 与打包无关的内容
const SKIP_DIRS = new Set(['tools', 'node_modules', '.git', '.trae-html-share-packages', '.voice']);
const SKIP_FILES = new Set(['_smoke.html', 'README.md', 'LICENSE', 'package.json', 'package-lock.json']);

let count = 0;
let bytes = 0;

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  count += 1;
  bytes += fs.statSync(src).size;
}

function copyDir(srcDir, destDir) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      copyDir(src, dest);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      copyFile(src, dest);
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const file of FILES) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) {
    console.error('缺少文件：' + file);
    process.exit(1);
  }
  copyFile(src, path.join(OUT, file));
}

for (const dir of DIRS) {
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) {
    console.error('缺少目录：' + dir);
    process.exit(1);
  }
  copyDir(src, path.join(OUT, dir));
}

console.log('已同步 ' + count + ' 个文件 · ' + (bytes / 1024 / 1024).toFixed(1) + ' MB');
console.log('输出目录：' + path.relative(ROOT, OUT));
