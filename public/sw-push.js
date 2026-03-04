self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.json();

        const options = {
            body: payload.body,
            icon: payload.icon || '/pwa-192x192.png',
            badge: payload.badge || '/pwa-512x512.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                url: payload.data?.url || '/'
            },
            actions: [
                { action: 'open', title: 'Open Chat' }
            ]
        };

        const promiseChain = self.registration.showNotification(payload.title, options);
        event.waitUntil(promiseChain);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    let urlToOpen = '/';
    if (event.notification.data && event.notification.data.url) {
        urlToOpen = event.notification.data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
