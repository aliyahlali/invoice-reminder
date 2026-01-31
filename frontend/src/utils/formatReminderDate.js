/**
 * Format a reminder date as "Today", "Tomorrow", "Yesterday", or "Jan 10".
 * @param {Date|string} d
 * @returns {string}
 */
export function formatReminderDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dDate = new Date(date);
  dDate.setHours(0, 0, 0, 0);

  if (dDate.getTime() === today.getTime()) return 'Today';
  if (dDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (dDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
