import type { ProcessedPhoto } from '../types'

export type { ProcessedPhoto } from '../types'

const SUPPORTED_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif', 'image/pjp',
  'image/png', 'image/apng',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/x-icon', 'image/vnd.microsoft.icon',
  'image/bmp', 'image/x-bmp',
  'image/tiff', 'image/tif',
  'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence',
  'image/adobe.photoshop', 'image/vnd.adobe.photoshop', 'application/postscript', 'application/pdf'
])

const SUPPORTED_EXTS = new Set([
  // standard web & photos
  'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'pjpeg', 'pjp',
  'png', 'apng',
  'gif',
  'webp',
  'avif',
  'svg',
  'ico', 'cur',
  'bmp', 'tif', 'tiff',
  'heic', 'heif',
  // design / raw / vector
  'ai', 'eps', 'pdf',
  'psd', 'indd',
  'raw', 'cr2', 'nef', 'arw', 'dng', 'orf', 'rw2', 'pef', 'srw'
])

const HEIC_MIME = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])
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

async function loadFromUrl(url: string): Promise<HTMLImageElement> {
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
  // 1. Try createImageBitmap with orientation
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      try {
        return await createImageBitmap(blob)
      } catch {
        // continue to <img> fallback
      }
    }
  }

  // 2. Try URL.createObjectURL
  const objectUrl = URL.createObjectURL(blob)
  try {
    return await loadFromUrl(objectUrl)
  } catch {
    // 3. Fallback to Data URL via FileReader for strict browser security/HEIC blobs
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new PhotoError('corrupt', 'Could not decode image format'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new PhotoError('corrupt', 'Could not read file data'))
      reader.readAsDataURL(blob)
    })
  }
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
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isMimeSupported = file.type ? SUPPORTED_MIMES.has(file.type) : false
  const isExtSupported = ext ? SUPPORTED_EXTS.has(ext) : false
  const isHeicExt = ext === 'heic' || ext === 'heif'

  if (!isMimeSupported && !isExtSupported) {
    throw new PhotoError('unsupported', `${file.name} is not supported`)
  }

  let blob: Blob
  try {
    if (HEIC_MIME.has(file.type) || isHeicExt) {
      try {
        const { default: heic2any } = await import('heic2any')
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        })
        blob = Array.isArray(converted) ? converted[0] : converted
      } catch {
        blob = file
      }
    } else {
      blob = file
    }
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
  biasY = 0.25,   // 0 = top, 0.5 = centre — 0.25 keeps faces in frame
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

  // Base cover scale guarantees image fills dstW × dstH completely
  const base = computeCover(srcW, srcH, dstW, dstH, 0.20) // 0.20 bias focuses upper portrait (head & shoulders)
  const scale = base.scale * (viewport.scale || 1)
  const drawW = srcW * scale
  const drawH = srcH * scale

  // Calculate position with cover offset + user pan adjustments
  const drawX = dstX + (dstW - drawW) / 2 + (viewport.x || 0) * dstW
  const drawY = dstY + (base.y) + (viewport.y || 0) * dstH

  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.restore()
}

