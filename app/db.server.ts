// Серверный доступ к данным приложения.
// Если заданы переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY,
// данные читаются из облачной базы Supabase (PostgreSQL). Если конфигурации
// нет или база недоступна — используются локальные модули (app/data):
// приложение продолжает работать в любом случае (отказоустойчивость).

import type { GameVersion, Review, CollectionItem, Friend } from "~/types";
import { supabaseEnabled, getAuthClient as sb } from "~/supabase.server";
import { boxes } from "~/data/boxes";
import {
  games as localGames,
  reviewsBySlug as localReviews,
} from "~/data/games";
import {
  collection as localCollection,
  friends as localFriends,
} from "~/data/people";

// «60–90» -> «60–90 мин», «60–60» -> «60 мин», «90–150» -> «90+ мин»
function timeLabel(min: number, max: number): string {
  if (min === max) return `${min} мин`;
  if (min >= 90) return `${min}+ мин`;
  return `${min}–${max} мин`;
}

// строка БД game_versions -> объект интерфейса GameVersion
type VersionRow = {
  id: number;
  slug: string;
  name: string;
  theme: string;
  players_min: number;
  players_max: number;
  duration_min: number;
  duration_max: number;
  difficulty: string;
  age_limit: number;
  description: string;
  box_contents: string[];
  rating: number;
  ratings_count: number;
};

function toGameVersion(row: VersionRow, tags: string[]): GameVersion {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    theme: row.theme,
    tags,
    players: `${row.players_min}–${row.players_max} игроков`,
    time: timeLabel(row.duration_min, row.duration_max),
    difficulty: row.difficulty as GameVersion["difficulty"],
    age: row.age_limit,
    rating: Number(row.rating).toFixed(1),
    ratingsCount: row.ratings_count,
    description: row.description,
    box: row.box_contents ?? [],
    photo: boxes[row.slug],
  };
}

// PostgREST отдаёт встроенную запись объектом или массивом (зависит от
// типа связи); приводим оба варианта к одному объекту
function one<T>(embedded: T | T[] | null | undefined): T | null {
  if (Array.isArray(embedded)) return embedded[0] ?? null;
  return embedded ?? null;
}

// обёртка: пробует запрос к Supabase; при ошибке — предупреждение
// в терминал и локальные данные (сайт не падает)
async function withFallback<T>(
  what: string,
  operation: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (!supabaseEnabled) return fallback();
  try {
    return await operation();
  } catch (e) {
    console.warn(
      `[БД] Supabase: ${what} (${(e as Error).message}) — использованы локальные данные`,
    );
    return fallback();
  }
}

// ---------- каталог версий ----------
export function loadGames(): Promise<GameVersion[]> {
  return withFallback(
    "не удалось прочитать каталог",
    async () => {
      const { data: versions, error } = await sb()
        .from("game_versions")
        .select("*")
        .order("id");
      if (error)
        throw new Error(`не удалось прочитать каталог (${error.message})`);

      // теги версий отдельным запросом и группировкой
      const { data: links, error: linksError } = await sb()
        .from("version_tags")
        .select("version_id, tags(name)");
      if (linksError)
        throw new Error(`не удалось прочитать теги (${linksError.message})`);

      const tagsByVersion = new Map<number, string[]>();
      for (const link of links ?? []) {
        const name = one(link.tags as { name: string } | { name: string }[] | null)?.name;
        if (!name) continue;
        const list = tagsByVersion.get(link.version_id) ?? [];
        list.push(name);
        tagsByVersion.set(link.version_id, list);
      }

      return (versions as VersionRow[]).map((row) =>
        toGameVersion(row, tagsByVersion.get(row.id) ?? []),
      );
    },
    () => localGames,
  );
}

// ---------- отзывы по версиям ----------
export function loadReviewsBySlug(): Promise<Record<string, Review[]>> {
  return withFallback(
    "не удалось прочитать отзывы",
    async () => {
      const { data, error } = await sb()
        .from("reviews")
        .select("id, comment, entertainment, rules_ease, replayability, theme_match, game_versions(slug), users(nickname)")
        .eq("status", "одобрен")
        .order("id");
      if (error)
        throw new Error(`не удалось прочитать отзывы (${error.message})`);

      const result: Record<string, Review[]> = {};
      for (const r of data ?? []) {
        const slug = one(r.game_versions as { slug: string } | { slug: string }[] | null)?.slug;
        if (!slug) continue;
        const scores = [r.entertainment, r.rules_ease, r.replayability, r.theme_match];
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        (result[slug] ??= []).push({
          id: r.id,
          author: one(r.users as { nickname: string } | { nickname: string }[] | null)?.nickname ?? "Игрок",
          score: String(avg),
          text: r.comment ?? "",
        });
      }
      return result;
    },
    () => localReviews,
  );
}

// ---------- коллекция пользователя ----------
export function loadCollection(userId: number = 1): Promise<
  (CollectionItem & { game: GameVersion })[]
> {
  return withFallback(
    "не удалось прочитать коллекцию",
    async () => {
      const games = await loadGames();

      const { data, error } = await sb()
        .from("collection_items")
        .select("status, note, rating, game_versions(slug)")
        .eq("user_id", userId)
        .order("id");
      if (error)
        throw new Error(`не удалось прочитать коллекцию (${error.message})`);

      return (data ?? []).map((row, index) => {
        const slug = one(row.game_versions as { slug: string } | { slug: string }[] | null)?.slug ?? "";
        return {
          slug,
          status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
          ok: row.status === "есть дома",
          note: row.note ?? "",
          rating: String(row.rating ?? ""),
          game: games.find((g) => g.slug === slug)!,
          id: index + 1,
        };
      });
    },
    () =>
      // в резервном режиме личные данные показываются только у демо-пользователя
      userId === 1
        ? localCollection.map((c, index) => ({
            ...c,
            game: localGames.find((g) => g.slug === c.slug)!,
            id: index + 1,
          }))
        : [],
  );
}

// ---------- друзья ----------
export function loadFriends(userId: number = 1): Promise<Friend[]> {
  return withFallback(
    "не удалось прочитать друзей",
    async () => {
      // друзья читаются из таблицы friendships: связи текущего пользователя
      const { data, error } = await sb()
        .from("friendships")
        .select(
          "friend_id, users!friend_id(nickname, avatar_color, status_text, can_invite)",
        )
        .eq("user_id", userId)
        .eq("status", "принята")
        .order("friend_id");
      if (error)
        throw new Error(`не удалось прочитать друзей (${error.message})`);

      return (data ?? []).map((row) => {
        const u = one(
          row.users as
            | { nickname: string; avatar_color: string; status_text: string | null; can_invite: boolean }
            | { nickname: string; avatar_color: string; status_text: string | null; can_invite: boolean }[]
            | null,
        );
        return {
          id: row.friend_id,
          initials: (u?.nickname ?? "?")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase(),
          color: u?.avatar_color ?? "#4066B0",
          name: u?.nickname ?? "?",
          status: u?.status_text ?? "",
          canInvite: Boolean(u?.can_invite),
        };
      });
    },
    () => (userId === 1 ? localFriends : []),
  );
}
