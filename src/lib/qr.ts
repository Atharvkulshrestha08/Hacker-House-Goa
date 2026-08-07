/**
 * QR code helper.
 *
 * Generates a real, scannable QR code onto a canvas context using the
 * `qrcode` npm package.  The QR encodes a share URL that points back to
 * the generated passport image stored in sessionStorage.
 */
import QRCode from 'qrcode'

// ── Share-image store ────────────────────────────────────────────────────────
const STORE_KEY = 'hhg_share_img'
const SHARE_HASH = '#share'

/**
 * Persist the front-face canvas as a dataURL so the share page can show it.
 * Returns the full URL that should be encoded in the QR.
 */
export function storeShareImage(canvas: HTMLCanvasElement): string {
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.80)
    sessionStorage.setItem(STORE_KEY, dataUrl)
  } catch {
    // quota exceeded – skip storage but still return URL
  }
  const base = window.location.origin + window.location.pathname
  return base + SHARE_HASH
}

/** Read back the stored image (called by the share page). */
export function loadShareImage(): string | null {
  return sessionStorage.getItem(STORE_KEY)
}

// ── QR drawing on canvas ─────────────────────────────────────────────────────

/**
 * Draw a real QR code at (x, y) with the given size onto ctx.
 * The QR encodes `url`.  Returns a Promise so callers can await it.
 */
export async function drawQR(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  size: number,
): Promise<void> {
  const targetUrl = url || (window.location.origin + window.location.pathname + '#share')
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size

  try {
    await QRCode.toCanvas(offscreen, targetUrl, {
      width: size,
      margin: 1,
      color: { dark: '#0a1a14', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
    ctx.drawImage(offscreen, x, y, size, size)
  } catch (err) {
    // If QR rendering fails, draw clean vector fallback pattern
    ctx.fillStyle = '#0a1a14'
    const cell = size / 7
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(x + c * cell, y + r * cell, cell - 1, cell - 1)
        }
      }
    }
  }
}

