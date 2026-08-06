import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.BASE_URL || 'http://localhost:4173'
const OUT = path.join(process.cwd(), 'docs', 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

const clickText = async (page, text) => {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t))
    if (!btn) throw new Error(`Button not found: ${t}`)
    btn.click()
  }, text)
}

const shot = (page, file) => page.screenshot({ path: path.join(OUT, file), fullPage: false })

const makePhoto = async (page) => {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 1500
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 1200, 1500)
    g.addColorStop(0, '#0e6b45')
    g.addColorStop(0.5, '#0a3d2e')
    g.addColorStop(1, '#ff3da8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1200, 1500)
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.arc(600, 520, 170, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#faf6ec'
    ctx.font = 'italic 100px serif'
    ctx.textAlign = 'center'
    ctx.fillText('the builder', 600, 900)
    return c.toDataURL('image/png')
  })
  const p = path.join(os.tmpdir(), 'shot-photo.png')
  fs.writeFileSync(p, Buffer.from(dataUrl.split(',')[1], 'base64'))
  return p
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  const page = await browser.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await new Promise((r) => setTimeout(r, 800))
  await shot(page, 'landing-mobile.png')

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 800))
  await shot(page, 'landing-desktop.png')

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  const photoPath = await makePhoto(page)
  await clickText(page, 'Create My ID')
  await page.waitForSelector('input[type=file]', { visible: true })
  const input = await page.$('input[type=file]')
  await input.uploadFile(photoPath)
  await page.waitForFunction(() => document.body.textContent.includes('Looks good'), { timeout: 15000 })
  await shot(page, 'reposition.png')
  await clickText(page, 'Looks good')
  await page.waitForSelector('#builder-name', { visible: true })
  await page.type('#builder-name', 'Atharv Kulshrestha')
  await clickText(page, 'AI / ML')
  await shot(page, 'info.png')
  await clickText(page, 'Get my Builder Class')
  await page.waitForFunction(() => document.body.textContent.includes('Reroll Class'), { timeout: 10000 })
  await shot(page, 'class.png')
  await clickText(page, 'Generate my ID')
  await page.waitForFunction(() => document.body.textContent.includes('Download ID'), { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 900))
  await shot(page, 'output-id.png')

  await clickText(page, 'PFP')
  await new Promise((r) => setTimeout(r, 900))
  await shot(page, 'output-pfp.png')

  console.log(`Screenshots written to ${OUT}`)
} finally {
  await browser.close()
}
