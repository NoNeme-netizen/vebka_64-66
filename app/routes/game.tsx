
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/game";
import { getUser } from "~/auth.server";
import {
  addToCollection,
  loadCollection,
  loadGames,
  loadReviewsBySlug,
  removeFromCollection,
} from "~/db.server";
import { boxSizes } from "~/data/games";
import Button from "~/components/ui/Button";

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getUser(request);
  const games = await loadGames();
  const game = games.find((g) => g.slug === params.slug);
  const [reviewsBySlug, collection] = await Promise.all([
    game ? loadReviewsBySlug() : Promise.resolve({} as Record<string, never[]>),
    user ? loadCollection(user.id) : Promise.resolve([]),
  ]);
  const reviews = game ? reviewsBySlug[game.slug] ?? [] : [];
  return {
    game,
    reviews,
    signedIn: Boolean(user),
    inCollection: collection.some((c) => c.slug === params.slug),
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const user = await getUser(request);
  if (!user) return { ok: false, error: "Сначала войдите в аккаунт", message: null };

  const slug = String(params.slug ?? "");
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "add");

  if (intent === "remove") {
    const error = await removeFromCollection(user.id, slug);
    return error
      ? { ok: false, error, message: null }
      : { ok: true, error: null, message: "Версия удалена из коллекции" };
  }

  const error = await addToCollection(user.id, slug, "есть дома");
  return error
    ? { ok: false, error, message: null }
    : { ok: true, error: null, message: "Версия добавлена в коллекцию ✓" };
}

export function meta({ matches }: Route.MetaArgs) {
  const data = matches.find((m) => m?.id === "routes/game")?.loaderData as
    | { game: { name: string } | null }
    | undefined;
  const game = data?.game ?? null;
  return [
    { title: `${game ? game.name : "Версия"} — Манчкин-пикер` },
    {
      name: "description",
      content: game
        ? `${game.name} — характеристики, состав коробки и отзывы игроков. Выберите версию для следующей партии.`
        : "Карточка версии «Манчкина» в каталоге Манчкин-пикер.",
    },
  ];
}

export default function GamePage() {
  const { game, reviews, signedIn, inCollection } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Версия не найдена</h1>
        <Link to="/catalog" className="font-bold underline decoration-2 underline-offset-2 text-sm mt-3 inline-block">
          ← вернуться в каталог
        </Link>
      </div>
    );
  }

  const params: [string, string][] = [
    ["Игроки", game.players],
    ["Время партии", game.time],
    ["Сложность", game.difficulty],
    ["Возраст", `${game.age}+`],
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* «хлебные крошки» */}
      <p className="text-xs text-muted">
        <Link to="/catalog" className="hover:underline">Каталог</Link>
        {" → "}{game.name}
      </p>

      <div className="flex gap-10 mt-4">
        {/* левая колонка: фото коробки */}
        <div className="w-[440px] shrink-0">
          <div className="card p-6 grid place-items-center overflow-hidden -rotate-2 hover:rotate-0 transition-transform">
            <img
              src={game.photo}
              alt={game.name}
              width={boxSizes[game.slug].w}
              height={boxSizes[game.slug].h}
              fetchPriority="high"
              className="max-h-72 w-auto max-w-full object-contain"
            />
          </div>

          {/* содержимое коробки */}
          <h2 className="font-bold text-sm mt-5">Что в коробке</h2>
          <ul className="mt-2 space-y-1">
            {game.box.map((b) => (
              <li key={b} className="text-sm text-muted flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted" /> {b}
              </li>
            ))}
          </ul>
        </div>

        {/* правая колонка: информация о версии */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{game.name}</h1>

          <div className="flex flex-wrap gap-2 mt-3">
            {game.tags.map((t) => (
              <span key={t} className="chip !text-xs !px-2.5 !py-0.5">
                {t}
              </span>
            ))}
          </div>

          <p className="mt-3">
            <span className="text-gold font-black text-xl">★ {game.rating}</span>
            <span className="text-muted text-sm ml-2">· {game.ratingsCount} оценок</span>
          </p>

          {/* характеристики */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {params.map(([label, value]) => (
              <div key={label} className="card !shadow-[4px_4px_0_0_#141414] px-4 py-3">
                <p className="text-[11px] text-muted">{label}</p>
                <p className="font-bold text-[15px] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 leading-relaxed">{game.description}</p>

          {/* действия */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {!signedIn ? (
              <Link to="/login" className="btn-hard bg-accent px-5 h-11 text-sm">
                Войдите, чтобы добавить
              </Link>
            ) : inCollection ? (
              <Form method="post" className="flex items-center gap-2">
                <input type="hidden" name="intent" value="remove" />
                <span className="text-sm font-bold text-[#4e6b43] px-2">
                  В коллекции ✓
                </span>
                <Button type="submit" variant="secondary" disabled={busy}>
                  Удалить из коллекции
                </Button>
              </Form>
            ) : (
              <Form method="post">
                <input type="hidden" name="intent" value="add" />
                <Button type="submit" disabled={busy}>
                  В коллекцию
                </Button>
              </Form>
            )}
            <Link
              to="/friends"
              className="btn-hard bg-white px-5 h-11 text-sm"
            >
              Позвать друзей
            </Link>
            <Link to="/picker" className="text-sm font-bold underline decoration-2 underline-offset-2">
              или крутить Слепой пикер
            </Link>
          </div>

          {result && (
            <p
              className={`mt-3 text-sm font-bold ${
                result.ok ? "text-[#4e6b43]" : "text-[#9C4A4A]"
              }`}
            >
              {result.ok ? result.message : result.error}
            </p>
          )}

          {/* отзывы */}
          <h2 className="font-bold text-sm mt-10">Отзывы игроков</h2>
          <div className="grid grid-cols-2 gap-4 mt-3">
            {reviews.map((r) => (
              <div key={r.id} className="card !shadow-[4px_4px_0_0_#141414] p-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-accent border-2 border-ink text-ink text-xs font-bold grid place-items-center">
                    {r.author[0]}
                  </span>
                  <span className="font-bold text-sm">{r.author}</span>
                  <span className="text-gold text-sm ml-auto">★ {r.score}</span>
                </div>
                <p className="text-sm text-muted mt-2 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
