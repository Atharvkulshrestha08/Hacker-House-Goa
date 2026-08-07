/**
 * SharePage — shown when the user navigates to /#share.
 *
 * Reads the passport image from sessionStorage (set when the QR was drawn)
 * and displays it full-screen with a download button.
 */
import { useEffect, useState } from 'react'
import { loadShareImage } from '../lib/qr'

export default function SharePage() {
  const [src, setSrc] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const img = loadShareImage()
    if (img) {
      setSrc(img)
    } else {
      setNotFound(true)
    }
  }, [])

  const handleDownload = () => {
    if (!src) return
    const a = document.createElement('a')
    a.href = src
    a.download = 'HHGoa26_builder-passport.jpg'
    a.click()
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a3d2e] text-white p-8">
        <p className="font-display text-2xl uppercase tracking-widest text-[#ffd23f]">
          Passport Not Found
        </p>
        <p className="mt-3 text-sm text-white/60">
          This link only works on the device that generated the passport, in the same browser session.
        </p>
        <a
          href="/"
          className="mt-8 rounded-full bg-[#ff3da8] px-8 py-3 font-display text-sm uppercase tracking-widest text-white"
        >
          Create Your Passport
        </a>
      </div>
    )
  }

  if (!src) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a3d2e]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ffd23f] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#061a14] p-4">
      <p className="font-display text-lg uppercase tracking-widest text-[#ffd23f]">
        🌴 Hacker House Goa 2026 · Builder Passport
      </p>
      <img
        src={src}
        alt="Builder Passport"
        className="max-h-[80vh] w-full max-w-4xl rounded-2xl shadow-2xl object-contain"
      />
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          className="rounded-full bg-[#ff3da8] px-8 py-3 font-display text-sm uppercase tracking-widest text-white shadow-lg transition hover:opacity-90"
        >
          ⬇ Download Passport
        </button>
        <a
          href="/"
          className="rounded-full border-2 border-white/30 px-8 py-3 font-display text-sm uppercase tracking-widest text-white/80 transition hover:border-white"
        >
          Create Yours
        </a>
      </div>
      <p className="text-xs text-white/40">
        Scan the QR code on the passport to view this page again
      </p>
    </div>
  )
}
