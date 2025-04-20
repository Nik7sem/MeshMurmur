export async function registerServiceWorker(scriptURL = './service-worker.js') {
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length > 0) {
    console.log('Service worker is already registered')
    return
  }
  await navigator.serviceWorker.register(scriptURL, {})
  console.log('Service worker has been registered');
}

export async function unregisterServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  for (const registration of registrations) {
    await registration.unregister();
    console.log('Service worker has been unregistered')
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  ;
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeNotifications(NOTIFICATION_KEY: string) {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(NOTIFICATION_KEY)
  })
  return JSON.stringify(subscription)
}
