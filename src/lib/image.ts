import type { ProcessedPhoto } from '../types'

export type { ProcessedPhoto } from '../types'

const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const HEIC_MIME = new Set(['image/heic', 'image/heif'])
const MAX_DIMENSION = 2200

export type DecodedImage = HTMLImageElement | ImageBitmap

export class PhotoError extends Error {
  kind: 'unsupported' | 'corrupt' | 'generation'
  constructor(kind: PhotoError['kind'], message: string) {
    super(message)
    this.kind = kind
    this.name = 'PhotoError'
  }
}

async function fileToBlob(file: File): Promise<Blob> {
  if (HEIC_MIME.has(file.type)) {
    try {
      const { default: heic2any } = await import('heic2any')
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      })
      const blob = Array.isArray(converted) ? converted[0] : converted
      if (!blob || !(blob instanceof Blob)) throw new Error('no output')
      return blob
    } catch (err) {
      throw new PhotoError('corrupt', `HEIC conversion failed: ${err}`)
    }
  }
  return file
}

function loadFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new PhotoError('corrupt', 'Could not decode image'))
    }
    img.src = url
  })
}

export async function loadSourceImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      // fall through to <img> which also respects EXIF in modern browsers
    }
  }
  return loadFromUrl(URL.createObjectURL(blob))
}

export function getDecodedSize(source: DecodedImage): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return { w: source.naturalWidth, h: source.naturalHeight }
  }
  return { w: source.width, h: source.height }
}

async function downscale(
  source: DecodedImage,
  w: number,
  h: number,
): Promise<{ source: DecodedImage; w: number; h: number }> {
  const longest = Math.max(w, h)
  if (longest <= MAX_DIMENSION) return { source, w, h }

  const ratio = MAX_DIMENSION / longest
  const dw = Math.round(w * ratio)
  const dh = Math.round(h * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, dw, dh)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  )
  if (!blob) throw new PhotoError('corrupt', 'Could not prepare photo')
  const img = await loadFromUrl(URL.createObjectURL(blob))
  return { source: img, w: dw, h: dh }
}

export async function processPhoto(
  file: File,
): Promise<{ processed: ProcessedPhoto; image: DecodedImage }> {
  if (!SUPPORTED.has(file.type)) {
    throw new PhotoError('unsupported', `${file.type || 'unknown'} is not supported`)
  }

  let blob: Blob
  try {
    blob = await fileToBlob(file)
  } catch (err) {
    throw err instanceof PhotoError ? err : new PhotoError('corrupt', 'Failed to read photo')
  }

  let decoded: DecodedImage
  try {
    decoded = await loadSourceImage(blob)
  } catch (err) {
    throw err instanceof PhotoError ? err : new PhotoError('corrupt', 'Failed to read photo')
  }

  const { w, h } = getDecodedSize(decoded)
  const { source, w: fw, h: fh } = await downscale(decoded, w, h)
  const fileName = file.name.replace(/\.[^/.]+$/, '') || 'photo'

  return {
    processed: {
      fileName,
      mimeType: 'image/jpeg',
      width: fw,
      height: fh,
      objectUrl: source instanceof HTMLImageElement ? source.src : '',
    },
    image: source,
  }
}

export interface CoverResult {
  scale: number
  x: number
  y: number
}

export function computeCover(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  biasY = 0.45,
): CoverResult {
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const scaledW = srcW * scale
  const scaledH = srcH * scale
  const x = (dstW - scaledW) / 2
  const y = (dstH - scaledH) * biasY
  return { scale, x, y }
}

export interface DrawViewport {
  x: number
  y: number
  scale: number
}

export function drawCoveredImage(
  ctx: CanvasRenderingContext2D,
  img: DecodedImage,
  dstX: number,
  dstY: number,
  dstW: number,
  dstH: number,
  srcW: number,
  srcH: number,
  viewport: DrawViewport,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(dstX, dstY, dstW, dstH)
  ctx.clip()

  const base = computeCover(srcW, srcH, dstW, dstH)
  const scale = base.scale * viewport.scale
  const drawW = srcW * scale
  const drawH = srcH * scale

  const panSrcX = (viewport.x * dstW) / scale
  const panSrcY = (viewport.y * dstH) / scale

  ctx.drawImage(
    img,
    dstX + dstW / 2 - drawW / 2 + panSrcX,
    dstY + dstH / 2 - drawH / 2 + panSrcY,
    drawW,
    drawH,
  )
  ctx.restore()
}
