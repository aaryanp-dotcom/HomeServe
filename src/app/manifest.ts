import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HomeServe — Home renovation & maintenance, Delhi NCR',
    short_name: 'HomeServe',
    description: 'Track your renovation, book home maintenance and manage payments with HomeServe.',
    start_url: '/homeowner/dashboard',
    display: 'standalone',
    background_color: '#EEEAE1',
    theme_color: '#EEEAE1',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
