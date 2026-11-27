// Коллекция пользователя: какие версии есть, какие у друзей,
// заметки о состоянии коробок и личные оценки.

import { useState } from "react";
import { Link, Form, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/collection";
import { getUser } from "~/auth.server";
import {
  addToCollection,
  loadCollection,
  loadGames,
  removeFromCollection,
} from "~/db.server";
import { COLLECTION_STATUSES } from "~/data/statuses";
import PrivateGate from "~/components/PrivateGate";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Моя коллекция — Манчкин-пикер" },
    { name: "robots", content: "noindex" },
  ];
}

// данные страницы зависят от пользователя: гость видит предложение войти,
// вошедший — свою коллекцию из базы (или резерва)
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) {
    return {
      user: null,
      rows: [],
      total: 6,
      missing: [] as { slug: string; name: string }[],
    };
  }
  const [games, collection] = await Promise.all([
    loadGames(),
    loadCollection(user.id),
  ]);
  const rows = collection.flatMap((c) => {
    const game = games.find((g) => g.slug === c.slug);
    return game ? [{ ...c, game }] : [];
  });
  // версии, которых ещё нет в коллекции — их предлагаем добавить
  const taken = new Set(rows.map((r) => r.slug));
  const missing = games
    .filter((g) => !taken.has(g.slug))
    .map((g) => ({ slug: g.slug, name: g.name }));

  return { user, rows, total: games.length, missing };
}

// добавление и удаление версии в коллекции: пишет в collection_items
export async function action({ request }: Route.ActionArgs) {
  const user = await getUser(request);
  if (!user) return { ok: false, error: "Сначала войдите в аккаунт", message: null };

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "add");
  const slug = String(form.get("slug") ?? "");

  if (intent === "remove") {
    const error = await removeFromCollection(user.id, slug);
    return error
      ? { ok: false, error, message: null }
      : { ok: true, error: null, message: "Версия удалена из коллекции" };
  }

  const status = String(form.get("status") ?? "есть дома");
  const error = await addToCollection(user.id, slug, status);
  return error
    ? { ok: false, error, message: null }
    : { ok: true, error: null, message: "Версия добавлена в коллекцию ✓" };
}

export default function Collection() {
  const { user, rows, total, missing } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  // фильтр списка по статусу («все» или конкретный статус)
  const [statusFilter, setStatusFilter] = useState<string>("все");

  // незарегистрированному чужая коллекция не показывается
  if (!user) return <PrivateGate what="Моя коллекция" />;

  // «есть дома» — реально собранные версии; процент считается от них,
  // чтобы надпись и полоса показывали одно и то же
  const have = rows.filter((r) => r.ok).length;
  const percent = total > 0 ? Math.round((have / total) * 100) : 0;

  // фильтр списка по статусу (в таблице показываются только выбранные)
  const visibleRows =
    statusFilter === "все"
      ? rows
      : rows.filter((r) => r.status.toLowerCase() === statusFilter);

  const countByStatus = (st: string) =>
    rows.filter((r) => r.status.toLowerCase() === st).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Моя коллекция</h1>
          <p className="text-muted text-sm mt-1">
            Отмечайте версии, которые есть у вас, — и не ройтесь в коробках перед игрой.
          </p>
        </div>
        <Link
          to="/catalog"
          className="btn-hard bg-accent px-5 h-10 text-sm"
        >
          Добавить версию
        </Link>
      </div>

      {/* добавление версии прямо на странице коллекции */}
      <section className="card mt-6 p-5">
        <p className="text-[10px] font-bold text-muted">ДОБАВИТЬ ВЕРСИЮ В КОЛЛЕКЦИЮ</p>
        {missing.length === 0 ? (
          <p className="text-sm text-muted mt-3">
            В коллекции уже все версии из каталога.
          </p>
        ) : (
          <Form
            key={missing.map((g) => g.slug).join(",")}
            method="post"
            className="flex flex-wrap items-end gap-3 mt-3"
          >
            <input type="hidden" name="intent" value="add" />
            <label className="flex-1 min-w-[240px]">
              <span className="text-xs text-muted">Версия</span>
              <select
                name="slug"
                className="mt-1 w-full h-10 rounded-md bg-white border-2 border-ink px-3 text-sm"
                defaultValue={missing[0].slug}
              >
                {missing.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs text-muted">Статус</span>
              <select
                name="status"
                className="mt-1 w-full h-10 rounded-md bg-white border-2 border-ink px-3 text-sm"
                defaultValue="есть дома"
              >
                {COLLECTION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-hard bg-accent px-5 h-10 text-sm disabled:opacity-60"
            >
              Добавить
            </button>
          </Form>
        )}

        {result && (
          <p
            className={`mt-3 text-sm font-bold ${
              result.ok ? "text-[#4e6b43]" : "text-[#9C4A4A]"
            }`}
          >
            {result.ok ? result.message : result.error}
          </p>
        )}
      </section>

      {/* фильтр по статусу */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <span className="text-xs font-bold text-muted mr-1">ПОКАЗАТЬ:</span>
        {[
          { key: "все", label: `Все (${rows.length})` },
          ...COLLECTION_STATUSES.map((st) => ({
            key: st,
            label: `${st.charAt(0).toUpperCase() + st.slice(1)} (${countByStatus(st)})`,
          })),
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`btn-hard px-3.5 h-8 text-xs ${
              statusFilter === f.key ? "bg-accent" : "bg-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* таблица коллекции */}
      <div className="card mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-soft text-[10px] text-muted text-left">
              <th className="px-6 py-3 font-bold">ВЕРСИЯ</th>
              <th className="px-4 py-3 font-bold w-36">СТАТУС</th>
              <th className="px-4 py-3 font-bold">ЗАМЕТКА О КОРОБКЕ</th>
              <th className="px-4 py-3 font-bold w-24 text-right">ОЦЕНКА</th>
              <th className="px-4 py-3 font-bold w-28 text-right">ДЕЙСТВИЕ</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr className="border-t border-line">
                <td colSpan={5} className="px-6 py-8 text-center text-muted">
                  {rows.length === 0
                    ? "В коллекции пока пусто — добавьте первую версию выше или из каталога."
                    : "Игр с таким статусом пока нет."}
                </td>
              </tr>
            ) : (
              visibleRows.map((r) => (
                <tr key={r.slug} className="border-t border-line">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={r.game.photo} alt={`Коробка: ${r.game.name}`} className="w-11 h-9 object-contain" />
                      <div>
                        <Link to={`/catalog/${r.slug}`} className="font-bold hover:underline">
                          {r.game.name}
                        </Link>
                        <p className="text-xs text-muted">{r.game.theme}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block whitespace-nowrap text-xs px-2.5 py-1 rounded-full border-2 border-ink font-bold ${
                        r.ok ? "bg-[#e4f3e6] text-[#2c6e38]" : "bg-white text-muted"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted">{r.note}</td>
                  <td className="px-4 py-4 text-right text-gold">★ {r.rating}</td>
                  <td className="px-4 py-4 text-right">
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="remove" />
                      <input type="hidden" name="slug" value={r.slug} />
                      <button
                        type="submit"
                        disabled={busy}
                        className="btn-hard bg-white px-3 h-8 text-xs disabled:opacity-60"
                      >
                        Удалить
                      </button>
                    </Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* прогресс сбора версий */}
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">В коллекции {have} из {total} версий</span>
          <span className="text-muted">{percent}%</span>
        </div>
        <div className="h-3 rounded-full bg-white border-2 border-ink mt-3">
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted mt-2">
          Отмечено в списке: {rows.length} из {total} версий
          {rows.length - have > 0
            ? `, из них «у друга» или «хочу купить» — ${rows.length - have}`
            : ""}
          . Ещё {total - rows.length}{" "}
          {total - rows.length === 1
            ? "версия не добавлена"
            : total - rows.length >= 2 && total - rows.length <= 4
              ? "версии не добавлены"
              : "версий не добавлено"}{" "}
          в список.
        </p>
      </div>
    </div>
  );
}
