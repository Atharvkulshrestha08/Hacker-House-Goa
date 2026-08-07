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

  // 1. Dark Emerald Holographic Background with Grid Pattern
  ctx.fillStyle = '#061a14'
  ctx.fillRect(0, 0, W, H)

  // Grid background
  ctx.strokeStyle = 'rgba(0, 230, 153, 0.06)'
  ctx.lineWidth = 2
  const gridSize = 40
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  // Glowing gradient orbs in background
  const grad1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 50, W * 0.2, H * 0.15, 500)
  grad1.addColorStop(0, 'rgba(0, 230, 153, 0.22)')
  grad1.addColorStop(1, 'transparent')
  ctx.fillStyle = grad1
  ctx.fillRect(0, 0, W, H)

  const grad2 = ctx.createRadialGradient(W * 0.8, H * 0.85, 50, W * 0.8, H * 0.85, 600)
  grad2.addColorStop(0, 'rgba(255, 61, 168, 0.25)')
  grad2.addColorStop(1, 'transparent')
  ctx.fillStyle = grad2
  ctx.fillRect(0, 0, W, H)

  // 2. Top Header - Passport Top Bar
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffd23f'
  ctx.font = `700 24px ${BODY}`
  ctx.fillText('OFFICIAL COLLECTIBLE', 80, 70)

  const passId = `PASSPORT #HHG-2026-${(Math.floor(Math.sin(input.name.length || 1) * 8999) + 1000).toString().padStart(4, '0')}`
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = `600 22px ${BODY}`
  ctx.fillText(passId, W - 80, 70)

  // Title block
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 68px ${DISPLAY}`
  ctx.fillText('HACKER HOUSE', 80, 140)

  // Neon Goa badge tag
  ctx.fillStyle = '#ff3da8'
  roundedRect(ctx, 580, 108, 120, 48, 24)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 24px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('गोवा', 640, 132)

  // Verified Holographic Badge
  ctx.strokeStyle = '#00e699'
  ctx.lineWidth = 3
  roundedRect(ctx, W - 180, 102, 100, 100, 50)
  ctx.stroke()
  ctx.fillStyle = 'rgba(0, 230, 153, 0.15)'
  ctx.fill()
  ctx.fillStyle = '#00e699'
  ctx.font = `32px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('✓', W - 130, 138)
  ctx.font = `700 14px ${BODY}`
  ctx.fillText('VERIFIED', W - 130, 172)

  // 3. Central Photo Frame with Neon Glow & Glass Border
  const px = 180
  const py = 220
  const pw = W - px * 2 // 990 width
  const ph = 640

  // Photo Outer Glow
  ctx.shadowColor = '#00e699'
  ctx.shadowBlur = 30
  ctx.strokeStyle = '#00e699'
  ctx.lineWidth = 6
  roundedRect(ctx, px, py, pw, ph, 32)
  ctx.stroke()
  ctx.shadowBlur = 0 // reset shadow

  if (input.photo) {
    drawCoveredImage(ctx, input.photo, px, py, pw, ph, input.photoWidth, input.photoHeight, input.viewport)
  } else {
    ctx.fillStyle = '#0d2d24'
    roundedRect(ctx, px, py, pw, ph, 32)
    ctx.fill()
    ctx.fillStyle = '#00e699'
    ctx.font = `40px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR FACE GOES HERE', W / 2, py + ph / 2)
  }

  // Active status badge on photo
  ctx.fillStyle = 'rgba(6, 26, 20, 0.85)'
  roundedRect(ctx, px + 30, py + 30, 150, 42, 21)
  ctx.fill()
  ctx.fillStyle = '#00e699'
  ctx.beginPath()
  ctx.arc(px + 52, py + 51, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = `700 18px ${BODY}`
  ctx.textAlign = 'left'
  ctx.fillText('ACTIVE', px + 68, py + 51)

  // 4. Builder Identifier & Name Section
  const infoTop = py + ph + 50
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffd23f'
  ctx.font = `700 22px ${BODY}`
  ctx.fillText('BUILDER IDENTIFIER', 80, infoTop)

  // Name (Large Bold White)
  const lines = splitName(input.name)
  ctx.fillStyle = '#ffffff'
  const fitted = fitText(ctx, lines[0], `72px ${DISPLAY}`, W - 160)
  ctx.font = fitted.font
  ctx.fillText(lines[0], 80, infoTop + 55)
  if (lines[1]) {
    const fitted2 = fitText(ctx, lines[1], `72px ${DISPLAY}`, W - 160)
    ctx.font = fitted2.font
    ctx.fillText(lines[1], 80, infoTop + 120)
  }

  const nameOffset = lines.length > 1 ? 120 : 55

  // 5. AI Title / Builder Class Tag
  const classY = infoTop + nameOffset + 45
  ctx.fillStyle = '#ff3da8'
  ctx.font = `700 20px ${BODY}`
  ctx.fillText('✨ AI TITLE', 80, classY)

  ctx.fillStyle = 'rgba(255, 61, 168, 0.12)'
  ctx.strokeStyle = '#ff3da8'
  ctx.lineWidth = 2
  roundedRect(ctx, 80, classY + 15, W - 160, 70, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#ff3da8'
  ctx.font = `900 38px ${DISPLAY}`
  ctx.fillText(`"${input.builderClass}"`, 110, classY + 60)

  // 6. Primary Stack Tag & Meta Info
  const stackY = classY + 115
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = `700 18px ${BODY}`
  ctx.fillText('PRIMARY STACK', 80, stackY)

  const stackLabel = input.stackLabel || 'BUILDER'
  ctx.font = `700 22px ${BODY}`
  const stw = ctx.measureText(stackLabel).width + 48
  ctx.fillStyle = 'rgba(0, 230, 153, 0.15)'
  ctx.strokeStyle = '#00e699'
  ctx.lineWidth = 2
  roundedRect(ctx, 80, stackY + 12, stw, 48, 24)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#00e699'
  ctx.fillText(stackLabel, 104, stackY + 42)

  // 7. Stamp & Barcode Footer
  const footerY = H - 120

  // Officially Approved Holographic Stamp
  ctx.save()
  ctx.translate(W - 240, footerY - 40)
  ctx.rotate(-0.12)
  ctx.strokeStyle = '#ff3da8'
  ctx.lineWidth = 4
  roundedRect(ctx, 0, 0, 220, 80, 14)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255, 61, 168, 0.12)'
  ctx.fill()
  ctx.fillStyle = '#ff3da8'
  ctx.font = `900 24px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('GOA 2026', 110, 32)
  ctx.font = `700 16px ${BODY}`
  ctx.fillText('OFFICIALLY APPROVED', 110, 58)
  ctx.restore()

  // Location & Date
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = `600 24px ${BODY}`
  ctx.fillText('📍 GOA, INDIA    📅 MARCH 2026', 80, footerY)

  // Barcode graphics line
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 65; i++) {
    const bw = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2)
    const bx = 80 + i * 8
    ctx.fillRect(bx, footerY + 25, bw, 35)
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = `14px monospace`
  ctx.fillText('#FrameInGoa · HHG-BOARDING-PASS-2026-VERIFIED', 80, footerY + 78)
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
): void {
  if (type === 'id') renderId(canvas, input)
  else renderPfp(canvas, input)
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
