/** @type {import('next').NextConfig} */
const nextConfig = {
  // Provide placeholder values so Next.js static analysis
  // doesn't crash when real env vars are absent at build time.
  // The actual values are injected at runtime by Vercel.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_placeholder',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Disable source maps in production builds — prevents exposing server-side
  // source code to end users (FIND-P2 / security hardening).
  productionBrowserSourceMaps: false,

  experimental: {
    // FIND-05: allowedOrigins must include the production domain.
    // In development the app runs on localhost:3000; in production Vercel injects
    // NEXT_PUBLIC_APP_URL (e.g. https://homeserveai.com).  We strip the protocol
    // so Next.js receives the bare host[:port] string it expects.
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')]
          : []),
      ],
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // FIND-02: HTTP security headers applied to every response.
  // These provide defence-in-depth against XSS escalation, clickjacking,
  // MIME sniffing, protocol downgrade, and cross-origin attacks.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing attacks.
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Deny framing from any origin — prevents clickjacking on admin/payment pages.
          { key: 'X-Frame-Options', value: 'DENY' },

          // Reduce referrer leakage to third-party origins.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Disable access to sensitive browser APIs that this app doesn't use.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

          // Force HTTPS for 2 years (including subdomains); eligible for preload list.
          // Safe to set here — Vercel serves over HTTPS only in production.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

          // Prevent window.opener attacks from cross-origin popups.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },

          // Content-Security-Policy:
          // - default-src 'self'           baseline for all resource types
          // - script-src 'unsafe-inline'   required for Next.js inline hydration scripts
          // - script-src checkout.razorpay.com  Razorpay checkout SDK
          // - frame-src api.razorpay.com   Razorpay payment iframe
          // - img-src data: / supabase / Google / Unsplash  avatars, stored images, and
          //   the stock photography used across the marketing site (Hero, service pages,
          //   theme cards) — without this the browser silently blocks every one of them
          // - connect-src supabase         all Supabase REST + realtime calls
          // - font-src 'self' data:        self-hosted fonts
          // Note: 'unsafe-eval' is intentionally absent. Tighten 'unsafe-inline'
          // to a nonce-based policy post-launch for stronger XSS protection.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://images.unsplash.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
              "font-src 'self' data:",
              "media-src 'self' blob: https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Silence Razorpay/Twilio server-side only module warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
