/**
 * Client-side recent / pinned / favorite searches + most-searched counters.
 * No schema change — localStorage only.
 */

const KEY = "travelos:smart-search:v1";

export type SearchHistoryItem = {
  q: string;
  at: number;
  count: number;
  pinned?: boolean;
  favorite?: boolean;
  lastCustomerId?: string;
  lastLabel?: string;
};

type Store = {
  items: SearchHistoryItem[];
};

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as Store;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function listSearchHistory(): SearchHistoryItem[] {
  return read().items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.at - a.at;
  });
}

export function recordSearch(q: string, meta?: { customerId?: string; label?: string }) {
  const needle = q.trim();
  if (needle.length < 2) return;
  const store = read();
  const existing = store.items.find((i) => i.q.toLowerCase() === needle.toLowerCase());
  if (existing) {
    existing.count += 1;
    existing.at = Date.now();
    if (meta?.customerId) existing.lastCustomerId = meta.customerId;
    if (meta?.label) existing.lastLabel = meta.label;
  } else {
    store.items.unshift({
      q: needle,
      at: Date.now(),
      count: 1,
      lastCustomerId: meta?.customerId,
      lastLabel: meta?.label,
    });
  }
  store.items = store.items.slice(0, 40);
  write(store);
}

export function togglePinned(q: string) {
  const store = read();
  const item = store.items.find((i) => i.q.toLowerCase() === q.toLowerCase());
  if (!item) {
    store.items.unshift({ q, at: Date.now(), count: 1, pinned: true });
  } else {
    item.pinned = !item.pinned;
  }
  write(store);
}

export function toggleFavorite(q: string) {
  const store = read();
  const item = store.items.find((i) => i.q.toLowerCase() === q.toLowerCase());
  if (!item) {
    store.items.unshift({ q, at: Date.now(), count: 1, favorite: true });
  } else {
    item.favorite = !item.favorite;
  }
  write(store);
}

export function mostSearched(limit = 10): SearchHistoryItem[] {
  return [...read().items].sort((a, b) => b.count - a.count || b.at - a.at).slice(0, limit);
}
