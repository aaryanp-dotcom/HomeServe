import type { Metadata } from 'next'
import { noIndex } from '@/lib/seo'

export const metadata: Metadata = { title: 'Forgot password', description: 'Reset your HomeServe account password.', ...noIndex }

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
