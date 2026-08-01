#!/usr/bin/env node
/*
 * Regenerates public/Collective_Loft_User_Guide.pdf from the live /guide page.
 * The PDF is an export of the page: update the page, then re-run this.
 *
 * Needs puppeteer-core (not a repo dependency): npm i --no-save puppeteer-core
 * Usage: node scripts/print-guide.mjs [url]   (default http://localhost:3456/guide)
 */
import puppeteer from 'puppeteer-core'

const url = process.argv[2] || 'http://localhost:3456/guide'
const out = new URL('../public/Collective_Loft_User_Guide.pdf', import.meta.url).pathname

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
})
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await page.emulateMediaType('screen')
await page.pdf({
  path: out,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
})
console.log('wrote', out)
await browser.close()
