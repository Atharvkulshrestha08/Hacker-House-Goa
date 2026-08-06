import { useEffect, useMemo, useRef, useState } from 'react'
import { ensureFonts, renderSquad, type SquadMember } from '../lib/renderer'
import { STACKS, getStack, getBuilderClass, rerollBuilderClass, makeSeed } from '../data/stacks'
import { downloadCanvas, shareToX, buildCaption } from '../lib/share'
import UploadZone from './UploadZone'
import type { DecodedImage, ProcessedPhoto } from '../lib/image'

const MAX_TEAMMATES = 2

interface Teammate {
  id: string
  name: string
  stackId: string
  customStack: string
  builderClass: string
  classSeed: number
  photo: DecodedImage | null
  photoWidth: number
  photoHeight: number
}

interface SquadPanelProps {
  owner: SquadMember
}

function memberToSquad(t: Teammate): SquadMember {
  return {
    name: t.name,
    stackLabel: t.stackId === 'other' ? t.customStack || 'OTHER' : getStack(t.stackId)?.label ?? 'BUILDER',
    builderClass: t.builderClass,
    photo: t.photo,
    photoWidth: t.photoWidth,
    photoHeight: t.photoHeight,
  }
}

export default function SquadPanel({ owner }: SquadPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [teammates, setTeammates] = useState<Teammate[]>([])
  const [draft, setDraft] = useState<Teammate | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const members = useMemo<SquadMember[]>(
    () => [owner, ...teammates.map((t) => memberToSquad(t))],
    [owner, teammates],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => renderSquad(canvas, members)
    draw()
    void ensureFonts().then(draw)
  }, [members])

  const startDraft = () => {
    setDraft({
      id: crypto.randomUUID(),
      name: '',
      stackId: 'frontend',
      customStack: '',
      builderClass: getBuilderClass('frontend', makeSeed()),
      classSeed: makeSeed(),
      photo: null,
      photoWidth: 0,
      photoHeight: 0,
    })
  }

  const saveDraft = () => {
    if (!draft || draft.name.trim().length < 2 || !draft.photo) return
    setTeammates((prev) => [...prev, draft])
    setDraft(null)
  }

  const removeTeammate = (id: string) => setTeammates((prev) => prev.filter((t) => t.id !== id))

  const rerollDraft = () => {
    setDraft((d) =>
      d ? { ...d, builderClass: rerollBuilderClass(d.stackId, d.builderClass) } : d,
    )
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await downloadCanvas(canvas, `HHGoa26_Squad.png`)
    setNotice('YOUR SQUAD IS READY.')
    window.setTimeout(() => setNotice(null), 4000)
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const caption = buildCaption('THE CREW IS COMING')
    const result = await shareToX(caption, canvas)
    if (!result.usedWebShare) setNotice('OPENS X WITH YOUR CAPTION READY.')
    window.setTimeout(() => setNotice(null), 4000)
  }

  const draftStackLabel = draft
    ? draft.stackId === 'other'
      ? draft.customStack || 'OTHER'
      : getStack(draft.stackId)?.label ?? 'BUILDER'
    : ''

  return (
    <section className="mt-10 rounded-3xl border-4 border-forest bg-forest p-4 text-cream sm:p-6">
      <div className="text-center">
        <p className="eyebrow text-butter">Squad mode</p>
        <h3 className="mt-1 font-display text-2xl uppercase sm:text-3xl">Build with your crew</h3>
        <p className="mt-1 text-xs text-cream/70">
          Bring up to 3 builders into one combined post. Same HH Goa frame.
        </p>
      </div>

      {/* owner chip */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 font-display text-xs uppercase text-ink">
          🌴 {owner.name.split(' ')[0] || 'You'}
        </span>
        {teammates.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2 font-display text-xs uppercase text-ink"
          >
            {t.name.split(' ')[0] || 'Builder'}
            <button
              type="button"
              onClick={() => removeTeammate(t.id)}
              className="h-6 w-6 rounded-full bg-ink/10 text-ink hover:bg-punch hover:text-cream"
              aria-label={`Remove ${t.name}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* add / draft editor */}
      {!draft && teammates.length < MAX_TEAMMATES && (
        <div className="mt-5 text-center">
          <button type="button" onClick={startDraft} className="btn-sun">
            + Add Teammate
          </button>
        </div>
      )}

      {draft && (
        <div className="mt-5 space-y-4 rounded-2xl bg-cream p-4 text-ink">
          <p className="font-display text-sm uppercase">New builder</p>
          <UploadZone
            accent
            onBusy={setBusy}
            onError={() => setNotice('COULD NOT READ THAT PHOTO — TRY ANOTHER.')}
            onPhoto={(processed: ProcessedPhoto, image: DecodedImage) =>
              setDraft((d) =>
                d
                  ? { ...d, photo: image, photoWidth: processed.width, photoHeight: processed.height }
                  : d,
              )
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={draft.name}
              maxLength={30}
              placeholder="Teammate name"
              onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
              className="w-full rounded-xl border-2 border-forest/20 px-4 py-3 text-base outline-none focus:border-punch"
            />
            <select
              value={draft.stackId}
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        stackId: e.target.value,
                        builderClass: getBuilderClass(e.target.value, makeSeed()),
                      }
                    : d,
                )
              }
              className="w-full rounded-xl border-2 border-forest/20 bg-cream px-4 py-3 text-base outline-none focus:border-punch"
            >
              {STACKS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {draft.stackId === 'other' && (
            <input
              type="text"
              value={draft.customStack}
              maxLength={24}
              placeholder="Custom stack"
              onChange={(e) => setDraft((d) => (d ? { ...d, customStack: e.target.value } : d))}
              className="w-full rounded-xl border-2 border-punch px-4 py-3 text-base outline-none"
            />
          )}

          <div className="rounded-xl bg-punch px-4 py-3 text-center text-cream">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-butter">
              {draftStackLabel}
            </p>
            <p className="font-display text-lg uppercase">{draft.builderClass}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={rerollDraft} className="btn-sun text-xs">
              🔄 Reroll
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={!draft.photo || draft.name.trim().length < 2}
              className="btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to squad
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="btn-ghost text-xs disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* squad preview */}
      {members.length > 1 && (
        <div className="mt-6 space-y-4">
          <div className="mx-auto max-w-[380px]">
            <canvas ref={canvasRef} className="block w-full rounded-2xl border-4 border-cream" />
          </div>

          {busy && <p className="text-center text-xs text-cream/70">READING PHOTO…</p>}
          {notice && (
            <p role="status" className="rounded-2xl bg-sun px-4 py-3 text-center font-display text-sm uppercase text-ink">
              {notice}
            </p>
          )}

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" onClick={handleDownload} className="btn-sun">
              ⬇ Download Squad
            </button>
            <button type="button" onClick={handleShare} className="btn-punch">
              ✕ Share Squad
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
