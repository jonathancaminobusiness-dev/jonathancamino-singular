import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { extractContent } from '../src/extract.js'

const html = readFileSync('index.html', 'utf8')
const { document } = new JSDOM(html).window
const content = extractContent(document)
writeFileSync('content.json', JSON.stringify(content, null, 2) + '\n')
const n = document.querySelectorAll('[data-edit],[data-edit-wa],[data-edit-content],[data-edit-src],[data-edit-alt],[data-edit-href],[data-edit-poster]').length
console.log('content.json gerado a partir de', n, 'elementos anotados')
