export function askNotificationPermission() {
  if (("Notification" in window)) {
    if (Notification.permission === "granted") {
      return
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }
}

export function notifyUser(text: string) {
  if (("Notification" in window)) {
    if (Notification.permission === "granted") {
      new Notification(text);
    }
  }
}
