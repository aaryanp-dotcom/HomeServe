/**
 * Supabase's verifyOtp returns the same generic "Token has expired or is invalid" message
 * for a wrong code, an already-used code, and a genuinely time-expired one — so we can't
 * tell those apart from the message text, and must not claim "expired" specifically when it
 * may just be wrong. rateLimited() is checked separately since that message is distinct.
 */
export function otpVerifyErrorMessage(message: string): string {
  if (isRateLimited(message)) return 'Too many attempts. Please wait a moment and try again.'
  return 'The code is invalid or has expired. Please check it or request a new code.'
}

export function isRateLimited(message: string): boolean {
  return /security purposes|rate limit|too many requests/i.test(message)
}
