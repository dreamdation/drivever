'use client'

import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT, AD_SLOTS, AdSize } from '@/lib/adsense'

interface AdSlotProps {
  size?: AdSize
  label?: string
}

// Renders a responsive AdSense display unit for the given placement.
// No-op until both the publisher ID (NEXT_PUBLIC_ADSENSE_CLIENT) and the
// matching ad-unit slot ID (lib/adsense.ts → AD_SLOTS) are configured, so
// nothing breaks during the pre-approval / pre-ad-unit phase.
export default function AdSlot({ size = 'leaderboard' }: AdSlotProps) {
  const slot = AD_SLOTS[size]
  const pushed = useRef(false)

  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot || pushed.current) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      /* AdSense not ready / blocked — ignore */
    }
  }, [slot])

  if (!ADSENSE_CLIENT || !slot) return null

  return (
    <div className="my-6 text-center" aria-hidden="true">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
