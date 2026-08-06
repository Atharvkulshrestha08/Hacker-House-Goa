export function buildCaption(builderClass: string, name?: string): string {
  const lines = [
    `Just framed ${name ? name.trim().split(' ')[0] : 'myself'} for Hacker House Goa 2026 🌴`,
    '',
    `Builder Class: ${builderClass}`,
    '',
    'See you in Goa.',
    '',
    '#FrameInGoa',
  ]
  return lines.join('\n')
}

export function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url })
  return `https://twitter.com/intent/tweet?${params.toString()}`
}

export async function downloadCanvas(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve()
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, 'image/png')
  })
}

export function fileNameFor(rawName: string, suffix: string): string {
  const safe = rawName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 40) || 'builder'
  return `HHGoa26_${safe}-${suffix}.png`
}

export interface ShareResult {
  usedWebShare: boolean
}

export async function shareToX(
  caption: string,
  canvas: HTMLCanvasElement,
): Promise<ShareResult> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (blob && typeof navigator.canShare === 'function') {
    const file = new File([blob], 'frameingoahhgoa.png', { type: 'image/png' })
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'FrameInGoa', text: caption, files: [file] })
        return { usedWebShare: true }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return { usedWebShare: true }
    }
  }
  openIntent(caption)
  return { usedWebShare: false }
}

function openIntent(caption: string): void {
  const w = 620
  const h = 660
  const left = Math.max(0, Math.round((window.screen.width - w) / 2))
  const top = Math.max(0, Math.round((window.screen.height - h) / 2))
  const win = window.open(
    buildXIntentUrl(caption, window.location.href),
    'share-x',
    `noopener,noreferrer,width=${w},height=${h},top=${top},left=${left}`,
  )
  if (win) win.opener = null
}
