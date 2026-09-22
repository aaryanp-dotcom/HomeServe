import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HomeServe — Home renovation & maintenance, Delhi NCR'

/** Default share-card image for every page that doesn't define its own. Built from brand tokens, not a
 * supplied photo, so there's nothing here that could misrepresent a project or a claim. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#EEEAE1', padding: '64px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, background: '#FF4D17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: '#131210', letterSpacing: '-0.03em' }}>HomeServe</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 800, color: '#131210', letterSpacing: '-0.03em', lineHeight: 1.05, maxWidth: 980 }}>
            Renovation, done properly.
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(19,18,16,0.65)', maxWidth: 880 }}>
            One accountable team, from first sketch to every repair after — Delhi NCR.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, fontSize: 15, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(19,18,16,0.5)', fontFamily: 'monospace' }}>
          Delhi &nbsp;·&nbsp; Noida &nbsp;·&nbsp; Gurugram &nbsp;·&nbsp; Ghaziabad &nbsp;·&nbsp; Greater Noida &nbsp;·&nbsp; Faridabad
        </div>
      </div>
    ),
    size,
  )
}
