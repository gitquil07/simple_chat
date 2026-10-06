const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

export function formatTime(ms: number): string {
  return timeFormat.format(ms);
}

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Time for today, a short date otherwise, as in the chat list. */
export function formatListTime(ms: number): string {
  return isSameDay(ms, Date.now()) ? timeFormat.format(ms) : dateFormat.format(ms);
}

export function formatDay(ms: number): string {
  if (isSameDay(ms, Date.now())) return 'Today';
  if (isSameDay(ms, Date.now() - 86_400_000)) return 'Yesterday';
  return dayFormat.format(ms);
}

export { isSameDay };
