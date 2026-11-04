'use strict';

// Creates a small public catalog from curated metadata and Git tree metadata.
// Reads blob names, sizes and SHA values; never downloads models or archives.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const source = JSON.parse(fs.readFileSync('catalogo.json', 'utf8'));
if (!Array.isArray(source)) throw new Error('catalogo.json precisa ser uma lista');

const tree = new Map();
const rawTree = execFileSync('git', ['ls-tree', '-r', '-l', '-z', 'HEAD'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024
});
for (const record of rawTree.split('\0')) {
  if (!record) continue;
  const tab = record.indexOf('\t');
  if (tab < 0) throw new Error('Registro de árvore Git inválido');
  const parts = record.slice(0, tab).trim().split(/\s+/);
  if (parts.length !== 4) throw new Error('Metadados de blob inválidos');
  const [mode, type, sha, size] = parts;
  if (type === 'blob' && mode === '100644') {
    tree.set(record.slice(tab + 1), { sha, bytes: Number(size) });
  }
}

const paths = new Set();
const shas = new Set();
for (const asset of source) {
  if (!asset.path || paths.has(asset.path)) throw new Error('Caminho ausente ou repetido: ' + asset.path);
  const blob = tree.get(asset.path);
  if (!blob) throw new Error('Modelo cadastrado não existe: ' + asset.path);
  if (blob.sha !== asset.sha || blob.bytes !== asset.bytes) {
    throw new Error('SHA/tamanho divergente: ' + asset.path + ' (atualize catalogo.json)');
  }
  if (!asset.name || !asset.category || !asset.subCategory || !asset.ext) {
    throw new Error('Metadados incompletos: ' + asset.path);
  }
  paths.add(asset.path);
  shas.add(asset.sha);
}

const categories = new Set(['armas', 'cenarios', 'chaves', 'criaturas', 'dinossauros', 'dragoes', 'natureza', 'personagens', 'veiculos']);
const extensions = /\.(glb|zip|rar|7z|png|jpg|jpeg|webp|gif|avif|svg)$/i;
const added = [];
for (const [filePath, blob] of tree) {
  if (!extensions.test(filePath) || paths.has(filePath) || shas.has(blob.sha)) continue;
  if (filePath.includes('/') && !filePath.startsWith('assets/')) continue;
  const pieces = filePath.split('/');
  if (pieces.some(s => s === '..' || s === '.')) continue;
  const inCategory = pieces[0] === 'assets' && categories.has(pieces[1]);
  const category = inCategory ? pieces[1] : 'novidades';
  const subCategory = inCategory && pieces.length >= 4 ? pieces[2] : 'a-classificar';
  const name = path.posix.basename(filePath);
  const ext = name.split('.').pop().toLowerCase();
  added.push({
    name,
    title: name.replace(/\.[^.]+$/, '').replace(/^Meshy_AI_/i, '').replace(/_/g, ' '),
    path: filePath,
    category,
    subCategory,
    ext,
    bytes: blob.bytes,
    sha: blob.sha,
    broken: blob.bytes < 20,
    tags: ['novo envio']
  });
  paths.add(filePath);
  shas.add(blob.sha);
}
added.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
const out = [...source, ...added];
fs.mkdirSync('_site', { recursive: true });
fs.writeFileSync('_site/catalogo.json', JSON.stringify(out, null, 2) + '\n');
console.log('Catálogo validado: ' + source.length + ' selecionados + ' + added.length + ' novos = ' + out.length + ' arquivos.');
console.log('Arquivo resultante: ' + fs.statSync('_site/catalogo.json').size + ' bytes.');
