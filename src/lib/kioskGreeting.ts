/** Time-of-day greeting prefix for kiosk / home (local clock). */
export function getKioskTimeOfDayPrefix(date: Date = new Date()): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const minutes = h * 60 + m;
  // 5:00–11:59 → morning; 12:00–16:59 → afternoon; 17:00–22:59 → evening; else → good night
  if (minutes >= 5 * 60 && minutes < 12 * 60) {
    return "Good morning";
  }
  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return "Good afternoon";
  }
  if (minutes >= 17 * 60 && minutes < 23 * 60) {
    return "Good evening";
  }
  return "Good night";
}

export function buildPersonalizedHomeGreeting(firstName: string, date?: Date): string {
  const prefix = getKioskTimeOfDayPrefix(date);
  return `${prefix}, ${firstName}.`;
}
