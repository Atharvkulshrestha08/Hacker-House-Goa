import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/og-image.png')

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  const page = await browser.newPage()
  await page.goto('https://fonts.googleapis.com/css2?family=Anton&family=Baloo+2:wght@800&display=swap', { waitUntil: 'networkidle0' })
  await page.setContent(
    '<div id="f"></div>',
    { waitUntil: 'load' },
  )
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('400 40px Anton'),
      document.fonts.load('400 70px Anton'),
      document.fonts.load('800 60px "Baloo 2"'),
    ])
  })

  const png = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 630
    const ctx = c.getContext('2d')
    const F = '"Anton", "Baloo 2", sans-serif'
    ctx.textBaseline = 'alphabetic'

    // background
    ctx.fillStyle = '#0a3d2e'
    ctx.fillRect(0, 0, 1200, 630)

    // accents
    ctx.fillStyle = '#ff3da8'
    ctx.fillRect(0, 0, 26, 630)
    ctx.fillStyle = '#ffd23f'
    ctx.fillRect(1174, 0, 26, 630)

    // left block
    ctx.textAlign = 'left'
    ctx.fillStyle = '#faf6ec'
    ctx.font = `48px ${F}`
    ctx.fillText('HACKER HOUSE', 120, 210)
    ctx.fillStyle = '#ffe98a'
    ctx.font = `120px ${F}`
    ctx.fillText('गोवा 2026', 120, 360)

    ctx.fillStyle = '#ff3da8'
    ctx.font = 'italic 44px Georgia, serif'
    ctx.fillText('Frame yourself in Goa.', 120, 440)

    // right badge
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.arc(920, 300, 150, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#10221a'
    ctx.font = `44px ${F}`
    ctx.textAlign = 'center'
    ctx.fillText('BUILDER', 920, 280)
    ctx.fillText('ID', 920, 330)
    ctx.fillStyle = '#ff3da8'
    ctx.font = `26px ${F}`
    ctx.fillText('#FrameInGoa', 920, 375)

    // footer
    ctx.textAlign = 'center'
    ctx.fillStyle = '#faf6ec'
    ctx.font = `28px ${F}`
    ctx.fillText('HHGOA.COM · 28–31 OCT · #FRAMEINGOA', 600, 560)
    return c.toDataURL('image/png')
  })

  fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'))
  console.log(`Wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`)
} finally {
  await browser.close()
}
