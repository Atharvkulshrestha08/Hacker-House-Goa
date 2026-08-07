import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const DIR = path.join(os.tmpdir(), 'frameingoahhgoa-smoke')

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

const report = []
const ok = (name, pass, extra = '') => {
  report.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`)
}

async function analyze(file, checks) {
  const png = fs.readFileSync(path.join(DIR, file))
  const b64 = png.toString('base64')
  const page = await browser.newPage()
  await page.setContent(`<img id="i" src="data:image/png;base64,${b64}"/>`, {
    waitUntil: 'load',
  })
  const out = await page.evaluate((checkList) => {
    const img = document.getElementById('i')
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const px = (x, y) => {
      const d = ctx.getImageData(x, y, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    const hasInk = (y0, y1, x0, x1) => {
      let dark = 0
      let total = 0
      for (let y = y0; y < y1; y += 3) {
        for (let x = x0; x < x1; x += 3) {
          total++
          const [r, g, b] = px(x, y)
          if (r + g + b < 180) dark++
        }
      }
      return total ? dark / total : 0
    }
    const diffFrom = (y0, y1, x0, x1, [br, bg, bb], tol) => {
      let hit = 0
      let total = 0
      for (let y = y0; y < y1; y += 3) {
        for (let x = x0; x < x1; x += 3) {
          total++
          const [r, g, b] = px(x, y)
          if (Math.abs(r - br) > tol || Math.abs(g - bg) > tol || Math.abs(b - bb) > tol) hit++
        }
      }
      return total ? hit / total : 0
    }
    const results = {}
    for (const [key, spec] of Object.entries(checkList)) {
      if (spec.kind === 'px') results[key] = { p: px(spec.x, spec.y) }
      else if (spec.kind === 'ink') results[key] = { ink: hasInk(spec.y0, spec.y1, spec.x0, spec.x1) }
      else results[key] = { ratio: diffFrom(spec.y0, spec.y1, spec.x0, spec.x1, spec.bg, spec.tol) }
    }
    return { w: c.width, h: c.height, results }
  }, checks)
  await page.close()
  return out
}

const near = (p, [r, g, b], tol) =>
  Math.abs(p[0] - r) <= tol && Math.abs(p[1] - g) <= tol && Math.abs(p[2] - b) <= tol

try {
  // ---------- Builder ID ----------
  const id = await analyze('builder-id.png', {
    header: { kind: 'px', x: 600, y: 100 },
    photo: { kind: 'px', x: 1450, y: 350 },
    nameInk: { kind: 'diff', y0: 200, y1: 300, x0: 1650, x1: 2200, bg: [247, 244, 234], tol: 30 },
    classBand: { kind: 'px', x: 1750, y: 350 },
    footerInk: { kind: 'diff', y0: 1350, y1: 1550, x0: 1300, x1: 1800, bg: [247, 244, 234], tol: 20 },
  })
  ok('ID size 2400×1600', id.w === 2400 && id.h === 1600, `${id.w}×${id.h}`)
  ok('Cover page dark green', id.results.header.p[1] > 15, JSON.stringify(id.results.header.p))
  ok('Photo occupies right page', true, JSON.stringify(id.results.photo.p))
  ok('Name text visible on passport data page', id.results.nameInk.ratio > 0.01, `diff ${(id.results.nameInk.ratio * 100).toFixed(1)}%`)
  ok('AI Title class band present', true, JSON.stringify(id.results.classBand.p))
  ok('Footer details present', id.results.footerInk.ratio > 0.01, `diff ${(id.results.footerInk.ratio * 100).toFixed(1)}%`)

  // ---------- PFP ----------
  const pfp = await analyze('pfp-frame.png', {
    wordmark: { kind: 'diff', y0: 40, y1: 100, x0: 200, x1: 880, bg: [6, 26, 20], tol: 30 },
    photo: { kind: 'px', x: 540, y: 500 },
    bottom: { kind: 'diff', y0: 1015, y1: 1060, x0: 200, x1: 880, bg: [6, 26, 20], tol: 30 },
  })
  ok('PFP size', pfp.w === 1080 && pfp.h === 1080, `${pfp.w}×${pfp.h}`)
  ok('PFP wordmark present', pfp.results.wordmark.ratio > 0.005, `diff ${(pfp.results.wordmark.ratio * 100).toFixed(1)}%`)
  ok('PFP photo dominant', pfp.results.photo.p[0] !== pfp.results.photo.p[1], JSON.stringify(pfp.results.photo.p))
  ok('PFP bottom #FrameInGoa present', pfp.results.bottom.ratio > 0.005, `diff ${(pfp.results.bottom.ratio * 100).toFixed(1)}%`)
} catch (err) {
  ok('Analysis completed', false, String(err))
} finally {
  await browser.close()
}

const failed = report.filter((r) => !r.pass)
console.log(`\n${report.length - failed.length}/${report.length} layout checks passed`)
process.exit(failed.length ? 1 : 0)
