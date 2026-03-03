self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.json();

        const options = {
            body: payload.body,
            icon: payload.icon || '/icon512_rounded.png',
            badge: payload.badge || '/icon512_maskable.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                dateOfArrival: Date.now()
            }
        };

        const promiseChain = self.registration.showNotification(payload.title, options);
        event.waitUntil(promiseChain);
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
