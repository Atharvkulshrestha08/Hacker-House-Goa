import { useEffect, useMemo, useRef, useState } from 'react'
import { ensureFonts, renderOutput } from '../lib/renderer'
import { downloadCanvas, shareToX, buildCaption, fileNameFor } from '../lib/share'
import type { OutputType } from '../types'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [type, setType] = useState<OutputType>('id')
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(null), 4000)
  }

  const fileName = useMemo(() => fileNameFor(name, type), [name, type])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => renderOutput(canvas, type, { name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport })
    draw()
    void ensureFonts().then(draw)
  }, [type, name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport])

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await downloadCanvas(canvas, fileName)
    showNotice('YOUR HHGOA ID IS READY.')
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const caption = buildCaption(builderClass, name)
    const result = await shareToX(caption, canvas)
    if (!result.usedWebShare) showNotice('OPENS X WITH YOUR CAPTION READY.')
  }

  return (
    <div className="space-y-5">
      {/* output toggle */}
      <div className="mx-auto grid w-full max-w-xs grid-cols-2 gap-2 rounded-full border-2 border-forest bg-cream p-1.5">
        <button
          type="button"
          onClick={() => setType('id')}
          aria-pressed={type === 'id'}
          className={`min-h-11 rounded-full px-4 py-2.5 font-display text-sm uppercase tracking-wide transition-all ${
            type === 'id' ? 'bg-forest text-cream' : 'text-ink hover:text-punch'
          }`}
        >
          Builder ID
        </button>
        <button
          type="button"
          onClick={() => setType('pfp')}
          aria-pressed={type === 'pfp'}
          className={`min-h-11 rounded-full px-4 py-2.5 font-display text-sm uppercase tracking-wide transition-all ${
            type === 'pfp' ? 'bg-punch text-cream' : 'text-ink hover:text-punch'
          }`}
        >
          PFP Frame
        </button>
      </div>

      {/* canvas preview */}
      <div className="relative mx-auto w-full max-w-[380px]">
        <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-3xl bg-sun" />
        <div className="relative overflow-hidden rounded-3xl border-4 border-forest shadow-2xl">
          <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ aspectRatio: type === 'id' ? '4 / 5' : '1 / 1' }}
          />
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-widest text-ink/45">
          {type === 'id' ? '1350 × 1688 · PNG' : '1080 × 1080 · PNG'}
        </p>
      </div>

      {/* actions */}
      <div className="mx-auto grid w-full max-w-[380px] grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={handleDownload} className="btn-primary">
          ⬇ {type === 'id' ? 'Download ID' : 'Download PFP'}
        </button>
        <button type="button" onClick={handleShare} className="btn-punch">
          ✕ Share to X
        </button>
      </div>

      {notice && (
        <p role="status" className="animate-pop mx-auto max-w-[380px] rounded-2xl bg-sun px-4 py-3 text-center font-display text-sm uppercase text-ink">
          {notice}
        </p>
      )}

      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-ink/45">
        Your photo stays on your device
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
