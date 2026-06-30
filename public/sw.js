const CACHE_NAME = 'garage-os-v4'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    )
    self.clients.claim()
})

self.addEventListener('fetch', event => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    if (
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/__nextjs') ||
        url.search.includes('_rsc')
    ) return

    const isStatic =
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.svg') ||
        url.pathname === '/manifest.webmanifest'

    if (!isStatic) return

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached
            return fetch(request).then(res => {
                if (res.ok) {
                    const clone = res.clone()
                    caches.open(CACHE_NAME).then(c => c.put(request, clone))
                }
                return res
            })
        })
    )
})

self.addEventListener('push', event => {
    let data = {}
    try { data = event.data?.json() ?? {} } catch { data = { title: 'Emirates Car Care', body: event.data?.text() ?? '' } }
    const { title = 'Emirates Car Care', body = '', url = '/track' } = data
    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url },
            vibrate: [200, 100, 200],
        })
    )
})

self.addEventListener('notificationclick', event => {
    event.notification.close()
    const url = event.notification.data?.url ?? '/'
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes(url) && 'focus' in client) return client.focus()
            }
            return clients.openWindow(url)
        })
    )
})
