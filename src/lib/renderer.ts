import type { DecodedImage } from './image'
import { drawCoveredImage, type DrawViewport } from './image'
import { OUTPUT_SIZES, type OutputType } from '../types'

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

export function renderId(canvas: HTMLCanvasElement, input: RenderInput): void {
  const { width: W, height: H } = OUTPUT_SIZES.id
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W
    canvas.height = H
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  const halfW = W / 2 // 1200px each page

  // ==================== LEFT PAGE (PASSPORT COVER) ====================
  // Dark Emerald Green Background with subtle topographical/curved pattern lines
  ctx.fillStyle = '#0a3525'
  ctx.fillRect(0, 0, halfW, H)

  // Topo contour lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 2
  for (let i = 1; i <= 12; i++) {
    ctx.beginPath()
    ctx.ellipse(halfW / 2, H / 2, i * 80, i * 55, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Header "ISSUED BY"
  ctx.fillStyle = '#f2a85c'
  ctx.font = `700 20px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('ISSUED BY', halfW / 2, 75)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 36px ${DISPLAY}`
  ctx.fillText('HACKER HOUSE', halfW / 2, 120)
  ctx.fillText('GOA', halfW / 2, 160)

  // Top Right Emblem Stamp: "BUILD · SHIP · HACK"
  ctx.save()
  ctx.translate(halfW - 140, 130)
  ctx.strokeStyle = '#f2a85c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 55, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#f2a85c'
  ctx.font = `700 12px ${BODY}`
  ctx.fillText('BUILD · SHIP · HACK', 0, -42)
  ctx.fillText('🌴 🏠 🌴', 0, 8)
  ctx.restore()

  // Large Title: BUILDER PASSPORT
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 100px ${DISPLAY}`
  ctx.fillText('BUILDER', halfW / 2, 280)
  ctx.fillText('PASSPORT', halfW / 2, 375)

  // Small Airplane line accent
  ctx.strokeStyle = '#f2a85c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, 425)
  ctx.lineTo(halfW / 2 - 30, 425)
  ctx.moveTo(halfW / 2 + 30, 425)
  ctx.lineTo(halfW - 100, 425)
  ctx.stroke()
  ctx.fillStyle = '#f2a85c'
  ctx.font = `24px ${BODY}`
  ctx.fillText('✈', halfW / 2, 432)

  // Goan Coastal & Church Landscape Vector Art Illustration
  const skyY = 460
  // Sky / Sunset Gradient
  const skyGrad = ctx.createLinearGradient(0, skyY, 0, skyY + 380)
  skyGrad.addColorStop(0, '#0a3525')
  skyGrad.addColorStop(0.4, '#e07a5f')
  skyGrad.addColorStop(0.7, '#f4a261')
  skyGrad.addColorStop(1, '#2a9d8f')

  ctx.fillStyle = skyGrad
  roundedRect(ctx, 40, skyY, halfW - 80, 360, 24)
  ctx.fill()

  // Sun
  ctx.fillStyle = '#ffb703'
  ctx.beginPath()
  ctx.arc(180, skyY + 160, 45, 0, Math.PI * 2)
  ctx.fill()

  // Goan Church Vector Silhouette
  ctx.fillStyle = '#fff3b0'
  // Main Hall
  ctx.fillRect(halfW / 2 - 70, skyY + 100, 140, 100)
  // Roof Triangle
  ctx.beginPath()
  ctx.moveTo(halfW / 2 - 90, skyY + 100)
  ctx.lineTo(halfW / 2, skyY + 30)
  ctx.lineTo(halfW / 2 + 90, skyY + 100)
  ctx.closePath()
  ctx.fill()
  // Red Roof Accent
  ctx.fillStyle = '#c1121f'
  ctx.beginPath()
  ctx.moveTo(halfW / 2 - 90, skyY + 100)
  ctx.lineTo(halfW / 2, skyY + 30)
  ctx.lineTo(halfW / 2 + 90, skyY + 100)
  ctx.lineTo(halfW / 2 + 90, skyY + 110)
  ctx.lineTo(halfW / 2, skyY + 45)
  ctx.lineTo(halfW / 2 - 90, skyY + 110)
  ctx.closePath()
  ctx.fill()

  // Palm Trees on sides
  ctx.fillStyle = '#0a3525'
  // Left Tree
  ctx.fillRect(70, skyY + 60, 12, 180)
  ctx.beginPath()
  ctx.arc(76, skyY + 60, 40, 0, Math.PI * 2)
  ctx.fill()

  // Right Tree
  ctx.fillRect(halfW - 80, skyY + 80, 12, 160)
  ctx.beginPath()
  ctx.arc(halfW - 74, skyY + 80, 35, 0, Math.PI * 2)
  ctx.fill()

  // Ocean Water Layer
  ctx.fillStyle = '#2a9d8f'
  ctx.fillRect(40, skyY + 200, halfW - 80, 160)

  // Sailboat
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(200, skyY + 220)
  ctx.lineTo(200, skyY + 170)
  ctx.lineTo(230, skyY + 215)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#c1121f'
  ctx.fillRect(190, skyY + 220, 35, 8)

  // Large Devanagari "गोवा" Hindi Header
  ctx.fillStyle = '#f4a261'
  ctx.font = `900 120px ${DISPLAY}`
  ctx.fillText('गोवा', halfW / 2, 1180)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 42px ${DISPLAY}`
  ctx.fillText('GOA', halfW / 2, 1260)

  // Subtitle
  ctx.fillStyle = '#f2a85c'
  ctx.font = `700 22px ${BODY}`
  ctx.fillText('🌴   ONE FRAME, WHOLE CREW   🌴', halfW / 2, 1340)

  // Center Spine / Book Binding Shadow Effect
  const spineGrad = ctx.createLinearGradient(halfW - 30, 0, halfW + 30, 0)
  spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
  spineGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.75)')
  spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
  ctx.fillStyle = spineGrad
  ctx.fillRect(halfW - 25, 0, 50, H)

  // ==================== RIGHT PAGE (PASSPORT DATA & VISA PAGE) ====================
  // Off-white / Cream Vintage Map Textured Page
  ctx.fillStyle = '#f7f4ea'
  ctx.fillRect(halfW, 0, halfW, H)

  // World map watermark background faint sketch
  ctx.fillStyle = 'rgba(42, 157, 143, 0.05)'
  ctx.fillRect(halfW + 40, 40, halfW - 80, H - 80)

  // Top Header: HACKER HOUSE GOA 2026
  ctx.fillStyle = '#10221a'
  ctx.font = `900 52px ${DISPLAY}`
  ctx.textAlign = 'left'
  ctx.fillText('HACKER HOUSE GOA 2026', halfW + 80, 95)

  ctx.fillStyle = '#e07a5f'
  ctx.font = `700 22px ${BODY}`
  ctx.fillText('OFFICIAL BUILDER PASSPORT', halfW + 80, 135)

  // Top Right Stamp: "FRAME IN GOA 🌴"
  ctx.save()
  ctx.translate(W - 180, 110)
  ctx.rotate(0.08)
  ctx.strokeStyle = '#e07a5f'
  ctx.lineWidth = 4
  roundedRect(ctx, -100, -45, 200, 90, 16)
  ctx.stroke()
  ctx.fillStyle = '#e07a5f'
  ctx.font = `900 28px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('FRAME IN', 0, -10)
  ctx.fillText('GOA 🌴', 0, 25)
  ctx.restore()

  // Photo Frame (Left Column of Right Page)
  const px = halfW + 80
  const py = 190
  const pw = 360
  const ph = 460

  ctx.fillStyle = '#2a9d8f'
  roundedRect(ctx, px, py, pw, ph, 24)
  ctx.fill()

  if (input.photo) {
    drawCoveredImage(ctx, input.photo, px, py, pw, ph, input.photoWidth, input.photoHeight, input.viewport)
  } else {
    ctx.fillStyle = '#10221a'
    ctx.font = `32px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR PHOTO HERE', px + pw / 2, py + ph / 2)
  }

  // Right Details Column
  const dx = halfW + 490

  // Name (Large Bold Ink)
  const lines = splitName(input.name)
  ctx.fillStyle = '#10221a'
  ctx.textAlign = 'left'
  const fitted = fitText(ctx, lines[0], `68px ${DISPLAY}`, halfW - 560)
  ctx.font = fitted.font
  ctx.fillText(lines[0], dx, py + 50)
  if (lines[1]) {
    const fitted2 = fitText(ctx, lines[1], `68px ${DISPLAY}`, halfW - 560)
    ctx.font = fitted2.font
    ctx.fillText(lines[1], dx, py + 120)
  }

  const nameOffset = lines.length > 1 ? 120 : 50

  // BUILDER CLASS Section
  const classY = py + nameOffset + 65
  ctx.fillStyle = '#e07a5f'
  ctx.font = `700 20px ${BODY}`
  ctx.fillText('BUILDER CLASS', dx, classY)

  // Pink pill with crown icon
  ctx.fillStyle = '#e07a5f'
  roundedRect(ctx, dx, classY + 14, Math.min(540, halfW - 570), 65, 18)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 34px ${DISPLAY}`
  ctx.fillText(`${input.builderClass} 👑`, dx + 24, classY + 58)

  // PRIMARY STACK Section
  const stackY = classY + 135
  ctx.fillStyle = '#e07a5f'
  ctx.font = `700 20px ${BODY}`
  ctx.fillText('PRIMARY STACK', dx, stackY)

  // Render individual stack pill tags
  const stacks = (input.stackLabel || 'React · Node.js · TypeScript · Python').split(/[\s·,/]+/).filter(Boolean).slice(0, 5)
  let currX = dx
  stacks.forEach((st) => {
    ctx.font = `700 22px ${BODY}`
    const stw = ctx.measureText(st).width + 36
    if (currX + stw > W - 60) return
    ctx.fillStyle = '#10221a'
    roundedRect(ctx, currX, stackY + 14, stw, 48, 14)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillText(st, currX + 18, stackY + 46)
    currX += stw + 14
  })

  // Horizontal Separator Line
  const gridY = 700
  ctx.strokeStyle = 'rgba(16, 34, 26, 0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(halfW + 60, gridY)
  ctx.lineTo(W - 60, gridY)
  ctx.stroke()

  // 6 Metadata Grid Columns (2 rows x 3 cols)
  const cols = [
    { label: 'BUILDER ID', val: `HHG26-${(Math.floor(Math.sin(input.name.length || 1) * 8999) + 1000)}` },
    { label: 'PASSPORT NO.', val: `HHG-26-${(Math.floor(Math.sin(input.name.length || 1) * 8999) + 1000)}-GOA` },
    { label: 'STATUS', val: '🟢 ACTIVE', isStatus: true },
    { label: 'ORIGIN', val: '📍 India' },
    { label: 'DESTINATION', val: '📍 Goa, India' },
    { label: 'MISSION', val: 'BUILD · SHIP · HACK' },
  ]

  const colW = (halfW - 240) / 3
  cols.forEach((col, idx) => {
    const c = idx % 3
    const r = Math.floor(idx / 3)
    const gx = halfW + 80 + c * colW
    const gy = gridY + 35 + r * 110

    ctx.fillStyle = col.isStatus ? '#e07a5f' : '#6c757d'
    ctx.font = `700 16px ${BODY}`
    ctx.fillText(col.label, gx, gy)

    ctx.fillStyle = '#10221a'
    ctx.font = `900 28px ${DISPLAY}`
    ctx.fillText(col.val, gx, gy + 38)
  })

  // QR Code Box (Bottom Right)
  const qrX = W - 260
  const qrY = gridY + 155
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e07a5f'
  ctx.lineWidth = 3
  roundedRect(ctx, qrX, qrY, 180, 180, 20)
  ctx.fill()
  ctx.stroke()

  // Draw simple decorative QR graphic matrix
  ctx.fillStyle = '#10221a'
  for (let qx = 0; qx < 6; qx++) {
    for (let qy = 0; qy < 6; qy++) {
      if ((qx + qy) % 2 === 0 || qx === qy) {
        ctx.fillRect(qrX + 25 + qx * 22, qrY + 25 + qy * 22, 16, 16)
      }
    }
  }

  // Footer: Barcode & Circular Gold Stamp & Signature
  const footerY = H - 240

  // Barcode Lines
  ctx.fillStyle = '#10221a'
  for (let i = 0; i < 70; i++) {
    const bw = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2)
    const bx = halfW + 80 + i * 7
    ctx.fillRect(bx, footerY + 50, bw, 65)
  }
  ctx.fillStyle = '#6c757d'
  ctx.font = `14px monospace`
  ctx.fillText('HHG-BOARDER-2026-VERIFIED', halfW + 80, footerY + 135)

  // Circular Gold Stamp Emblem "VERIFIED HHG"
  ctx.save()
  ctx.translate(halfW + 720, footerY + 80)
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(0, 0, 65, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 54, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#b8860b'
  ctx.font = `900 24px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HHG', 0, 8)
  ctx.font = `700 14px ${BODY}`
  ctx.fillText('★ VERIFIED ★', 0, 35)
  ctx.fillText('★ PASSPORT ★', 0, -25)
  ctx.restore()

  // Cursive Authorized Signature
  ctx.fillStyle = '#10221a'
  ctx.font = `italic 38px "Instrument Serif", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText('Atharv Kulshrestha', W - 220, footerY + 70)
  ctx.strokeStyle = '#10221a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W - 320, footerY + 82)
  ctx.lineTo(W - 120, footerY + 82)
  ctx.stroke()
  ctx.fillStyle = '#6c757d'
  ctx.font = `700 14px ${BODY}`
  ctx.fillText('AUTHORIZED SIGNATURE', W - 220, footerY + 105)
  ctx.fillText('HACKER HOUSE GOA', W - 220, footerY + 124)
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

export function renderOutput(
  canvas: HTMLCanvasElement,
  type: OutputType,
  input: RenderInput,
  side: 'front' | 'back' = 'front',
): void {
  if (type === 'id') {
    if (side === 'back') renderIdBack(canvas, input)
    else renderId(canvas, input)
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
