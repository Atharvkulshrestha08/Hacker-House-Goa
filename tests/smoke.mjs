import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const ARTIFACTS = path.join(os.tmpdir(), 'frameingoahhgoa-smoke')
fs.mkdirSync(ARTIFACTS, { recursive: true })

const results = []
const check = (name, pass, extra = '') => {
  results.push({ name, pass, extra })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`)
}

const clickText = async (page, text) => {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t))
    if (!btn) throw new Error(`Button not found: ${t}`)
    btn.click()
  }, text)
}

const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

const buildPhotoInPage = async (page) => {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 1200
    c.height = 900
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 1200, 900)
    g.addColorStop(0, '#0e6b45')
    g.addColorStop(1, '#ff3da8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1200, 900)
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.arc(600, 380, 130, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0a3d2e'
    ctx.font = '900 90px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('TEST FACE', 600, 700)
    return c.toDataURL('image/png')
  })
  const photoPath = path.join(ARTIFACTS, 'test-photo.png')
  fs.writeFileSync(photoPath, Buffer.from(dataUrl.split(',')[1], 'base64'))
  return photoPath
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  // 1. Landing page renders + no overflow at all mobile widths
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  const h1 = await page.$eval('h1', (el) => el.textContent)
  check('Landing hero renders', /HACKER/.test(h1 || ''), (h1 || '').trim().slice(0, 40))

  for (const width of [320, 375, 390, 412, 430]) {
    await page.setViewport({ width, height: 844 })
    check(`Landing: no horizontal overflow at ${width}px`, await noOverflow(page))
  }
  await page.setViewport({ width: 390, height: 844 })

  // 2. Upload photo through the whole flow
  const photoPath = await buildPhotoInPage(page)
  await clickText(page, 'Create My ID')
  await page.waitForSelector('input[type=file]', { visible: true })
  check('Upload step reached', true)

  const input = await page.$('input[type=file]')
  await input.uploadFile(photoPath)
  await page.waitForFunction(() => document.body.textContent.includes('Looks good'), { timeout: 15000 })
  check('Photo processed → reposition step', true)

  await clickText(page, 'Looks good')
  await page.waitForSelector('#builder-name', { visible: true })
  await page.type('#builder-name', 'Atharv Kulshrestha')
  await clickText(page, 'AI / ML')
  await clickText(page, 'Get my Builder Class')
  await page.waitForFunction(() => document.body.textContent.includes('Reroll Class'), { timeout: 10000 })
  check('Builder Class generated', true)

  const cls1 = await page.$eval('.font-display.text-4xl', (el) => el.textContent)
  await clickText(page, 'Reroll Class')
  await new Promise((r) => setTimeout(r, 600))
  const cls2 = await page.$eval('.font-display.text-4xl', (el) => el.textContent)
  check('Reroll changes class', cls1 !== cls2, `${cls1} → ${cls2}`)

  await clickText(page, 'Generate my ID')
  await page.waitForFunction(() => document.body.textContent.includes('Download'), { timeout: 15000 })
  check('Output screen reached', true)

  const actualClass = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find((el) => el.textContent.includes('you made it'))
    return p ? p.textContent.split(',')[0] : ''
  })

  // 3. ID canvas rendered
  const pixelInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let colored = 0
    let transparent = 0
    for (let i = 0; i < data.length; i += 40) {
      const a = data[i + 3]
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (a === 0) transparent++
      if (r !== g || g !== b) colored++
    }
    return { w: canvas.width, h: canvas.height, colored, transparent }
  })
  check(
    'ID canvas 1350×1688 with content',
    pixelInfo?.w === 1350 && pixelInfo?.h === 1688 && pixelInfo.colored > 1000,
    JSON.stringify(pixelInfo),
  )

  // 4. Output screen no overflow at all widths
  for (const width of [320, 375, 390, 412, 430]) {
    await page.setViewport({ width, height: 844 })
    check(`Output: no horizontal overflow at ${width}px`, await noOverflow(page))
  }
  await page.setViewport({ width: 390, height: 844 })

  // 5. Download works with correct filename
  const client = await page.createCDPSession()
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: ARTIFACTS })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Download Front'))
    if (btn) btn.click()
  })
  let dlFile = null
  const dlName = 'HHGoa26_Atharv-kulshrestha-id-front.png'
  for (let i = 0; i < 40; i++) {
    const files = fs.readdirSync(ARTIFACTS)
    const match = files.find((f) => f.startsWith('HHGoa26_') && f.endsWith('.png'))
    if (match) {
      dlFile = match
      break
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  check('Download filename is HHGoa26_ naming', !!dlFile, dlFile || 'file not found')
  const dlBytes = dlFile ? fs.statSync(path.join(ARTIFACTS, dlFile)).size : 0
  check('Downloaded PNG is a real file', dlBytes > 10000, `${(dlBytes / 1024).toFixed(0)} KB`)
  await new Promise((r) => setTimeout(r, 500))

  // 6. Share to X opens intent with #FrameInGoa (desktop fallback path)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { value: undefined })
    Object.defineProperty(navigator, 'canShare', { value: undefined })
    window.__intentUrl = null
    window.open = (url) => {
      window.__intentUrl = url
      return null
    }
  })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Share Active Side to X') || b.textContent.includes('Share'))
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 700))
  const intentUrl = await page.evaluate(() => window.__intentUrl)
  let caption = ''
  let intentOk = false
  if (intentUrl) {
    try {
      caption = new URL(intentUrl).searchParams.get('text') || ''
      intentOk =
        caption.includes('#FrameInGoa') &&
        caption.includes(actualClass) &&
        caption.includes('Just framed Atharv')
    } catch {
      intentOk = false
    }
  }
  check('Share opens X intent with caption + #FrameInGoa', intentOk, intentUrl ? `${caption.slice(0, 60)}…` : 'no URL')

  // 7. PFP toggle
  await clickText(page, 'PFP Frame')
  await new Promise((r) => setTimeout(r, 600))
  const pfpInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    return canvas ? { w: canvas.width, h: canvas.height } : null
  })
  check('PFP canvas 1080×1080', pfpInfo?.w === 1080 && pfpInfo?.h === 1080, JSON.stringify(pfpInfo))

  // 8. Squad flow
  await clickText(page, 'Add Teammate')
  await page.waitForSelector('input[placeholder="Teammate name"]', { visible: true })
  const inputs = await page.$$('input[type=file]')
  await inputs[inputs.length - 1].uploadFile(photoPath)
  await new Promise((r) => setTimeout(r, 2500))
  await page.type('input[placeholder="Teammate name"]', 'Jane Doe')
  await page.select('select', 'backend')
  await clickText(page, 'Add to squad')
  await page.waitForFunction(() => document.body.textContent.includes('Download Squad'), { timeout: 10000 })
  const squadInfo = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')]
    const last = canvases[canvases.length - 1]
    return last ? { w: last.width, h: last.height } : null
  })
  check('Squad canvas rendered', squadInfo?.w === 1080, JSON.stringify(squadInfo))

  // 9. Long name does not break rendering
  await clickText(page, 'New ID')
  await page.waitForSelector('input[type=file]', { visible: true })
  const input2 = await page.$('input[type=file]')
  await input2.uploadFile(photoPath)
  await page.waitForFunction(() => document.body.textContent.includes('Looks good'), { timeout: 15000 })
  await clickText(page, 'Looks good')
  await page.waitForSelector('#builder-name', { visible: true })
  await page.type('#builder-name', 'Ramachandran Venkateshwaran Subramaniam')
  await clickText(page, 'Frontend')
  await clickText(page, 'Get my Builder Class')
  await page.waitForFunction(() => document.body.textContent.includes('Reroll Class'), { timeout: 10000 })
  await clickText(page, 'Generate my ID')
  await page.waitForFunction(() => document.body.textContent.includes('Download'), { timeout: 15000 })
  const longName = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let dark = 0
    for (let i = 0; i < img.data.length; i += 24) {
      const r = img.data[i]
      const g = img.data[i + 1]
      const b = img.data[i + 2]
      if (r + g + b < 180) dark++
    }
    return { w: canvas.width, dark }
  })
  check('Long name renders without breaking', longName.w === 1350 && longName.dark > 50000, JSON.stringify(longName))

  // 10. Console errors
  const realErrors = errors.filter((e) => !/Download the React DevTools/i.test(e))
  check('No console/page errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))
} catch (err) {
  check('Smoke run completed', false, String(err))
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
