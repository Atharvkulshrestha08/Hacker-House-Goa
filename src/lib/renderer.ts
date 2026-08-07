import type { DecodedImage } from './image'
import { drawCoveredImage, type DrawViewport } from './image'
import { OUTPUT_SIZES, type OutputType } from '../types'
import { drawQR } from './qr'

export interface RenderInput {
  name: string
  stackLabel: string
  builderClass: string
  photo: DecodedImage | null
  photoWidth: number
  photoHeight: number
  viewport: DrawViewport
  isSquad?: boolean
}

const FOREST = '#0a3d2e'
const SUN = '#ffd23f'
const BUTTER = '#ffe98a'
const PUNCH = '#ff3da8'
const CREAM = '#faf6ec'
const INK = '#10221a'

const DISPLAY = '"Anton", "Baloo 2", sans-serif'
const BODY = '"Space Grotesk", system-ui, sans-serif'

let fontsLoaded: Promise<void> | null = null

export function ensureFonts(): Promise<void> {
  if (!fontsLoaded) {
    fontsLoaded = (async () => {
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('400 40px Anton'),
            document.fonts.load('400 90px Anton'),
            document.fonts.load('800 80px "Baloo 2"'),
            document.fonts.load('400 40px "Instrument Serif"'),
            document.fonts.load('700 30px "Space Grotesk"'),
          ]),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ])
      } catch {
        // fonts are decorative; continue rendering regardless
      }
    })()
  }
  return fontsLoaded
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
): { font: string; size: number } {
  let size = parseFloat(font.match(/(\d+)px/)?.[1] ?? '0')
  const family = font.replace(/^\d+px\s+/, '')
  let current = size
  ctx.font = `${current}px ${family}`
  while (current > 18 && ctx.measureText(text).width > maxWidth) {
    current -= 2
    ctx.font = `${current}px ${family}`
  }
  return { font: `${current}px ${family}`, size: current }
}

function splitName(name: string): string[] {
  const trimmed = name.trim().replace(/\s+/g, ' ').toUpperCase()
  if (!trimmed) return ['YOUR', 'NAME']
  const tokens = trimmed.split(' ')
  if (tokens.length === 1) return [tokens[0]]
  if (tokens.length === 2) return tokens
  return [tokens[0], tokens.slice(1).join(' ')]
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderId(canvas: HTMLCanvasElement, input: RenderInput, qrUrl = ''): Promise<void> {
  const { width: W, height: H } = OUTPUT_SIZES.id
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W
    canvas.height = H
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  const halfW = W / 2 // 1200px each page

  // ==================== LEFT PAGE (PASSPORT COVER) ====================
  // Dark Emerald Green Background (#062a1c) with luxury paper texture feel
  ctx.fillStyle = '#062a1c'
  ctx.fillRect(0, 0, halfW, H)

  // Topographic Guilloché Security Pattern (Ellipses with subtle gold accent)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)'
  ctx.lineWidth = 1.5
  for (let i = 1; i <= 20; i++) {
    ctx.beginPath()
    ctx.ellipse(halfW / 2, H / 2, i * 55, i * 38, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Header "ISSUED BY HACKER HOUSE GOA"
  ctx.fillStyle = '#d4af37'
  ctx.font = `700 18px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('ISSUED BY', halfW / 2, 80)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 32px ${DISPLAY}`
  ctx.fillText('HACKER HOUSE GOA', halfW / 2, 125)

  // Top Right Emblem Stamp: "BUILD · SHIP · HACK"
  ctx.save()
  ctx.translate(halfW - 130, 110)
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, 48, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#d4af37'
  ctx.font = `700 10px ${BODY}`
  ctx.fillText('BUILD · SHIP · HACK', 0, -36)
  ctx.fillText('🌴 🏠 🌴', 0, 6)
  ctx.restore()

  // Large Title: BUILDER PASSPORT
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 105px ${DISPLAY}`
  ctx.fillText('BUILDER', halfW / 2, 260)
  ctx.fillText('PASSPORT', halfW / 2, 360)

  // Small Flight Path Line Accent
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 405)
  ctx.lineTo(halfW / 2 - 35, 405)
  ctx.moveTo(halfW / 2 + 35, 405)
  ctx.lineTo(halfW - 120, 405)
  ctx.stroke()
  ctx.fillStyle = '#d4af37'
  ctx.font = `20px ${BODY}`
  ctx.fillText('✈', halfW / 2, 412)

  // Goan Coastal & Architecture Editorial Illustration (occupying 500px height)
  const skyY = 440
  const illH = 500
  const illW = halfW - 160 // 1040px wide

  // Sunset Gradient Layer
  const skyGrad = ctx.createLinearGradient(0, skyY, 0, skyY + illH)
  skyGrad.addColorStop(0, '#062a1c')
  skyGrad.addColorStop(0.35, '#c85a32')
  skyGrad.addColorStop(0.65, '#e8985e')
  skyGrad.addColorStop(1, '#1e756b')

  ctx.fillStyle = skyGrad
  roundedRect(ctx, 80, skyY, illW, illH, 24)
  ctx.fill()

  // Sun
  ctx.fillStyle = '#f4c430'
  ctx.beginPath()
  ctx.arc(220, skyY + 220, 55, 0, Math.PI * 2)
  ctx.fill()

  // Portuguese Goan Church Silhouette
  ctx.fillStyle = '#fcf8ec'
  ctx.fillRect(halfW / 2 - 80, skyY + 160, 160, 140)
  ctx.beginPath()
  ctx.moveTo(halfW / 2 - 100, skyY + 160)
  ctx.lineTo(halfW / 2, skyY + 70)
  ctx.lineTo(halfW / 2 + 100, skyY + 160)
  ctx.closePath()
  ctx.fill()

  // Roof Lines Accent
  ctx.fillStyle = '#9e2a2b'
  ctx.beginPath()
  ctx.moveTo(halfW / 2 - 100, skyY + 160)
  ctx.lineTo(halfW / 2, skyY + 70)
  ctx.lineTo(halfW / 2 + 100, skyY + 160)
  ctx.lineTo(halfW / 2 + 100, skyY + 172)
  ctx.lineTo(halfW / 2, skyY + 85)
  ctx.lineTo(halfW / 2 - 100, skyY + 172)
  ctx.closePath()
  ctx.fill()

  // Coastal Palms
  ctx.fillStyle = '#062a1c'
  ctx.fillRect(120, skyY + 100, 14, 240)
  ctx.beginPath()
  ctx.arc(127, skyY + 100, 50, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillRect(halfW - 130, skyY + 120, 14, 220)
  ctx.beginPath()
  ctx.arc(halfW - 123, skyY + 120, 45, 0, Math.PI * 2)
  ctx.fill()

  // Ocean Water Horizon
  ctx.fillStyle = '#1e756b'
  ctx.fillRect(80, skyY + 300, illW, 200)

  // Red Sailboat
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(240, skyY + 320)
  ctx.lineTo(240, skyY + 260)
  ctx.lineTo(275, skyY + 315)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#9e2a2b'
  ctx.fillRect(230, skyY + 320, 45, 10)

  // Large Hindi Title "गोवा" & English GOA
  ctx.fillStyle = '#e8985e'
  ctx.font = `900 135px ${DISPLAY}`
  ctx.fillText('गोवा', halfW / 2, 1190)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 48px ${DISPLAY}`
  ctx.fillText('GOA', halfW / 2, 1270)

  // Subtitle Motto
  ctx.fillStyle = '#d4af37'
  ctx.font = `700 20px ${BODY}`
  ctx.fillText('🌴   ONE FRAME, WHOLE CREW   🌴', halfW / 2, 1360)

  // Center Spine Shadow Split
  const spineGrad = ctx.createLinearGradient(halfW - 30, 0, halfW + 30, 0)
  spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
  spineGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)')
  spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
  ctx.fillStyle = spineGrad
  ctx.fillRect(halfW - 25, 0, 50, H)

  // ==================== RIGHT PAGE (PASSPORT IDENTITY DATA PAGE) ====================
  // Warm Ivory Security Paper Background
  ctx.fillStyle = '#f9f6ed'
  ctx.fillRect(halfW, 0, halfW, H)

  // Faint map watermark lines
  ctx.strokeStyle = 'rgba(30, 117, 107, 0.035)'
  ctx.lineWidth = 1
  for (let y = 40; y < H; y += 28) {
    ctx.beginPath()
    ctx.moveTo(halfW + 30, y)
    ctx.lineTo(W - 30, y)
    ctx.stroke()
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#0f241c'
  ctx.font = `900 52px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HACKER HOUSE GOA 2026', halfW + halfW / 2, 88)

  ctx.fillStyle = '#6c4a2a'
  ctx.font = `700 22px ${BODY}`
  ctx.fillText('OFFICIAL BUILDER PASSPORT', halfW + halfW / 2, 126)

  // ── Rubber Stamp (top right) ─────────────────────────────────────────────
  ctx.save()
  ctx.translate(W - 170, 120)
  ctx.rotate(0.06)
  ctx.strokeStyle = '#c85a32'
  ctx.lineWidth = 3.5
  roundedRect(ctx, -95, -52, 190, 104, 14)
  ctx.stroke()
  ctx.fillStyle = '#c85a32'
  ctx.font = `900 30px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('FRAME IN', 0, -10)
  ctx.fillText('GOA 🌴', 0, 28)
  ctx.restore()

  // ── Photo section (left column) ──────────────────────────────────────────
  const px = halfW + 80
  const py = 170
  const pw = 380
  const ph = 490

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.20)'
  ctx.shadowBlur = 22
  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, px - 8, py - 8, pw + 16, ph + 16, 26)
  ctx.fill()
  ctx.shadowBlur = 0

  // Gold border
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 3.5
  roundedRect(ctx, px - 8, py - 8, pw + 16, ph + 16, 26)
  ctx.stroke()

  if (input.photo) {
    drawCoveredImage(ctx, input.photo, px, py, pw, ph, input.photoWidth, input.photoHeight, input.viewport)
  } else {
    ctx.fillStyle = '#0f241c'
    ctx.fillRect(px, py, pw, ph)
    ctx.fillStyle = '#ffffff'
    ctx.font = `28px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR PHOTO HERE', px + pw / 2, py + ph / 2)
  }

  // Active badge over photo
  ctx.fillStyle = 'rgba(15,36,28,0.85)'
  roundedRect(ctx, px + 16, py + 16, 140, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#2a9d8f'
  ctx.beginPath()
  ctx.arc(px + 36, py + 36, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 17px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText('ACTIVE', px + 52, py + 42)

  // "Builder Since" micro-label below photo
  ctx.fillStyle = '#6c757d'
  ctx.font = `600 16px ${BODY}`
  ctx.fillText('BUILDER SINCE 2026', px, py + ph + 34)

  // ── Identity column (right of photo) ─────────────────────────────────────
  const dx = halfW + 510
  const rightColMaxW = W - 80 - dx

  // NAME – large bold
  const lines = splitName(input.name)
  ctx.fillStyle = '#0f241c'
  ctx.textAlign = 'left'
  const fitted = fitText(ctx, lines[0], `76px ${DISPLAY}`, rightColMaxW)
  ctx.font = fitted.font
  ctx.fillText(lines[0], dx, py + 65)
  if (lines[1]) {
    const fitted2 = fitText(ctx, lines[1], `76px ${DISPLAY}`, rightColMaxW)
    ctx.font = fitted2.font
    ctx.fillText(lines[1], dx, py + 65 + fitted.size + 14)
  }

  const nameOffset = lines.length > 1 ? 65 + fitted.size + 14 : 65

  // BUILDER CLASS label
  const classY = py + nameOffset + 52
  ctx.fillStyle = '#c85a32'
  ctx.font = `700 17px ${BODY}`
  ctx.fillText('BUILDER CLASS', dx, classY)

  // Builder class pink badge
  const badgeW = Math.min(rightColMaxW, 540)
  ctx.fillStyle = '#e8355c'
  roundedRect(ctx, dx, classY + 10, badgeW, 62, 18)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 32px ${DISPLAY}`
  ctx.textAlign = 'left'
  ctx.fillText(`${input.builderClass} 👑`, dx + 22, classY + 56)

  // PRIMARY STACK label
  const stackY = classY + 62 + 34
  ctx.fillStyle = '#c85a32'
  ctx.font = `700 17px ${BODY}`
  ctx.fillText('PRIMARY STACK', dx, stackY)

  // Stack chips
  const stacks = (input.stackLabel || 'React · Node.js · TypeScript · Python').split(/[\s·,/]+/).filter(Boolean).slice(0, 5)
  let currX = dx
  stacks.forEach((st) => {
    ctx.font = `700 20px ${BODY}`
    const stw = ctx.measureText(st).width + 32
    if (currX + stw > W - 60) return
    ctx.fillStyle = '#0f241c'
    roundedRect(ctx, currX, stackY + 10, stw, 44, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.fillText(st, currX + 16, stackY + 39)
    currX += stw + 14
  })

  // ── Divider ───────────────────────────────────────────────────────────────
  const gridY = Math.max(py + ph + 60, stackY + 100)
  ctx.strokeStyle = 'rgba(15,36,28,0.14)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(halfW + 60, gridY)
  ctx.lineTo(W - 60, gridY)
  ctx.stroke()

  // ── Passport Details Grid ──────────────────────────────────────────────────
  const idNum = String(Math.abs(Math.floor(Math.sin(input.name.length * 7 + 1) * 8999)) + 1000).slice(-4)
  const cols = [
    { label: 'BUILDER ID',   val: `HHG26-${idNum}`,             icon: '' },
    { label: 'PASSPORT NO.', val: `HHG-26-${idNum}-GOA`,        icon: '' },
    { label: 'STATUS',       val: 'ACTIVE',                      icon: '🟢', isStatus: true },
    { label: 'ORIGIN',       val: 'Ghaziabad, India',            icon: '📍' },
    { label: 'DESTINATION',  val: 'Goa, India',                  icon: '📍' },
    { label: 'MISSION',      val: 'BUILD · SHIP · HACK',         icon: '' },
  ]

  const colW = (halfW - 220) / 3
  const rowH = 118
  cols.forEach((col, idx) => {
    const c = idx % 3
    const r = Math.floor(idx / 3)
    const gx = halfW + 80 + c * colW
    const gy = gridY + 44 + r * rowH

    // Label
    ctx.fillStyle = col.isStatus ? '#c85a32' : '#999'
    ctx.font = `700 15px ${BODY}`
    ctx.textAlign = 'left'
    ctx.fillText(col.label, gx, gy)

    // Value (with icon prefix if any)
    ctx.fillStyle = col.isStatus ? '#0a3d2e' : '#0f241c'
    ctx.font = `900 28px ${DISPLAY}`
    if (col.isStatus) {
      // Green active badge
      roundedRect(ctx, gx, gy + 10, 120, 44, 12)
      ctx.fillStyle = '#14532d'
      ctx.fill()
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(gx + 18, gy + 32, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `700 20px ${BODY}`
      ctx.fillText('ACTIVE', gx + 32, gy + 38)
    } else {
      ctx.fillStyle = '#0f241c'
      ctx.fillText((col.icon ? col.icon + ' ' : '') + col.val, gx, gy + 42)
    }
  })

  // ── QR Code (bottom right of right page, same row as grid row 2) ──────────
  const qrSize = 164
  const qrX = W - qrSize - 70
  const qrY = gridY + 44 + rowH + 10

  // White rounded background for QR
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 2.5
  roundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 18)
  ctx.fill()
  ctx.stroke()

  // Draw real QR or placeholder
  if (qrUrl) {
    await drawQR(ctx, qrUrl, qrX, qrY, qrSize)
  } else {
    // Fallback decorative QR pattern
    ctx.fillStyle = '#0f241c'
    for (let qxi = 0; qxi < 6; qxi++) {
      for (let qyi = 0; qyi < 6; qyi++) {
        if ((qxi + qyi) % 2 === 0 || qxi === qyi) {
          ctx.fillRect(qrX + 14 + qxi * 23, qrY + 14 + qyi * 23, 17, 17)
        }
      }
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = H - 230

  // Barcode
  ctx.fillStyle = '#0f241c'
  for (let i = 0; i < 72; i++) {
    const bw = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2)
    const bx = halfW + 80 + i * 7
    if (bx + bw > halfW + 600) break
    ctx.fillRect(bx, footerY + 40, bw, 65)
  }
  ctx.fillStyle = '#999'
  ctx.font = `13px monospace`
  ctx.textAlign = 'left'
  ctx.fillText(`HHG-BOARDER-2026-${idNum}`, halfW + 80, footerY + 124)

  // Vintage Gold Seal Emblem
  ctx.save()
  ctx.translate(halfW + 730, footerY + 78)
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.arc(0, 0, 64, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 52, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#d4af37'
  ctx.font = `900 24px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HHG', 0, 8)
  ctx.font = `700 13px ${BODY}`
  ctx.fillText('★ VERIFIED ★', 0, 34)
  ctx.fillText('★ PASSPORT ★', 0, -22)
  ctx.restore()

  // Cursive Signature
  ctx.fillStyle = '#0f241c'
  ctx.font = `italic 38px "Instrument Serif", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText(input.name || 'Builder', W - 195, footerY + 62)
  ctx.strokeStyle = '#0f241c'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W - 310, footerY + 74)
  ctx.lineTo(W - 80, footerY + 74)
  ctx.stroke()
  ctx.fillStyle = '#999'
  ctx.font = `700 13px ${BODY}`
  ctx.fillText('AUTHORIZED SIGNATURE', W - 195, footerY + 98)
  ctx.fillText('HACKER HOUSE GOA', W - 195, footerY + 116)
}


export function renderIdBack(canvas: HTMLCanvasElement, input: RenderInput): void {
  const { width: W, height: H } = OUTPUT_SIZES.id
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W
    canvas.height = H
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  // 1. Dark Emerald Holographic Background
  ctx.fillStyle = '#061a14'
  ctx.fillRect(0, 0, W, H)

  // Cyber Grid pattern
  ctx.strokeStyle = 'rgba(0, 230, 153, 0.05)'
  ctx.lineWidth = 2
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  // 2. Magnetic Stripe Band
  ctx.fillStyle = '#0a100d'
  ctx.fillRect(0, 120, W, 180)
  ctx.fillStyle = 'rgba(255, 210, 63, 0.15)'
  ctx.fillRect(0, 150, W, 120)

  // 3. Signature Panel / Hologram Chip
  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, 80, 360, W - 320, 90, 12)
  ctx.fill()
  ctx.fillStyle = 'rgba(10, 61, 46, 0.5)'
  ctx.font = `italic 28px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText(`AUTHENTICATED: ${input.name.toUpperCase() || 'HHG BUILDER'}`, 110, 415)

  // Hologram Security Emblem
  ctx.save()
  ctx.translate(W - 180, 360)
  const chipGrad = ctx.createLinearGradient(0, 0, 100, 90)
  chipGrad.addColorStop(0, '#ffd23f')
  chipGrad.addColorStop(0.5, '#ff3da8')
  chipGrad.addColorStop(1, '#00e699')
  ctx.fillStyle = chipGrad
  roundedRect(ctx, 0, 0, 100, 90, 16)
  ctx.fill()
  ctx.fillStyle = '#061a14'
  ctx.font = `900 24px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HHG', 50, 52)
  ctx.restore()

  // 4. Large Tropical Palms Crest Graphic
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(0, 230, 153, 0.08)'
  ctx.font = `900 220px ${DISPLAY}`
  ctx.fillText('🌴', W / 2, 780)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 64px ${DISPLAY}`
  ctx.fillText('HACKER HOUSE GOA 2026', W / 2, 880)

  ctx.fillStyle = '#ffd23f'
  ctx.font = `700 28px ${BODY}`
  ctx.fillText('BUILD · SHIP · HACK', W / 2, 930)

  // 5. Official Guidelines Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 2
  roundedRect(ctx, 80, 1000, W - 160, 450, 24)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#00e699'
  ctx.font = `700 22px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText('OFFICIAL PARTICIPANT RULES & BENEFIT PASS', 120, 1050)

  const rules = [
    '• Grants entry to main hacker venue, workshops, and side events.',
    '• Non-transferable card assigned exclusively to registered builders.',
    '• Scannable QR & Barcode code verifies leaderboard standing.',
    '• Tag your projects with #FrameInGoa for official showcase placement.',
    '• Organized by 2:47PM Studio · 28–31 Oct 2026 · Goa, India',
  ]

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.font = `400 20px ${BODY}`
  rules.forEach((rule, idx) => {
    ctx.fillText(rule, 120, 1100 + idx * 52)
  })

  // 6. QR Code Placeholder Graphic
  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, W / 2 - 60, 1490, 120, 120, 16)
  ctx.fill()
  ctx.fillStyle = '#061a14'
  ctx.font = `900 48px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('QR', W / 2, 1565)

  // Bottom text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = `16px monospace`
  ctx.fillText('#FrameInGoa · OFFICIAL BACKEND IDENTITY PASS · HHGOA.COM', W / 2, H - 30)
}

export function renderPfp(canvas: HTMLCanvasElement, input: RenderInput): void {
  const { width: S, height: SH } = OUTPUT_SIZES.pfp
  if (canvas.width !== S || canvas.height !== SH) {
    canvas.width = S
    canvas.height = SH
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, SH)

  // Dark Emerald Holographic Background
  ctx.fillStyle = '#061a14'
  ctx.fillRect(0, 0, S, SH)

  // Outer Neon Pink Border
  ctx.strokeStyle = '#ff3da8'
  ctx.lineWidth = 12
  ctx.strokeRect(6, 6, S - 12, SH - 12)

  // Photo Center Area
  const border = 40
  const topBand = 130
  if (input.photo) {
    drawCoveredImage(
      ctx,
      input.photo,
      border,
      topBand,
      S - border * 2,
      SH - topBand - border * 2,
      input.photoWidth,
      input.photoHeight,
      input.viewport,
    )
  } else {
    ctx.fillStyle = '#0d2d24'
    ctx.fillRect(border, topBand, S - border * 2, SH - topBand - border * 2)
  }

  // Inner Neon Emerald Border
  ctx.strokeStyle = '#00e699'
  ctx.lineWidth = 6
  ctx.strokeRect(border, topBand, S - border * 2, SH - topBand - border * 2)

  // Top Title Bar
  ctx.fillStyle = '#061a14'
  ctx.fillRect(40, 20, S - 80, 95)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 44px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HACKER HOUSE GOA 2026', S / 2, 65)

  ctx.fillStyle = '#ffd23f'
  ctx.font = `700 24px ${BODY}`
  ctx.fillText(`OFFICIAL BUILDER · ${input.builderClass.toUpperCase()}`, S / 2, 100)

  // Bottom Tag
  ctx.fillStyle = '#061a14'
  ctx.fillRect(60, SH - 70, S - 120, 50)
  ctx.strokeStyle = '#ff3da8'
  ctx.lineWidth = 3
  ctx.strokeRect(60, SH - 70, S - 120, 50)

  ctx.fillStyle = '#ff3da8'
  ctx.font = `900 28px ${DISPLAY}`
  ctx.fillText('#FrameInGoa', S / 2, SH - 36)
}

export async function renderOutput(
  canvas: HTMLCanvasElement,
  type: OutputType,
  input: RenderInput,
  side: 'front' | 'back' = 'front',
  qrUrl = '',
): Promise<void> {
  if (type === 'id') {
    if (side === 'back') renderIdBack(canvas, input)
    else await renderId(canvas, input, qrUrl)

  } else {
    renderPfp(canvas, input)
  }
}

export interface SquadMember {
  name: string
  stackLabel: string
  builderClass: string
  photo: DecodedImage | null
  photoWidth: number
  photoHeight: number
}

export function renderSquad(canvas: HTMLCanvasElement, members: SquadMember[]): void {
  const S = 1080
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, S)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = FOREST
  ctx.fillRect(0, 0, S, S)

  // header
  ctx.fillStyle = CREAM
  ctx.font = `40px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HACKER HOUSE', S / 2, 78)
  ctx.fillStyle = BUTTER
  ctx.font = `66px ${DISPLAY}`
  ctx.fillText('गोवा 2026', S / 2, 148)
  ctx.fillStyle = SUN
  ctx.font = `700 26px ${BODY}`
  ctx.fillText('THE CREW IS COMING.', S / 2, 188)

  const cardW = 316
  const gap = 24
  const count = Math.max(1, members.length)
  const groupW = count * cardW + (count - 1) * gap
  const startX = (S - groupW) / 2
  const cardY = 220
  const cardH = 765

  members.slice(0, 3).forEach((m, i) => {
    const cx = startX + i * (cardW + gap)
    // card
    ctx.fillStyle = CREAM
    roundedRect(ctx, cx, cardY, cardW, cardH, 24)
    ctx.fill()
    ctx.strokeStyle = PUNCH
    ctx.lineWidth = 5
    ctx.stroke()

    // photo
    const pad = 18
    const pw = cardW - pad * 2
    const ph = 284
    if (m.photo) {
      ctx.fillStyle = PUNCH
      roundedRect(ctx, cx + pad, cardY + pad, pw, ph, 16)
      ctx.fill()
      drawCoveredImage(
        ctx,
        m.photo,
        cx + pad,
        cardY + pad,
        pw,
        ph,
        m.photoWidth,
        m.photoHeight,
        { x: 0, y: 0, scale: 1 },
      )
    } else {
      ctx.fillStyle = SUN
      roundedRect(ctx, cx + pad, cardY + pad, pw, ph, 16)
      ctx.fill()
      ctx.fillStyle = INK
      ctx.font = `26px ${DISPLAY}`
      ctx.textAlign = 'center'
      ctx.fillText('YOUR FACE HERE', cx + cardW / 2, cardY + pad + ph / 2)
    }

    // name
    const nameLines = splitName(m.name)
    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    const nameTop = cardY + pad + ph + 26
    const fitted = fitText(ctx, nameLines[0], `36px ${DISPLAY}`, cardW - 24)
    ctx.font = fitted.font
    ctx.fillText(nameLines[0], cx + cardW / 2, nameTop + fitted.size * 0.76)
    if (nameLines[1]) {
      ctx.font = fitted.font
      ctx.fillText(nameLines[1], cx + cardW / 2, nameTop + fitted.size * 0.76 + 44)
    }

    // stack
    ctx.fillStyle = INK
    ctx.font = `700 22px ${BODY}`
    ctx.fillText(m.stackLabel, cx + cardW / 2, nameTop + 128)

    // class
    ctx.fillStyle = PUNCH
    ctx.font = `700 18px ${BODY}`
    ctx.fillText('BUILDER CLASS', cx + cardW / 2, nameTop + 164)
    ctx.fillStyle = INK
    const clsFit = fitText(ctx, m.builderClass, `26px ${DISPLAY}`, cardW - 24)
    ctx.font = clsFit.font
    ctx.fillText(m.builderClass, cx + cardW / 2, nameTop + 198)
  })

  // footer
  ctx.fillStyle = FOREST
  ctx.fillRect(0, S - 90, S, 90)
  ctx.fillStyle = SUN
  ctx.font = `34px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('#FrameInGoa', S / 2, S - 38)
}
