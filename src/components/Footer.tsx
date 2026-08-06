export default function Footer() {
  return (
    <footer className="bg-forest-deep py-10 text-cream/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-lg uppercase text-cream">FrameInGoa</p>
            <p className="mt-1 text-xs">
              Hacker House Goa 2026 · 28–31 Oct · #FrameInGoa
            </p>
          </div>
          <p className="text-xs">
            Built for the Open Trials · Your photos never leave your device.
          </p>
        </div>
        <div className="mt-6 border-t border-cream/10 pt-4 text-center text-[11px] text-cream/40">
          © 2026 FrameInGoa · Hacker House Goa · 2:47PM Studio · HHGOA.COM
        </div>
      </div>
    </footer>
  )
}
