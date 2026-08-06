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
    header: { kind: 'px', x: 675, y: 100 },
    sunTop: { kind: 'px', x: 675, y: 241 },
    sunRight: { kind: 'px', x: 1253, y: 600 },
    photo: { kind: 'px', x: 675, y: 650 },
    pill: { kind: 'px', x: 675, y: 1375 },
    classBand: { kind: 'px', x: 675, y: 1530 },
    nameInk: { kind: 'ink', y0: 1120, y1: 1330, x0: 400, x1: 950 },
    classText: { kind: 'diff', y0: 1500, y1: 1545, x0: 350, x1: 1000, bg: [255, 61, 168], tol: 40 },
    footerInk: { kind: 'ink', y0: 1620, y1: 1652, x0: 108, x1: 1242 },
    gapInk: { kind: 'ink', y0: 1045, y1: 1075, x0: 400, x1: 950 },
    pillText: { kind: 'diff', y0: 1340, y1: 1410, x0: 400, x1: 950, bg: [255, 210, 63], tol: 40 },
  })
  ok('ID size', id.w === 1350 && id.h === 1688, `${id.w}×${id.h}`)
  ok('Header band forest green', near(id.results.header.p, [10, 61, 46], 28), JSON.stringify(id.results.header.p))
  ok('Sun accent above photo', near(id.results.sunTop.p, [255, 210, 63], 60), JSON.stringify(id.results.sunTop.p))
  ok('Sun accent right of photo', near(id.results.sunRight.p, [255, 210, 63], 60), JSON.stringify(id.results.sunRight.p))
  ok('Photo occupies center', id.results.photo.p[0] !== id.results.photo.p[1], JSON.stringify(id.results.photo.p))
  ok('Name ink present', id.results.nameInk.ink > 0.02, `ink ${(id.results.nameInk.ink * 100).toFixed(1)}%`)
  ok('Stack pill sun yellow', near(id.results.pill.p, [255, 210, 63], 60), JSON.stringify(id.results.pill.p))
  ok('Stack text on pill', id.results.pillText.ratio > 0.005, `diff ${(id.results.pillText.ratio * 100).toFixed(1)}%`)
  ok('Class band punch pink', near(id.results.classBand.p, [255, 61, 168], 50), JSON.stringify(id.results.classBand.p))
  ok('Class text visible on band', id.results.classText.ratio > 0.01, `diff ${(id.results.classText.ratio * 100).toFixed(1)}%`)
  ok('Footer text present', id.results.footerInk.ink > 0.003, `ink ${(id.results.footerInk.ink * 100).toFixed(1)}%`)
  ok('Name does not touch photo', id.results.gapInk.ink < 0.01, `ink ${(id.results.gapInk.ink * 100).toFixed(2)}%`)

  // ---------- PFP ----------
  const pfp = await analyze('pfp-frame.png', {
    corner: { kind: 'px', x: 30, y: 30 },
    wordmark: { kind: 'ink', y0: 40, y1: 110, x0: 300, x1: 780 },
    photo: { kind: 'px', x: 540, y: 600 },
    bottom: { kind: 'diff', y0: 1046, y1: 1076, x0: 200, x1: 880, bg: [10, 61, 46], tol: 40 },
    topBand: { kind: 'px', x: 540, y: 5 },
    yellowLine: { kind: 'px', x: 540, y: 140 },
  })
  ok('PFP size', pfp.w === 1080 && pfp.h === 1080, `${pfp.w}×${pfp.h}`)
  ok('PFP corner sun tick', near(pfp.results.corner.p, [255, 210, 63], 60), JSON.stringify(pfp.results.corner.p))
  ok('PFP wordmark present', pfp.results.wordmark.ink > 0.005, `ink ${(pfp.results.wordmark.ink * 100).toFixed(1)}%`)
  ok('PFP photo dominant', pfp.results.photo.p[0] !== pfp.results.photo.p[1], JSON.stringify(pfp.results.photo.p))
  ok('PFP bottom #FrameInGoa (sun on forest)', pfp.results.bottom.ratio > 0.005, `diff ${(pfp.results.bottom.ratio * 100).toFixed(1)}%`)
  ok('PFP outer frame forest', near(pfp.results.topBand.p, [10, 61, 46], 28), JSON.stringify(pfp.results.topBand.p))
} catch (err) {
  ok('Analysis completed', false, String(err))
} finally {
  await browser.close()
}

const failed = report.filter((r) => !r.pass)
console.log(`\n${report.length - failed.length}/${report.length} layout checks passed`)
process.exit(failed.length ? 1 : 0)
