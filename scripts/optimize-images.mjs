#!/usr/bin/env node
// Otimização in-place das imagens em public/assets/ (mantém nome/formato/path,
// para que o painel admin continue funcionando com data-edit-src).
// Reexecutável: lê os originais do git se precisar reverter (git checkout).
import sharp from 'sharp'
import { readFileSync, writeFileSync, statSync } from 'node:fs'

const A = 'public/assets/'
const kb = (n) => Math.round(n / 1024)

// [arquivo, transformador]. JPEG p/ fotos (sem banding), palette PNG p/ logos/marcas.
const JOBS = [
  ['logo-mag.png',     (s) => s.resize({ width: 300, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 88 })],
  ['rodrigo-ai.png',   (s) => s.png({ compressionLevel: 9, palette: true, quality: 92, dither: 1 })],
  ['rodrigo-bw.jpg',   (s) => s.resize({ width: 1100, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true, progressive: true })],
  ['sol-vida.jpg',     (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['sol-saude.jpg',    (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['sol-viagem.jpg',   (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['sol-invest.jpg',   (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['sol-blind.jpg',    (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['sol-emp.jpg',      (s) => s.resize({ width: 760, withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true })],
  ['pattern-blue.jpg', (s) => s.resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 58, mozjpeg: true })],
  ['pattern-white.jpg',(s) => s.resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 60, mozjpeg: true })],
  ['mark-green.png',   (s) => s.resize({ width: 220, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 85 })],
  ['mark-white.png',   (s) => s.resize({ width: 220, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 85 })],
  ['mark-blue.png',    (s) => s.resize({ width: 200, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 85 })],
  ['logo-white.png',   (s) => s.resize({ width: 440, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 88 })],
  ['logo-blue.png',    (s) => s.resize({ width: 440, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 88 })],
  ['og-singular.jpg',  (s) => s.jpeg({ quality: 82, mozjpeg: true, progressive: true })],
]

const dims = {}
for (const [file, fn] of JOBS) {
  const before = statSync(A + file).size
  const input = readFileSync(A + file)
  const out = await fn(sharp(input)).toBuffer()
  const meta = await sharp(out).metadata()
  dims[file] = { w: meta.width, h: meta.height }
  // só grava se diminuiu (evita inflar algo já otimizado em reexecuções)
  if (out.length < before) {
    writeFileSync(A + file, out)
    console.log(`${String(kb(before)).padStart(4)}KB -> ${String(kb(out.length)).padStart(4)}KB  ${file}  (${meta.width}x${meta.height})`)
  } else {
    console.log(`     skip (já otimizado)  ${file}`)
  }
}
writeFileSync('scripts/image-dims.json', JSON.stringify(dims, null, 2))
console.log('\ndimensões salvas em scripts/image-dims.json')
