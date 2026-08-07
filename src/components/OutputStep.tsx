import { useEffect, useRef, useState } from 'react'
import { ensureFonts, renderOutput } from '../lib/renderer'
import { downloadCanvas, shareToX, buildCaption, fileNameFor } from '../lib/share'
import { storeShareImage } from '../lib/qr'
import type { DecodedImage } from '../lib/image'
import type { DrawViewport } from '../lib/image'

interface OutputStepProps {
  name: string
  stackLabel: string
  builderClass: string
  photo: DecodedImage | null
  photoWidth: number
  photoHeight: number
  viewport: DrawViewport
  onEditPhoto: () => void
  onStartOver: () => void
}

export default function OutputStep({
  name,
  stackLabel,
  builderClass,
  photo,
  photoWidth,
  photoHeight,
  viewport,
  onEditPhoto,
  onStartOver,
}: OutputStepProps) {
  const passportCanvasRef = useRef<HTMLCanvasElement>(null)
  const pfpCanvasRef      = useRef<HTMLCanvasElement>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(null), 3500)
  }

  // Render both canvases whenever inputs change
  useEffect(() => {
    const passportCanvas = passportCanvasRef.current
    const pfpCanvas      = pfpCanvasRef.current
    if (!passportCanvas) return

    const input = { name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport }
    const qrBase = window.location.origin + window.location.pathname + '#share'

    const draw = async () => {
      // 1. Render passport (id, 2400×1600) — first pass to generate share image
      await renderOutput(passportCanvas, 'id', input, 'front', '')
      // 2. Store snapshot → get QR URL → redraw with QR embedded
      const qrUrl = storeShareImage(passportCanvas)
      await renderOutput(passportCanvas, 'id', input, 'front', qrUrl)
      // 3. Render PFP (1080×1080)
      if (pfpCanvas) {
        await renderOutput(pfpCanvas, 'pfp', input, 'front', '')
      }
      void qrBase
    }

    void draw()
    void ensureFonts().then(draw)
  }, [name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport])

  const handleDownloadPassport = async () => {
    const canvas = passportCanvasRef.current
    if (!canvas) return
    await downloadCanvas(canvas, fileNameFor(name, 'passport'))
    showNotice('PASSPORT DOWNLOADED ✓')
  }

  const handleDownloadPfp = async () => {
    const canvas = pfpCanvasRef.current
    if (!canvas) return
    await downloadCanvas(canvas, fileNameFor(name, 'pfp'))
    showNotice('PFP DOWNLOADED ✓')
  }

  const handleShare = async () => {
    const canvas = passportCanvasRef.current
    if (!canvas) return
    const caption = buildCaption(builderClass, name)
    const result = await shareToX(caption, canvas)
    if (!result.usedWebShare) showNotice('X OPENED WITH CAPTION READY.')
  }

  return (
    <div className="space-y-6">

      {/* ── Passport (2400×1600) ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl">
        <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-ink/50">
          Builder Passport · 2400 × 1600
        </p>
        {/* Shadow offset frame */}
        <div className="relative">
          <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-3xl bg-sun" />
          <div className="relative overflow-hidden rounded-3xl border-4 border-forest shadow-2xl">
            <canvas
              ref={passportCanvasRef}
              className="block w-full"
              style={{ aspectRatio: '3 / 2' }}
            />
          </div>
        </div>
      </section>

      {/* ── PFP (1080×1080) ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-sm">
        <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-ink/50">
          PFP Frame · 1080 × 1080
        </p>
        <div className="relative">
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-sun" />
          <div className="relative overflow-hidden rounded-2xl border-4 border-forest shadow-xl">
            <canvas
              ref={pfpCanvasRef}
              className="block w-full"
              style={{ aspectRatio: '1 / 1' }}
            />
          </div>
        </div>
      </section>

      {/* ── Download + Share actions ─────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleDownloadPassport}
            className="btn-primary py-3 text-sm"
          >
            ⬇ Download Passport
          </button>
          <button
            type="button"
            onClick={handleDownloadPfp}
            className="btn-punch py-3 text-sm"
          >
            ⬇ Download PFP
          </button>
        </div>

        <button type="button" onClick={handleShare} className="btn-ghost w-full">
          𝕏 Share to X / Twitter
        </button>
      </div>

      {/* Notice toast */}
      {notice && (
        <p
          role="status"
          className="animate-pop mx-auto max-w-[380px] rounded-2xl bg-sun px-4 py-3 text-center font-display text-sm uppercase text-ink"
        >
          {notice}
        </p>
      )}

      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-ink/40">
        Your photo stays on your device · never uploaded
      </p>

      <div className="mx-auto flex max-w-[380px] flex-col gap-2 text-center text-xs text-ink/60 sm:flex-row sm:justify-center">
        <button type="button" onClick={onEditPhoto} className="underline underline-offset-4 hover:text-punch">
          Edit photo
        </button>
        <span className="hidden sm:inline">·</span>
        <button type="button" onClick={onStartOver} className="underline underline-offset-4 hover:text-punch">
          Start over
        </button>
      </div>

    </div>
  )
}
