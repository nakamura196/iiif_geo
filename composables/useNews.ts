// Single source of truth for announcements. The same `newsEntries` feed:
//   - the news list section on the landing page (HeadersForm),
//   - the news dialog opened from the menu (NewsDialog, used on the viewer page),
//   - the "unread" badge (newest entry's `date` compared against localStorage).
//
// To add an announcement: prepend an entry to `newsEntries`. The newest entry's
// `date` becomes the unread version key automatically, so every visitor sees the
// "New" badge again until they view it.

type Bilingual = { ja: string; en: string };

export interface NewsEntry {
  /** Version key for unread tracking + sorting. ISO-ish, e.g. "2026-05-24". */
  date: string;
  /** Human date shown in the list, per locale. */
  dateLabel: Bilingual;
  title: Bilingual;
  /** Optional longer description shown under the title. */
  detail?: Bilingual;
}

export const newsEntries: NewsEntry[] = [
  {
    date: "2026-05-24",
    dateLabel: { ja: "2026年5月24日", en: "May 24, 2026" },
    title: { ja: "デザインを刷新しました", en: "Redesigned interface" },
    detail: {
      ja: "配色・タイポグラフィ・操作パネルを全面的に見直し、より見やすく使いやすくしました。スマートフォンでの表示と操作も改善しています。",
      en: "Completely revised the color scheme, typography, and control panels for a cleaner, easier-to-use interface, with improved display and operation on smartphones.",
    },
  },
  {
    date: "2026-02",
    dateLabel: { ja: "2026年2月", en: "February 2026" },
    title: {
      ja: "Linked Places Format (LPF) 対応・サムネイル表示・UI 改善",
      en: "Linked Places Format (LPF) support, thumbnails, and UI improvements",
    },
  },
  {
    date: "2025-10",
    dateLabel: { ja: "2025年10月", en: "October 2025" },
    title: {
      ja: "マーカーのクラスタリング機能（重なり合うマーカーの展開・回転対応）を追加",
      en: "Added marker clustering (expansion of overlapping markers, rotation-aware)",
    },
  },
  {
    date: "2025-08",
    dateLabel: { ja: "2025年8月", en: "August 2025" },
    title: {
      ja: "MapLibre GL 対応（「れきちず」などの地図切替）・現在地表示を追加",
      en: 'Added MapLibre GL support (switchable base maps such as "Rekichizu") and current-location display',
    },
  },
  {
    date: "2025-07",
    dateLabel: { ja: "2025年7月", en: "July 2025" },
    title: {
      ja: "URL パラメータによる表示状態の保存／復元・JSON ビューアを追加",
      en: "Added saving/restoring of display state via URL parameters, and a JSON viewer",
    },
  },
  {
    date: "2024-09",
    dateLabel: { ja: "2024年9月", en: "September 2024" },
    title: {
      ja: "IIIF Manifest 対応・利用条件表示・ページネーションを追加",
      en: "Added IIIF Manifest support, license display, and pagination",
    },
  },
  {
    date: "2023-08",
    dateLabel: { ja: "2023年8月", en: "August 2023" },
    title: { ja: "初版を公開", en: "Initial public release" },
  },
];

const LATEST_NEWS_DATE = newsEntries[0]!.date;
const STORAGE_KEY = "iiif-geo:news-read";

// Module-level so all callers (list, menu button, hamburger dot, dialog) share
// one source of truth.
const lastReadDate = ref<string | null>(null);
const ready = ref(false);
const isOpen = ref(false);

export function useNews() {
  // Read localStorage only on the client, after mount, so SSR and the first
  // client render agree (`ready` is false → no badge) and hydration matches.
  onMounted(() => {
    if (!ready.value) {
      lastReadDate.value = localStorage.getItem(STORAGE_KEY);
      ready.value = true;
    }
  });

  const hasUnread = computed(
    () => ready.value && lastReadDate.value !== LATEST_NEWS_DATE
  );

  const markAsRead = () => {
    lastReadDate.value = LATEST_NEWS_DATE;
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, LATEST_NEWS_DATE);
  };

  const open = () => {
    isOpen.value = true;
    markAsRead();
  };

  return { newsEntries, hasUnread, markAsRead, isOpen, open };
}
