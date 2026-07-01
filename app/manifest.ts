import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Emirates Car Care',
        short_name: 'Emirates CC',
        description: 'Professional auto-workshop management',
        start_url: '/',
        display: 'standalone',
        background_color: '#0D0D0D',
        theme_color: '#0D0D0D',
        orientation: 'portrait',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
    }
}
