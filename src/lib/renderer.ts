import type { DecodedImage } from './image'
import { drawCoveredImage, type DrawViewport } from './image'
import { OUTPUT_SIZES, type OutputType } from '../types'
import { drawQR } from './qr'
import { buildGoaSvg, loadSvg } from './goa-illustration'

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
let emblemImgPromise: Promise<HTMLImageElement | null> | null = null

function getEmblemImage(): Promise<HTMLImageElement | null> {
  if (!emblemImgPromise) {
    emblemImgPromise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = '/emblem.png'
    })
  }
  return emblemImgPromise
}

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

  // ═══════════════════════════════════════════════════════════════════════════
  //  LEFT PAGE  — Dark emerald cover with Goa illustration
  // ═══════════════════════════════════════════════════════════════════════════

  // Base: rich dark forest green
  ctx.fillStyle = '#0b2d1e'
  ctx.fillRect(0, 0, halfW, H)

  // Subtle security guilloche lines (very faint gold)
  ctx.strokeStyle = 'rgba(212,175,55,0.04)'
  ctx.lineWidth = 1.2
  for (let gi = 1; gi <= 22; gi++) {
    ctx.beginPath()
    ctx.ellipse(halfW / 2, H * 0.5, gi * 48, gi * 34, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── Header: ISSUED BY / HACKER HOUSE GOA ─────────────────────────────────
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#c9a227'
  ctx.font = `600 19px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('ISSUED BY', halfW / 2, 72)

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 36px ${DISPLAY}`
  ctx.fillText('HACKER HOUSE', halfW / 2, 116)
  ctx.fillStyle = '#c9a227'
  ctx.font = `900 36px ${DISPLAY}`
  ctx.fillText('GOA', halfW / 2, 156)

  // ── Top Right Official Emblem (Government of Goa Seal) ────────────────────
  const emblem = await getEmblemImage()
  if (emblem) {
    ctx.save()
    const embX = halfW - 170
    const embY = 55
    const embW = 120
    const embH = 120

    // Gold circular backing ring
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(embX + embW / 2, embY + embH / 2, 66, 0, Math.PI * 2)
    ctx.stroke()

    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(embX + embW / 2, embY + embH / 2, 60, 0, Math.PI * 2)
    ctx.stroke()

    // Draw Official Emblem Image
    ctx.drawImage(emblem, embX, embY, embW, embH)
    ctx.restore()
  } else {
    // Fallback circular stamp
    ctx.save()
    ctx.translate(halfW - 118, 110)
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 54, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#c9a227'
    ctx.font = `700 13px ${BODY}`
    ctx.textAlign = 'center'
    ctx.fillText('GOVERNMENT OF GOA', 0, 4)
    ctx.restore()
  }


  // ── Main title: BUILDER PASSPORT ─────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 118px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('BUILDER', halfW / 2, 288)
  ctx.fillText('PASSPORT', halfW / 2, 400)

  // Divider with airplane ✈
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, 434); ctx.lineTo(halfW / 2 - 38, 434)
  ctx.moveTo(halfW / 2 + 38, 434); ctx.lineTo(halfW - 100, 434)
  ctx.stroke()
  ctx.fillStyle = '#c9a227'
  ctx.font = `26px ${BODY}`
  ctx.fillText('✈', halfW / 2, 442)

  // ── Illustration Panel ────────────────────────────────────────────────────
  // Panel occupies y: 460 → 1100 (640px tall), padded 70px each side
  const IL = 70
  const IT = 460
  const IW = halfW - 140   // ~1060
  const IH = 640

  // Clip to rounded rect
  ctx.save()
  roundedRect(ctx, IL, IT, IW, IH, 28)
  ctx.clip()

  // Render the SVG illustration (vector quality)
  try {
    const svgImg = await loadSvg(buildGoaSvg())
    ctx.drawImage(svgImg, IL, IT, IW, IH)
  } catch {
    // Fallback: plain green fill if SVG fails
    ctx.fillStyle = '#1a6b38'
    ctx.fillRect(IL, IT, IW, IH)
  }

  ctx.restore()

  // Gold border around illustration
  ctx.strokeStyle = 'rgba(201,162,39,0.55)'
  ctx.lineWidth = 3
  roundedRect(ctx, IL, IT, IW, IH, 28)
  ctx.stroke()


  // ── गोवा / GOA / ONE FRAME WHOLE CREW ─────────────────────────────────────
  // "गोवा" in large warm orange-gold
  ctx.fillStyle = '#e8985e'
  ctx.font = `900 148px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('गोवा', halfW / 2, 1230)

  // "GOA" in white, smaller
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 52px ${DISPLAY}`
  ctx.fillText('GOA', halfW / 2, 1300)

  // Divider tick marks
  ctx.strokeStyle = 'rgba(201,162,39,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(halfW / 2 - 80, 1320); ctx.lineTo(halfW / 2 - 20, 1320)
  ctx.moveTo(halfW / 2 + 20, 1320); ctx.lineTo(halfW / 2 + 80, 1320)
  ctx.stroke()

  // "ONE FRAME, WHOLE CREW" motto
  ctx.fillStyle = '#c9a227'
  ctx.font = `700 22px ${BODY}`
  ctx.fillText('🌴  ONE FRAME, WHOLE CREW  🌴', halfW / 2, 1364)

  // Bottom website / globe
  ctx.fillStyle = 'rgba(201,162,39,0.6)'
  ctx.font = `600 16px ${BODY}`
  ctx.fillText('🌐  hhgoa.com  ·  #FrameInGoa', halfW / 2, 1420)

  // ── Spine shadow (center book fold) ──────────────────────────────────────
  const spineGrad = ctx.createLinearGradient(halfW - 30, 0, halfW + 30, 0)
  spineGrad.addColorStop(0,   'rgba(0,0,0,0.35)')
  spineGrad.addColorStop(0.5, 'rgba(0,0,0,0.70)')
  spineGrad.addColorStop(1,   'rgba(0,0,0,0.35)')
  ctx.fillStyle = spineGrad
  ctx.fillRect(halfW - 22, 0, 44, H)


  // ═══════════════════════════════════════════════════════════════════════════
  //  RIGHT PAGE (PASSPORT IDENTITY DATA PAGE — 3-SECTION PROFESSIONAL GRID)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Background & Security Watermark Pattern ──────────────────────────────
  ctx.fillStyle = '#f8f4e8'
  ctx.fillRect(halfW, 0, halfW, H)

  ctx.save()
  ctx.strokeStyle = 'rgba(10, 61, 46, 0.035)'
  ctx.lineWidth = 1
  for (let ly = 24; ly < H; ly += 24) {
    ctx.beginPath()
    ctx.moveTo(halfW + 20, ly)
    ctx.lineTo(W - 20, ly)
    ctx.stroke()
  }
  ctx.restore()

  // ── Header (centered across full right page) ──────────────────────────────
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#0e1e18'
  ctx.font = `900 56px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HACKER HOUSE GOA 2026', halfW + 600, 78)

  ctx.fillStyle = '#7a3e1a'
  ctx.font = `600 22px ${BODY}`
  ctx.fillText('OFFICIAL BUILDER PASSPORT', halfW + 600, 114)

  ctx.strokeStyle = 'rgba(14, 30, 24, 0.12)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(halfW + 60, 132)
  ctx.lineTo(W - 60, 132)
  ctx.stroke()

  // Rubber stamp (top-right)
  ctx.save()
  ctx.translate(W - 140, 102)
  ctx.rotate(0.07)
  ctx.strokeStyle = '#c04a1f'
  ctx.lineWidth = 3
  roundedRect(ctx, -75, -42, 150, 84, 12)
  ctx.stroke()
  ctx.fillStyle = '#c04a1f'
  ctx.font = `900 25px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('FRAME IN', 0, -6)
  ctx.fillText('GOA 🌴', 0, 26)
  ctx.restore()

  const R = halfW        // 1200
  const PAD = 60         // 60px padding

  // Build ID number deterministically from name
  const nameHash = [...input.name].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0x1a2b)
  const idNum = String(Math.abs(nameHash) % 9000 + 1000)

  // ═══════════════════════════════════════════════════════════════════════════
  //  SECTION 1 (Top 40%: y 145 → 620)
  //  Left: Passport photo & "BUILDER SINCE 2026"
  //  Right: Participant Name & Unified Information Card Panel
  // ═══════════════════════════════════════════════════════════════════════════

  const SEC1_Y = 145
  const PHOTO_X = R + PAD         // 1260
  const PHOTO_Y = SEC1_Y + 10
  const PHOTO_W = 340
  const PHOTO_H = 430

  // ── Photo Frame ───────────────────────────────────────────────────────────
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 5
  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, PHOTO_X - 5, PHOTO_Y - 5, PHOTO_W + 10, PHOTO_H + 10, 20)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 3.5
  roundedRect(ctx, PHOTO_X - 5, PHOTO_Y - 5, PHOTO_W + 10, PHOTO_H + 10, 20)
  ctx.stroke()

  if (input.photo) {
    ctx.save()
    roundedRect(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 16)
    ctx.clip()
    drawCoveredImage(
      ctx, input.photo,
      PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H,
      input.photoWidth, input.photoHeight,
      input.viewport,
    )
    ctx.restore()
  } else {
    ctx.save()
    ctx.fillStyle = '#d0c9b8'
    roundedRect(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 16)
    ctx.fill()
    ctx.fillStyle = '#7a7060'
    ctx.font = `600 22px ${BODY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR PHOTO HERE', PHOTO_X + PHOTO_W / 2, PHOTO_Y + PHOTO_H / 2)
    ctx.restore()
  }

  // "BUILDER SINCE 2026" underneath photo
  ctx.fillStyle = '#7a6e5d'
  ctx.font = `700 16px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText('🗓  BUILDER SINCE 2026', PHOTO_X, PHOTO_Y + PHOTO_H + 32)

  // ── Right Column: Name + Unified Information Panel Card ─────────────────
  const ID_X = PHOTO_X + PHOTO_W + 45   // 1645
  const ID_MAX_W = W - PAD - ID_X       // available width (~695px)

  // Participant Name (large typography)
  const nameLines = splitName(input.name)
  ctx.fillStyle = '#0e1e18'
  ctx.textAlign = 'left'

  const name0fit = fitText(ctx, nameLines[0], `84px ${DISPLAY}`, ID_MAX_W)
  ctx.font = name0fit.font
  ctx.fillText(nameLines[0], ID_X, PHOTO_Y + 68)

  let nameBottomY = PHOTO_Y + 68
  if (nameLines[1]) {
    const name1fit = fitText(ctx, nameLines[1], `84px ${DISPLAY}`, ID_MAX_W)
    ctx.font = name1fit.font
    nameBottomY = PHOTO_Y + 68 + name0fit.size + 14
    ctx.fillText(nameLines[1], ID_X, nameBottomY)
  }

  // ── ONE UNIFIED INFORMATION CARD PANEL ───────────────────────────────────
  const CARD_Y = nameBottomY + 28
  const CARD_W = ID_MAX_W
  const CARD_H = PHOTO_Y + PHOTO_H - CARD_Y // aligns with photo bottom!

  // Card container background
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.06)'
  ctx.shadowBlur = 16
  roundedRect(ctx, ID_X, CARD_Y, CARD_W, CARD_H, 20)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.45)'
  ctx.lineWidth = 2
  roundedRect(ctx, ID_X, CARD_Y, CARD_W, CARD_H, 20)
  ctx.stroke()

  // Panel inner content
  const P_PAD = 24
  let cY = CARD_Y + P_PAD

  // 1. Builder Class Label & Full-Width Badge
  ctx.fillStyle = '#c04a1f'
  ctx.font = `700 16px ${BODY}`
  ctx.fillText('BUILDER CLASS', ID_X + P_PAD, cY + 14)

  // Status Badge (Active) inside top right of this same panel!
  ctx.fillStyle = '#166534'
  roundedRect(ctx, ID_X + CARD_W - P_PAD - 120, cY, 120, 38, 14)
  ctx.fill()
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(ID_X + CARD_W - P_PAD - 102, cY + 19, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 17px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText('ACTIVE', ID_X + CARD_W - P_PAD - 88, cY + 25)

  cY += 30

  // Class Badge occupies most of width
  const classText = `${input.builderClass}  👑`
  ctx.font = `900 30px ${DISPLAY}`
  const badgeW = CARD_W - (P_PAD * 2)
  ctx.fillStyle = '#e0185c'
  roundedRect(ctx, ID_X + P_PAD, cY + 6, badgeW, 56, 16)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.fillText(classText, ID_X + P_PAD + 18, cY + 44)

  cY += 74

  // Subtle inner panel divider line
  ctx.strokeStyle = 'rgba(14, 30, 24, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ID_X + P_PAD, cY)
  ctx.lineTo(ID_X + CARD_W - P_PAD, cY)
  ctx.stroke()

  cY += 16

  // 2. Primary Stack Label & Tech Chips
  ctx.fillStyle = '#c04a1f'
  ctx.font = `700 16px ${BODY}`
  ctx.fillText('PRIMARY STACK', ID_X + P_PAD, cY + 12)

  cY += 24

  const rawStack = input.stackLabel || 'React · Node.js · TypeScript'
  const stackItems = rawStack.split(/[\s·,/|]+/).filter(Boolean).slice(0, 5)
  let chipX = ID_X + P_PAD
  const CHIP_H = 42

  stackItems.forEach((label) => {
    ctx.font = `700 20px ${BODY}`
    const tw = ctx.measureText(label).width
    const chipW = tw + 32
    if (chipX + chipW > ID_X + CARD_W - P_PAD) return
    ctx.fillStyle = '#1a2e24'
    roundedRect(ctx, chipX, cY, chipW, CHIP_H, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.fillText(label, chipX + 16, cY + 28)
    chipX += chipW + 12
  })


  // ═══════════════════════════════════════════════════════════════════════════
  //  SECTION 2 (Middle 35%: y 640 → 1130)
  //  ONE UNIFIED PASSPORT INFORMATION BLOCK (2-Column Structured Layout)
  //  Col A: Builder ID, Origin, Builder Since
  //  Col B: Passport Number, Destination, Mission
  // ═══════════════════════════════════════════════════════════════════════════

  const SEC2_Y = 640
  const BLOCK_X = R + PAD
  const BLOCK_W = halfW - (PAD * 2)
  const BLOCK_H = 460

  // Main unified card enclosure
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.06)'
  ctx.shadowBlur = 18
  roundedRect(ctx, BLOCK_X, SEC2_Y, BLOCK_W, BLOCK_H, 24)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2.5
  roundedRect(ctx, BLOCK_X, SEC2_Y, BLOCK_W, BLOCK_H, 24)
  ctx.stroke()

  // Center vertical divider splitting Column A and Column B
  ctx.strokeStyle = 'rgba(14, 30, 24, 0.09)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(BLOCK_X + BLOCK_W / 2, SEC2_Y + 24)
  ctx.lineTo(BLOCK_X + BLOCK_W / 2, SEC2_Y + BLOCK_H - 24)
  ctx.stroke()

  const colAW = BLOCK_W / 2 - 44
  const colBW = BLOCK_W / 2 - 44

  const colAX = BLOCK_X + 32
  const colBX = BLOCK_X + BLOCK_W / 2 + 32

  const rowHeights = 132

  const colAData = [
    { label: 'BUILDER ID',   val: `HHG26-${idNum}`, icon: '🆔' },
    { label: 'ORIGIN',       val: 'Ghaziabad, India', icon: '📍' },
    { label: 'BUILDER SINCE', val: '2026', icon: '🗓' },
  ]

  const colBData = [
    { label: 'PASSPORT NO.', val: `HHG-26-${idNum}-GOA`, icon: '🛂' },
    { label: 'DESTINATION',  val: 'Goa, India', icon: '🏖' },
    { label: 'MISSION',      val: 'BUILD · SHIP · HACK', icon: '🚀' },
  ]

  // Render Column A
  colAData.forEach((item, idx) => {
    const ry = SEC2_Y + 32 + idx * rowHeights

    // Small uppercase label
    ctx.fillStyle = '#7a6e5d'
    ctx.font = `700 18px ${BODY}`
    ctx.textAlign = 'left'
    ctx.fillText(`${item.icon}  ${item.label}`, colAX, ry)

    // Large value
    ctx.fillStyle = '#0e1e18'
    ctx.font = `900 36px ${DISPLAY}`
    ctx.fillText(item.val, colAX, ry + 48)

    // Subtle divider between rows
    if (idx < 2) {
      ctx.strokeStyle = 'rgba(14, 30, 24, 0.07)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(colAX, ry + 76)
      ctx.lineTo(colAX + colAW, ry + 76)
      ctx.stroke()
    }
  })

  // Render Column B
  colBData.forEach((item, idx) => {
    const ry = SEC2_Y + 32 + idx * rowHeights

    // Small uppercase label
    ctx.fillStyle = '#7a6e5d'
    ctx.font = `700 18px ${BODY}`
    ctx.textAlign = 'left'
    ctx.fillText(`${item.icon}  ${item.label}`, colBX, ry)

    // Large value
    ctx.fillStyle = '#0e1e18'
    ctx.font = `900 36px ${DISPLAY}`
    ctx.fillText(item.val, colBX, ry + 48)

    // Subtle divider between rows
    if (idx < 2) {
      ctx.strokeStyle = 'rgba(14, 30, 24, 0.07)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(colBX, ry + 76)
      ctx.lineTo(colBX + colBW, ry + 76)
      ctx.stroke()
    }
  })


  // ═══════════════════════════════════════════════════════════════════════════
  //  SECTION 3 (Bottom 25%: y 1160 → 1600)
  //  Equal 4-column horizontal distribution:
  //  Col 1 (Left): Barcode & Serial
  //  Col 2 (Mid-Left): Premium Gold Verification Seal
  //  Col 3 (Mid-Right): QR Code Box
  //  Col 4 (Far Right): Official Signature & Authorization
  // ═══════════════════════════════════════════════════════════════════════════

  const SEC3_Y = 1160

  // Thin passport divider line separating Section 2 & 3
  ctx.strokeStyle = 'rgba(14, 30, 24, 0.12)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(R + PAD, SEC3_Y)
  ctx.lineTo(W - PAD, SEC3_Y)
  ctx.stroke()

  const ROW_Y = SEC3_Y + 50

  // 1. BARCODE (Far Left)
  const BC_X = R + PAD
  const BC_W = 270
  const BC_H = 85

  ctx.fillStyle = '#0e1e18'
  let bx = BC_X
  for (let bi = 0; bi < 60 && bx < BC_X + BC_W; bi++) {
    const bw = bi % 4 === 0 ? 6 : bi % 3 === 0 ? 4 : bi % 2 === 0 ? 3 : 2
    const gap = bi % 5 === 0 ? 4 : 3
    ctx.fillRect(bx, ROW_Y, bw, BC_H)
    bx += bw + gap
  }

  ctx.fillStyle = '#7a6e5d'
  ctx.font = `14px monospace`
  ctx.textAlign = 'left'
  ctx.fillText(`HHG-BOARDER-2026-${idNum}`, BC_X, ROW_Y + BC_H + 24)

  // 2. CENTER: Premium Gold Verification Seal
  const SEAL_X = R + halfW / 2 - 40
  const SEAL_Y = ROW_Y + BC_H / 2 + 10

  ctx.save()
  ctx.translate(SEAL_X, SEAL_Y)

  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(0, 0, 68, 0, Math.PI * 2)
  ctx.stroke()

  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, 54, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#c9a227'
  ctx.font = `700 13px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('★  VERIFIED  ★', 0, -34)
  ctx.fillText('★  PASSPORT  ★', 0, 46)

  ctx.font = `900 28px ${DISPLAY}`
  ctx.fillText('HHG', 0, 8)
  ctx.restore()

  // 3. RIGHT: QR Code Box & Official Signature
  const QR_SIZE = 150
  const QR_X = W - PAD - QR_SIZE - 220
  const QR_Y = ROW_Y - 5

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.10)'
  ctx.shadowBlur = 10
  roundedRect(ctx, QR_X - 8, QR_Y - 8, QR_SIZE + 16, QR_SIZE + 16, 16)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 2.5
  roundedRect(ctx, QR_X - 8, QR_Y - 8, QR_SIZE + 16, QR_SIZE + 16, 16)
  ctx.stroke()

  await drawQR(ctx, qrUrl, QR_X, QR_Y, QR_SIZE)


  // Official Signature & Authorization
  const SIG_X = W - PAD - 100
  const SIG_Y = ROW_Y + 15

  ctx.fillStyle = '#0e1e18'
  ctx.font = `italic 38px "Instrument Serif", Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText(input.name || 'Builder', SIG_X, SIG_Y + 36)

  ctx.strokeStyle = '#0e1e18'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(SIG_X - 90, SIG_Y + 48)
  ctx.lineTo(SIG_X + 90, SIG_Y + 48)
  ctx.stroke()

  ctx.fillStyle = '#7a6e5d'
  ctx.font = `700 13px ${BODY}`
  ctx.fillText('AUTHORIZED SIGNATURE', SIG_X, SIG_Y + 68)
  ctx.fillText('HACKER HOUSE GOA', SIG_X, SIG_Y + 86)
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
