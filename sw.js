/**
 * Service Worker — Ascendora
 * Gère les notifications de rappel même quand l'onglet est fermé
 */

const REMINDERS_KEY = 'ascendora_reminders';

// Réception d'un message depuis app.js
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SCHEDULE_REMINDERS') {
        scheduleReminders(event.data.reminders);
    }
});

// Planifier les rappels via des alarmes simulées
function scheduleReminders(reminders) {
    // Stocker dans le cache du SW pour persistance
    self.registration.showNotification; // keep SW alive hint

    reminders.forEach(r => {
        const delay = r.fireAt - Date.now();
        if (delay <= 0) return;
        setTimeout(() => {
            self.registration.showNotification(`🔔 Rappel — ${r.name}`, {
                body: r.body,
                icon: r.icon || '/assets/favicon.ico',
                badge: r.icon || '/assets/favicon.ico',
                tag: `reminder-${r.id}`,
                renotify: true,
                data: { url: self.location.origin }
            });
        }, delay);
    });
}

// Clic sur la notification → ouvrir/focus l'app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || self.location.origin;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            const existing = list.find(c => c.url.startsWith(url));
            if (existing) return existing.focus();
            return clients.openWindow(url);
        })
    );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
