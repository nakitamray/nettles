const EXTINGUISHED = "nettles.extinguished";

export function loadExtinguished(): string[] {
  try {
    const raw = localStorage.getItem(EXTINGUISHED);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveExtinguished(ids: string[]) {
  try {
    localStorage.setItem(EXTINGUISHED, JSON.stringify(ids));
  } catch {
    // private mode or storage blocked; the ember just comes back next visit
  }
}
