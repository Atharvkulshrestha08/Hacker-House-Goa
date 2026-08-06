import { useCallback, useEffect, useState } from 'react'
import Landing from './components/Landing'
import UploadZone from './components/UploadZone'
import RepositionStep from './components/RepositionStep'
import InfoStep from './components/InfoStep'
import ClassStep from './components/ClassStep'
import OutputStep from './components/OutputStep'
import SquadPanel from './components/SquadPanel'
import ProgressOverlay from './components/ProgressOverlay'
import Marquee from './components/Marquee'
import { getStack, getBuilderClass, rerollBuilderClass, makeSeed } from './data/stacks'
import type { DecodedImage } from './lib/image'
import type { ProcessedPhoto } from './lib/image'
import type { DrawViewport } from './lib/image'
import type { SquadMember } from './lib/renderer'

type Stage = 'landing' | 'build' | 'output'
type Step = 'photo' | 'reposition' | 'info' | 'class'

interface Owner {
  name: string
  stackId: string
  customStack: string
  builderClass: string
  classSeed: number
  photo: DecodedImage | null
  photoWidth: number
  photoHeight: number
  viewport: DrawViewport
}

const initialOwner: Owner = {
  name: '',
  stackId: '',
  customStack: '',
  builderClass: '',
  classSeed: 0,
  photo: null,
  photoWidth: 0,
  photoHeight: 0,
  viewport: { x: 0, y: 0, scale: 1 },
}

export default function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [step, setStep] = useState<Step>('photo')
  const [owner, setOwner] = useState<Owner>(initialOwner)
  const [error, setError] = useState<{ kind: 'unsupported' | 'corrupt'; id: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [stage, step])

  const start = () => {
    setOwner(initialOwner)
    setStep('photo')
    setError(null)
    setStage('build')
  }

  const handlePhoto = useCallback((processed: ProcessedPhoto, image: DecodedImage) => {
    setOwner((o) => ({
      ...o,
      photo: image,
      photoWidth: processed.width,
      photoHeight: processed.height,
      viewport: { x: 0, y: 0, scale: 1 },
    }))
    setError(null)
    setStep('reposition')
  }, [])

  const handleError = useCallback((kind: 'unsupported' | 'corrupt') => {
    setError({ kind, id: Date.now() })
  }, [])

  const continueFromInfo = () => {
    const stackId = owner.stackId || 'frontend'
    const seed = makeSeed()
    setOwner((o) => ({
      ...o,
      stackId,
      classSeed: seed,
      builderClass: getBuilderClass(stackId, seed),
    }))
    setStep('class')
  }

  const rerollClass = () => {
    setOwner((o) => ({
      ...o,
      builderClass: rerollBuilderClass(o.stackId, o.builderClass),
    }))
  }

  const finish = () => {
    setGenerating(true)
    setStage('output')
    window.setTimeout(() => setGenerating(false), 1100)
  }

  const editPhoto = () => {
    setStage('build')
    setStep('photo')
  }

  const stack = getStack(owner.stackId)
  const stackLabel = owner.stackId === 'other' ? owner.customStack : stack?.label ?? 'BUILDER'
  const isOutput = stage === 'output'

  const ownerSquadMember: SquadMember = {
    name: owner.name,
    stackLabel,
    builderClass: owner.builderClass,
    photo: owner.photo,
    photoWidth: owner.photoWidth,
    photoHeight: owner.photoHeight,
  }

  if (stage === 'landing') {
    return <Landing onStart={start} />
  }

  const errorMessage =
    error?.kind === 'unsupported'
      ? 'THIS FILE FORMAT ISN\u2019T SUPPORTED. TRY JPG, PNG OR HEIC.'
      : 'WE COULDN\u2019T READ THIS PHOTO. TRY ANOTHER ONE.'

  return (
    <div className="min-h-dvh">
      <Marquee />

      {/* top bar */}
      <header className="sticky top-0 z-40 border-b-2 border-forest bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2"
            aria-label="FrameInGoa home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest font-display text-sm text-sun">
              26
            </span>
            <span className="font-display text-lg uppercase tracking-wide text-ink">
              FrameInGoa
            </span>
          </button>

          {stage === 'build' && (
            <nav aria-label="Progress" className="flex items-center gap-1.5 sm:gap-2">
              {(['photo', 'info', 'class'] as Step[]).map((s) => {
                const order = { photo: 0, reposition: 0, info: 1, class: 2 }[s]
                const active = s === step || (s === 'info' && step === 'reposition')
                let done = false
                if (isOutput) done = true
                else if (step === 'reposition' || step === 'info') done = s === 'photo'
                else if (step === 'class') done = s !== 'class'
                return (
                  <span
                    key={s}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest sm:text-[11px] ${
                      active ? 'text-punch' : done ? 'text-forest' : 'text-ink/35'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] ${
                        active
                          ? 'border-punch bg-punch text-cream'
                          : done
                            ? 'border-forest bg-forest text-cream'
                            : 'border-ink/25 text-ink/35'
                      }`}
                    >
                      {done ? '✓' : order + 1}
                    </span>
                    <span className={s === 'photo' ? '' : 'hidden sm:inline'}>
                      {s === 'photo' ? 'Photo' : s === 'info' ? 'You' : 'Class'}
                    </span>
                  </span>
                )
              })}
            </nav>
          )}

          {stage === 'output' && (
            <button type="button" onClick={start} className="btn-ghost h-9 px-3 py-1 text-xs">
              New ID
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {stage === 'build' && (
          <div className="mx-auto max-w-xl">
            <h1 className="display mb-6 text-center text-3xl uppercase text-forest sm:text-4xl">
              {step === 'photo' && 'Drop your face'}
              {step === 'reposition' && 'Tune the frame'}
              {step === 'info' && 'Who\u2019s building?'}
              {step === 'class' && 'Your Builder Class'}
            </h1>

            {error && (
              <p
                key={error.id}
                role="alert"
                className="animate-pop mb-5 rounded-2xl border-2 border-punch bg-punch/10 px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-punch-deep"
              >
                {errorMessage}
              </p>
            )}

            {step === 'photo' && (
              <UploadZone onPhoto={handlePhoto} onError={handleError} onBusy={setBusy} />
            )}

            {step === 'reposition' && owner.photo && (
              <RepositionStep
                image={owner.photo}
                srcW={owner.photoWidth}
                srcH={owner.photoHeight}
                viewport={owner.viewport}
                onChange={(viewport) => setOwner((o) => ({ ...o, viewport }))}
                onContinue={() => setStep('info')}
                onBack={() => setStep('photo')}
              />
            )}

            {step === 'info' && (
              <InfoStep
                name={owner.name}
                stackId={owner.stackId}
                customStack={owner.customStack}
                onChange={(patch) => setOwner((o) => ({ ...o, ...patch }))}
                onContinue={continueFromInfo}
                onBack={() => setStep(owner.photo ? 'reposition' : 'photo')}
              />
            )}

            {step === 'class' && (
              <ClassStep
                name={owner.name}
                stackId={owner.stackId}
                customStack={owner.customStack}
                builderClass={owner.builderClass}
                onReroll={rerollClass}
                onContinue={finish}
                onBack={() => setStep('info')}
              />
            )}
          </div>
        )}

        {stage === 'output' && (
          <div className="mx-auto max-w-2xl">
            <h1 className="display mb-1 text-center text-3xl uppercase text-forest sm:text-5xl">
              Welcome to Goa
            </h1>
            <p className="mb-6 text-center font-editorial text-xl italic text-ink/70 sm:text-2xl">
              {owner.builderClass}, you made it. 🌴
            </p>

            <OutputStep
              name={owner.name}
              stackLabel={stackLabel}
              builderClass={owner.builderClass}
              photo={owner.photo}
              photoWidth={owner.photoWidth}
              photoHeight={owner.photoHeight}
              viewport={owner.viewport}
              onEditPhoto={editPhoto}
              onStartOver={start}
            />

            <SquadPanel owner={ownerSquadMember} />
          </div>
        )}
      </main>

      {busy && <ProgressOverlay label="READING PHOTO" />}
      {generating && <ProgressOverlay />}
    </div>
  )
}
