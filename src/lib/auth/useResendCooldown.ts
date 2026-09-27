'use client'

import { useEffect, useState } from 'react'

const COOLDOWN_SECONDS = 60

/**
 * Shared "resend code" cooldown for the signup and login OTP screens. Ticks down once a
 * second and re-arms itself — unlike a one-shot `resent` boolean, the resend action becomes
 * available again on its own once the cooldown elapses, so a code that got lost (spam
 * folder, slow delivery) doesn't leave the user stuck with no way to ask for another.
 */
export function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  return { secondsLeft, canResend: secondsLeft === 0, start: () => setSecondsLeft(COOLDOWN_SECONDS) }
}
