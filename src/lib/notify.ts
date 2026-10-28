/**
 * Browser notifications. There is no push server: alerts are shown by the app itself
 * while it is open or running in the background, and caught up when it is opened again.
 */

export type NotificationState = 'unsupported' | 'default' | 'granted' | 'denied';

export function notificationState(): NotificationState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationState;
}

/** Ask for permission. Only call this from a user tap (browsers block it otherwise). */
export async function requestNotificationPermission(): Promise<NotificationState> {
  if (notificationState() === 'unsupported') return 'unsupported';
  try {
    return (await Notification.requestPermission()) as NotificationState;
  } catch {
    return notificationState();
  }
}

/**
 * Show a system notification if allowed. Prefers the service worker (required on
 * Android Chrome, where `new Notification()` throws), then falls back to the page.
 * Returns true if a notification was shown.
 */
export async function showSystemNotification(title: string, body: string, tag: string): Promise<boolean> {
  if (notificationState() !== 'granted') return false;
  const options: NotificationOptions = { body, tag, icon: '/pwa-192x192.png', badge: '/pwa-64x64.png', data: { url: '/reminders' } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    /* fall back below */
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
