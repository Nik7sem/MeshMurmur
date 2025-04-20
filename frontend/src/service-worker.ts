export default null
declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  if (event.data) {
    const message = JSON.parse(event.data.text())
    event.waitUntil(
      self.registration.showNotification(message.title, {
        body: message.body,
      })
    );
  }
});
