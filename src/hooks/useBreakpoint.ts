/* Responsive breakpoint tiers:
 *   mobile:  ≤ 640px   (phones)
 *   tablet:  641–1024  (tablets, collapsed sidebar)
 *   laptop:  1025–1440 (standard laptops, full sidebar)
 *   desktop: > 1440px  (wide screens, max-width capped at ~1600px)
 */
import { useState, useEffect } from 'react'

export interface Breakpoint {
  isMobile:  boolean   // ≤ 640
  isTablet:  boolean   // 641–1024
  isLaptop:  boolean   // 1025–1440
  isDesktop: boolean   // > 1440
  /** Convenience: true when width ≤ 1024 (mobile or tablet) */
  isNarrow:  boolean
  width: number
}

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth
  return {
    isMobile:  w <= 640,
    isTablet:  w > 640  && w <= 1024,
    isLaptop:  w > 1024 && w <= 1440,
    isDesktop: w > 1440,
    isNarrow:  w <= 1024,
    width: w,
  }
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    const handler = () => setBp(getBreakpoint())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return bp
}
