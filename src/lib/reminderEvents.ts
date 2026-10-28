/** Fired on window whenever reminders are saved, deleted or marked as shown. */
export const REMINDERS_CHANGED = 'dumriya:reminders-changed';

export function announceRemindersChanged(): void {
  window.dispatchEvent(new Event(REMINDERS_CHANGED));
}
