
import { useState } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/friends";
import { getUser } from "~/auth.server";
import { addFriend, loadFriendCandidates, loadFriends } from "~/db.server";
import type { Friend, FriendCandidate } from "~/types";
import PrivateGate from "~/components/PrivateGate";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Друзья — Манчкин-пикер" },
    { name: "robots", content: "noindex" },
    {
      name: "description",
      content:
        "Пригласите друзей и соберите компанию для следующей партии «Манчкина».",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  if (!user) {
    return {
      user: null,
      friends: [] as Friend[],
      candidates: [] as FriendCandidate[],
    };
  }
  const [friends, candidates] = await Promise.all([
    loadFriends(user.id),
    loadFriendCandidates(user.id),
  ]);
  return { user, friends, candidates };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUser(request);
  if (!user) return { ok: false, error: "Сначала войдите в аккаунт" };

  const form = await request.formData();
  const friendId = Number(form.get("friendId"));
  const error = await addFriend(user.id, friendId);
  return error ? { ok: false, error } : { ok: true, error: null };
}

export default function Friends() {
  const { user, friends: list, candidates } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const adding = navigation.state === "submitting";

  const [invited, setInvited] = useState<number[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const invite = (id: number) => setInvited((prev) => [...prev, id]);

  if (!user) return <PrivateGate what="Список друзей" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Друзья</h1>
          <p className="text-muted text-sm mt-1">
            Позовите компанию — вместе и веселее, и спорить есть с кем.
          </p>
        </div>
        <button
          className="btn-hard bg-accent px-4 h-10 text-xs"
          onClick={() => setPickerOpen((v) => !v)}
        >
          {pickerOpen ? "Скрыть список" : "+ Добавить друга"}
        </button>
      </div>

      {/* сообщение после добавления друга */}
      {result && (
        <p
          className={`mt-4 text-sm font-bold ${
            result.ok ? "text-[#4e6b43]" : "text-[#9C4A4A]"
          }`}
        >
          {result.ok ? "Друг добавлен в список ✓" : result.error}
        </p>
      )}

      {/* список игроков, которых можно добавить */}
      {pickerOpen && (
        <section className="card mt-4 p-5">
          <p className="text-[10px] font-bold text-muted">
            ИГРОКИ, КОТОРЫХ ЕЩЁ НЕТ В ДРУЗЬЯХ · {candidates.length}
          </p>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted mt-3">
              Добавлять пока некого: все зарегистрированные игроки уже у вас в друзьях.
            </p>
          ) : (
            <ul className="mt-2">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 py-3 border-b border-line last:border-0"
                >
                  <span
                    className="w-10 h-10 rounded-full border-2 border-ink text-white text-[11px] font-bold grid place-items-center"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{c.name}</p>
                    <p className="text-xs text-muted">{c.status}</p>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="friendId" value={c.id} />
                    <button
                      type="submit"
                      disabled={adding}
                      className="btn-hard bg-accent px-4 h-9 text-xs disabled:opacity-60"
                    >
                      Добавить
                    </button>
                  </Form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="flex gap-6 mt-6">
        {/* список друзей */}
        <section className="card flex-1 p-5">
          <p className="text-[10px] font-bold text-muted">МОИ ДРУЗЬЯ · {list.length}</p>
          <ul>
            {list.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 py-3.5 border-b border-line last:border-0"
              >
                {/* аватарка с инициалами */}
                <span
                  className="w-11 h-11 rounded-full border-2 border-ink text-white text-xs font-bold grid place-items-center"
                  style={{ backgroundColor: f.color }}
                >
                  {f.initials}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-xs text-muted">{f.status}</p>
                </div>
                {invited.includes(f.id) ? (
                  <span className="text-xs text-[#4e6b43] font-bold px-3">
                    Приглашение отправлено ✓
                  </span>
                ) : f.canInvite ? (
                  <button
                    onClick={() => invite(f.id)}
                    className="btn-hard bg-accent px-4 h-9 text-xs"
                  >
                    Позвать играть
                  </button>
                ) : (
                  <span className="text-xs text-muted px-3">недоступен</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* правая колонка: заявки и приглашение по ссылке */}
        <aside className="w-80 shrink-0 space-y-5">
          <div className="card p-5">
            <p className="text-[10px] font-bold text-muted">ЗАЯВКИ В ДРУЗЬЯ · 1</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="w-10 h-10 rounded-full bg-[#8C6A8C] border-2 border-ink text-white text-[11px] font-bold grid place-items-center">
                РШ
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">Рома Ш.</p>
                <p className="text-xs text-muted">3 общих друга</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-hard bg-accent px-4 h-8 text-xs">
                Принять
              </button>
              <button className="btn-hard bg-white px-4 h-8 text-xs">
                Скрыть
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm">Пригласить по ссылке</h2>
            <div className="flex gap-2 mt-3">
              <span className="flex-1 h-10 rounded-md bg-soft border-2 border-ink px-3 text-xs leading-10 truncate">
                munchkin-picker.ru/inv/8F3K2
              </span>
              <button
                className="btn-hard bg-accent px-4 h-10 text-xs"
                onClick={() => navigator.clipboard?.writeText("munchkin-picker.ru/inv/8F3K2")}
              >
                Скопировать
              </button>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Ссылку можно отправить другу в мессенджере — аккаунт создастся сразу.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm">Как это работает</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted list-none">
              {[
                "Нажмите «Позвать играть» у друга",
                "Друг примет приглашение",
                "Выберите версию и начинайте партию",
              ].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-accent border-2 border-ink text-ink text-xs font-bold grid place-items-center">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
