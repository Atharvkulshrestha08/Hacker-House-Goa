import Marquee from './Marquee'
import Reveal from '../hooks/useReveal'
import Footer from './Footer'

interface LandingProps {
  onStart: () => void
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-dvh">
      <Marquee />

      {/* HERO */}
      <header className="noise relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-punch/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sun/40 blur-3xl" />

        <div className="relative mx-auto flex min-h-[calc(100dvh-40px)] max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-14 text-center sm:px-6 lg:px-8">
          <p className="eyebrow mb-5 text-[11px] sm:text-xs">
            2:47PM Studio · 28–31 Oct 2026 · Goa, India
          </p>

          <h1 className="display text-[clamp(3rem,11vw,7.5rem)] text-forest">
            HACKER
            <br />
            HOUSE
          </h1>
          <div className="my-3 flex items-center gap-4 sm:my-4">
            <span className="h-1.5 w-1.5 rounded-full bg-punch" />
            <p className="font-editorial text-[clamp(2.6rem,9vw,5.5rem)] italic leading-none text-punch">
              गोवा
            </p>
            <span className="h-1.5 w-1.5 rounded-full bg-punch" />
          </div>
          <p className="display text-[clamp(1.4rem,4.5vw,2.6rem)] text-sun [-webkit-text-stroke:1.5px_#0a3d2e]">
            2026
          </p>

          <p className="mt-6 font-editorial text-2xl italic text-ink sm:text-3xl">
            Frame yourself in Goa.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
            Build your HH Goa 2026 identity in seconds. Upload a photo, pick your stack, grab your
            Builder ID. No login. No cropping.
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <button type="button" onClick={onStart} className="btn-punch w-full sm:w-auto">
              Create My ID
            </button>
            <a href="#how" className="btn-ghost w-full sm:w-auto">
              See Example
            </a>
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">
            Your photo stays on your device 📱
          </p>
        </div>

        {/* decorative sample ID */}
        <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-8 sm:grid-cols-2">
              <SampleId />
              <div className="hidden text-left sm:block">
                <p className="eyebrow mb-3">One upload, three outputs</p>
                <ul className="space-y-3 text-sm text-ink/80 sm:text-base">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-punch" />
                    <span>
                      <strong className="text-ink">Builder ID</strong> — a 4:5 event badge with your
                      name, stack and Builder Class.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sun" />
                    <span>
                      <strong className="text-ink">PFP Frame</strong> — wrap your photo in HH Goa
                      branding, ready for X.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-leaf" />
                    <span>
                      <strong className="text-ink">Squad</strong> — bring up to 3 builders into one
                      combined post.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-forest py-16 text-cream sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow mb-2 text-butter">How it works</p>
            <h2 className="display text-4xl sm:text-6xl">
              Upload. Pick. <span className="text-sun">Done.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Upload a photo',
                d: 'JPG, PNG or HEIC straight from your camera roll. Orientation and size handled for you.',
              },
              {
                n: '02',
                t: 'Enter your stack',
                d: 'Name + role. We hand you a Builder Class and keep it instant — no AI waiting rooms.',
              },
              {
                n: '03',
                t: 'Download & share',
                d: 'Real PNG, one tap. Share to X with #FrameInGoa and put your crew in one post.',
              },
            ].map((step) => (
              <Reveal key={step.n} delay={120}>
                <div className="rounded-3xl border border-cream/15 p-6 transition-transform duration-300 hover:-translate-y-1">
                  <p className="font-display text-5xl text-punch">{step.n}</p>
                  <h3 className="mt-4 font-display text-xl uppercase">{step.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/70">{step.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUILDER CLASSES */}
      <section className="bg-sun py-16 text-ink sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow mb-2">Know your class</p>
            <h2 className="display text-4xl sm:text-6xl">
              Every stack gets a <span className="text-punch">title</span>.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
              The generator hands you a Builder Class instantly. Like the sound of it? Keep it.
              Don&apos;t? Reroll — it&apos;s free and it&apos;s fast.
            </p>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              'MODEL WHISPERER',
              'PIXEL ARCHITECT',
              'SYSTEMS FORGER',
              'STACK SHAPESHIFTER',
              'CHAIN ALCHEMIST',
              'PACKET HUNTER',
              'INTERFACE ALCHEMIST',
              'WORLD BUILDER',
              'PIPELINE PILOT',
              'SIGNAL HUNTER',
              'PROBLEM HUNTER',
            ].map((c, i) => (
              <Reveal key={c} delay={i * 40}>
                <span className="inline-block rounded-full border-2 border-ink bg-cream px-4 py-2 font-display text-xs uppercase tracking-wide sm:text-sm">
                  {c}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-punch py-16 text-cream sm:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:26px_26px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="display text-4xl sm:text-7xl">THE CREW IS COMING.</h2>
            <p className="mt-4 font-editorial text-2xl italic sm:text-3xl">
              Make sure you&apos;re in the frame.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="btn-sun mt-8 w-full text-base sm:w-auto sm:px-10"
            >
              Build My HH Goa ID →
            </button>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SampleId() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-sun" />
      <div className="relative animate-float overflow-hidden rounded-3xl border-4 border-forest bg-cream shadow-2xl">
        <div className="bg-forest px-4 py-3 text-center">
          <p className="font-display text-sm uppercase text-cream">Hacker House</p>
          <p className="font-display text-2xl text-butter">गोवा 2026</p>
        </div>
        <div className="m-3 flex h-36 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-punch bg-gradient-to-br from-leaf via-forest to-punch-deep">
          <span className="font-display text-xl uppercase tracking-widest text-cream/80">
            🌴 247
          </span>
        </div>
        <div className="px-4 pb-4 text-center">
          <p className="font-display text-3xl leading-none text-ink">
            ATHARV
            <br />
            KULSHRESTHA
          </p>
          <p className="mx-auto mt-3 inline-block rounded-full bg-sun px-4 py-1 font-display text-sm text-ink">
            AI / ML
          </p>
          <p className="mt-3 rounded-2xl bg-punch py-2 text-cream">
            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-butter">
              Builder Class
            </span>
            <span className="font-display text-lg">MODEL WHISPERER</span>
          </p>
          <p className="mt-3 flex items-center justify-between font-display text-xs text-ink">
            <span>#FrameInGoa</span>
            <span>HHGOA.COM</span>
          </p>
        </div>
      </div>
    </div>
  )
}
