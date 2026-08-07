import { useEffect, useRef, useState } from 'react'
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
  const frontCanvasRef = useRef<HTMLCanvasElement>(null)
  const backCanvasRef = useRef<HTMLCanvasElement>(null)
  const [type, setType] = useState<OutputType>('id')
  const [flipped, setFlipped] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(null), 4000)
  }

  useEffect(() => {
    const frontCanvas = frontCanvasRef.current
    const backCanvas = backCanvasRef.current
    if (!frontCanvas) return
    const input = { name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport }

    const draw = () => {
      renderOutput(frontCanvas, type, input, 'front')
      if (backCanvas && type === 'id') {
        renderOutput(backCanvas, type, input, 'back')
      }
    }
    draw()
    void ensureFonts().then(draw)
  }, [type, name, stackLabel, builderClass, photo, photoWidth, photoHeight, viewport])

  const handleDownload = async (side: 'front' | 'back' | 'both' = 'front') => {
    const frontCanvas = frontCanvasRef.current
    const backCanvas = backCanvasRef.current

    if (side === 'both' && frontCanvas && backCanvas && type === 'id') {
      await downloadCanvas(frontCanvas, fileNameFor(name, 'id-front'))
      await downloadCanvas(backCanvas, fileNameFor(name, 'id-back'))
      showNotice('DOWNLOADED BOTH SIDES (FRONT & BACK).')
      return
    }

    const canvas = (side === 'back' && backCanvas) ? backCanvas : frontCanvas
    if (!canvas) return
    const suffix = side === 'back' ? 'id-back' : type
    await downloadCanvas(canvas, fileNameFor(name, suffix))
    showNotice(`YOUR ${type.toUpperCase()} (${side.toUpperCase()}) IS READY.`)
  }

  const handleShare = async () => {
    const canvas = flipped && backCanvasRef.current ? backCanvasRef.current : frontCanvasRef.current
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
          onClick={() => {
            setType('id')
            setFlipped(false)
          }}
          aria-pressed={type === 'id'}
          className={`min-h-11 rounded-full px-4 py-2.5 font-display text-sm uppercase tracking-wide transition-all ${
            type === 'id' ? 'bg-forest text-cream' : 'text-ink hover:text-punch'
          }`}
        >
          Builder ID
        </button>
        <button
          type="button"
          onClick={() => {
            setType('pfp')
            setFlipped(false)
          }}
          aria-pressed={type === 'pfp'}
          className={`min-h-11 rounded-full px-4 py-2.5 font-display text-sm uppercase tracking-wide transition-all ${
            type === 'pfp' ? 'bg-punch text-cream' : 'text-ink hover:text-punch'
          }`}
        >
          PFP Frame
        </button>
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative mx-auto w-full max-w-[380px] [perspective:1000px]">
        <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-3xl bg-sun" />

        <div
          role="button"
          tabIndex={0}
          onClick={() => type === 'id' && setFlipped(!flipped)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && type === 'id' && setFlipped(!flipped)}
          className={`relative cursor-pointer overflow-hidden rounded-3xl border-4 border-forest shadow-2xl transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{ aspectRatio: type === 'id' ? '4 / 5' : '1 / 1' }}
          title={type === 'id' ? 'Click card to flip front/back' : undefined}
        >
          {/* Front Side */}
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <canvas ref={frontCanvasRef} className="block w-full h-full" />
          </div>

          {/* Back Side */}
          {type === 'id' && (
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <canvas ref={backCanvasRef} className="block w-full h-full" />
            </div>
          )}
        </div>

        {type === 'id' && (
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-punch animate-pulse">
            🔄 Click or Tap Card to Flip ({flipped ? 'BACK SIDE' : 'FRONT SIDE'})
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mx-auto flex w-full max-w-[380px] flex-col gap-2.5">
        {type === 'id' ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleDownload('front')} className="btn-primary py-3 text-xs">
              ⬇ Download Front
            </button>
            <button type="button" onClick={() => handleDownload('back')} className="btn-ghost py-3 text-xs">
              🔄 Download Back
            </button>
            <button type="button" onClick={() => handleDownload('both')} className="btn-punch col-span-2 py-3 text-sm">
              ✨ Download Both Sides (Zip/Files)
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => handleDownload('front')} className="btn-primary w-full">
            ⬇ Download PFP Frame
          </button>
        )}

        <button type="button" onClick={handleShare} className="btn-ghost w-full">
          ✕ Share Active Side to X
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
