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

function drawHeader(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = FOREST
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = CREAM
  ctx.font = `38px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('HACKER HOUSE', w / 2, 86)
  ctx.fillStyle = BUTTER
  ctx.font = `80px ${DISPLAY}`
  ctx.fillText('गोवा 2026', w / 2, 176)
}

function renderName(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  maxWidth: number,
  top: number,
  lineGap: number,
): void {
  const lines = splitName(name)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  const base = lines.length > 1 ? `92px ${DISPLAY}` : `104px ${DISPLAY}`
  const fitted = fitText(ctx, lines[0], base, maxWidth)
  ctx.font = fitted.font
  ctx.fillText(lines[0], cx, top + fitted.size * 0.78)
  if (lines[1]) {
    ctx.font = fitted.font
    ctx.fillText(lines[1], cx, top + fitted.size * 0.78 + lineGap)
  }
}

export function renderId(canvas: HTMLCanvasElement, input: RenderInput): void {
  const { width: W, height: H } = OUTPUT_SIZES.id
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W
    canvas.height = H
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'

  // backdrop
  ctx.fillStyle = CREAM
  ctx.fillRect(0, 0, W, H)

  // header band
  drawHeader(ctx, W, 216)

  // photo block with sun offset accent
  const px = 108
  const py = 252
  const pw = W - px * 2
  const ph = 790
  ctx.fillStyle = SUN
  roundedRect(ctx, px + 22, py - 22, pw, ph, 30)
  ctx.fill()

  if (input.photo) {
    ctx.fillStyle = PUNCH
    roundedRect(ctx, px, py, pw, ph, 30)
    ctx.fill()
    drawCoveredImage(ctx, input.photo, px, py, pw, ph, input.photoWidth, input.photoHeight, input.viewport)
  } else {
    ctx.fillStyle = PUNCH
    roundedRect(ctx, px, py, pw, ph, 30)
    ctx.fill()
    ctx.fillStyle = CREAM
    ctx.font = `46px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR FACE GOES HERE', px + pw / 2, py + ph / 2)
  }

  // name
  renderName(ctx, input.name, W / 2, W - px * 2, 1090, 110)

  // stack pill
  const stackLabel = input.stackLabel || 'BUILDER'
  ctx.font = `34px ${DISPLAY}`
  const sw = Math.min(ctx.measureText(stackLabel).width + 96, W - 260)
  const sh = 70
  const sx = W / 2 - sw / 2
  const sy = 1340
  ctx.fillStyle = SUN
  roundedRect(ctx, sx, sy, sw, sh, sh / 2)
  ctx.fill()
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.fillText(stackLabel, W / 2, sy + sh / 2 + 12)

  // class band
  const cy = 1440
  const ch = 116
  ctx.fillStyle = PUNCH
  roundedRect(ctx, px, cy, pw, ch, 26)
  ctx.fill()
  ctx.fillStyle = BUTTER
  ctx.font = `700 24px ${BODY}`
  ctx.textAlign = 'center'
  ctx.fillText('BUILDER CLASS', W / 2, cy + 48)
  ctx.fillStyle = CREAM
  ctx.font = `52px ${DISPLAY}`
  ctx.fillText(input.builderClass, W / 2, cy + 92)

  // footer
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = `34px ${DISPLAY}`
  ctx.textAlign = 'left'
  ctx.fillText('#FrameInGoa', px, H - 38)
  ctx.textAlign = 'right'
  ctx.fillText('HHGOA.COM', W - px, H - 38)
}

export function renderPfp(canvas: HTMLCanvasElement, input: RenderInput): void {
  const { width: S, height: SH } = OUTPUT_SIZES.pfp
  if (canvas.width !== S || canvas.height !== SH) {
    canvas.width = S
    canvas.height = SH
  }
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, S, SH)
  ctx.textBaseline = 'alphabetic'

  // background fill under everything
  ctx.fillStyle = FOREST
  ctx.fillRect(0, 0, S, SH)

  const topBand = 150
  const border = 36

  // photo area
  if (input.photo) {
    drawCoveredImage(
      ctx,
      input.photo,
      border,
      topBand,
      S - border * 2,
      SH - topBand - border,
      input.photoWidth,
      input.photoHeight,
      input.viewport,
    )
  } else {
    ctx.fillStyle = PUNCH
    ctx.fillRect(border, topBand, S - border * 2, SH - topBand - border)
    ctx.fillStyle = CREAM
    ctx.font = `40px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.fillText('YOUR FACE GOES HERE', S / 2, topBand + (SH - topBand - border) / 2)
  }

  // inner yellow line
  ctx.strokeStyle = SUN
  ctx.lineWidth = 6
  ctx.strokeRect(border - 12, topBand - 12, S - (border - 12) * 2, SH - (border - 12) * 2)

  // corner ticks
  ctx.fillStyle = PUNCH
  ctx.fillRect(0, 0, 90, 90)
  ctx.fillRect(S - 90, 0, 90, 90)
  ctx.fillStyle = SUN
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillRect(S - 64, 0, 64, 64)

  // top wordmark
  ctx.fillStyle = CREAM
  ctx.font = `40px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('HACKER HOUSE', S / 2, 78)
  ctx.fillStyle = BUTTER
  ctx.font = `68px ${DISPLAY}`
  ctx.fillText('गोवा 2026', S / 2, 138)

  // bottom bar
  ctx.fillStyle = FOREST
  ctx.fillRect(0, SH - border, S, border)
  ctx.fillStyle = SUN
  ctx.font = `30px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.fillText('#FrameInGoa', S / 2, SH - 10)
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
