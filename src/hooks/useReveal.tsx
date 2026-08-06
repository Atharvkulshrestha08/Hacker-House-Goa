import { useEffect, useRef, type ElementType, type ReactNode } from 'react'
import { animate } from 'animejs'

interface RevealProps {
  as?: ElementType
  className?: string
  children: ReactNode
  delay?: number
}

export default function Reveal({ as: Tag = 'div', className, children, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    el.style.opacity = '0'
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect()
            animate(el, {
              opacity: [0, 1],
              translateY: [28, 0],
              duration: 750,
              delay,
              ease: 'outExpo',
            })
          }
        })
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
