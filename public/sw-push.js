self.addEventListener('push', function (event) {
    if (event.data) {
        let payload = {};
        try {
            payload = event.data.json();
        } catch {
            payload = { title: 'New message', body: event.data.text() };
        }

        const options = {
            body: payload.body,
            icon: payload.icon || '/pwa-192x192.png',
            badge: payload.badge || '/notification-badge-96.png',
            tag: payload.tag || payload.data?.phone || 'whatsapp-admin-message',
            renotify: true,
            timestamp: payload.data?.timestamp ? new Date(payload.data.timestamp).getTime() : Date.now(),
            vibrate: [120, 60, 120],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                url: payload.data?.url || '/',
                phone: payload.data?.phone || ''
            },
            actions: [
                { action: 'open', title: 'Open chat' }
            ]
        };

        const promiseChain = self.registration.showNotification(payload.title || 'New message', options);
        event.waitUntil(promiseChain);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    let urlToOpen = '/';
    if (event.notification.data && event.notification.data.url) {
        urlToOpen = event.notification.data.url;
    }
    const absoluteUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(absoluteUrl);
            }
        })
    );
});
