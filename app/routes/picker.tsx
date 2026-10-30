// Слепой пикер: случайный выбор версии с помощью «колеса».
// Логика вращения вынесена в кастомный хук usePicker (app/hooks).

import { Link } from "react-router";
import type { Route } from "./+types/picker";
import { usePicker } from "~/hooks/usePicker";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Слепой пикер — Манчкин-пикер" },
    {
      name: "description",
      content:
        "Слепой пикер: случайный выбор версии «Манчкина» с помощью колеса — крути и играй.",
    },
  ];
}

// цвета секторов колеса — палитра тематик
const COLORS = ["#D9A441", "#9C4A4A", "#B85C38", "#6E8A5A", "#4A7E8C", "#8A7355"];

export default function Picker() {
  // вся логика колеса живёт в хуке
  const { rotation, spinning, result, resultIdx, spin } = usePicker();

  // сектора колеса рисуем через conic-gradient
  const gradient = `conic-gradient(${COLORS.map((c, i) => {
    const from = i * 60;
    const to = (i + 1) * 60;
    return `${c} ${from}deg ${to}deg`;
  }).join(", ")})`;

  // затемнение всех секторов, кроме выпавшего (когда колесо остановилось)
  const dim = (winner: number | null) =>
    `conic-gradient(${COLORS.map((_, i) => {
      const c =
        winner === null || i === winner || spinning
          ? "transparent"
          : "rgba(25, 25, 25, 0.4)";
      return `${c} ${i * 60}deg ${(i + 1) * 60}deg`;
    }).join(", ")})`;

  return (
    <div className="container mx-auto px-4 py-10 text-center">
      <h1 className="text-3xl font-bold">Слепой пикер</h1>
      <p className="text-muted mt-2">Крутите колесо — и спор окончен</p>

      {/* колесо */}
      <div className="relative w-80 h-80 mx-auto mt-10">
        {/* указатель сверху */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0
                     border-l-[13px] border-r-[13px] border-t-[22px]
                     border-l-transparent border-r-transparent border-t-accent drop-shadow"
        />

        {/* вращающийся круг */}
        <div
          className="w-full h-full rounded-full border-4 border-white shadow-lg relative"
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg)`,
            transition: "transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {/* затемнение невыигравших секторов после остановки */}
          {resultIdx !== null && !spinning && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: dim(resultIdx) }}
            />
          )}
        </div>

        {/* центральная кнопка «крутить» */}
        <button
          onClick={spin}
          disabled={spinning}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                     w-28 h-28 rounded-full bg-white border border-line font-bold
                     text-accent text-sm tracking-wide shadow-md
                     hover:scale-105 active:scale-95 transition-transform
                     disabled:opacity-60 disabled:hover:scale-100"
        >
          {spinning ? "..." : "КРУТИТЬ"}
        </button>
      </div>

      {/* результат розыгрыша */}
      {result ? (
        <div className="max-w-xl mx-auto mt-8 bg-white border border-line rounded-lg p-5 flex items-center gap-4 text-left">
          <img src={result.photo} alt={result.name} className="w-20 h-20 object-contain" />
          <div className="flex-1">
            <p className="text-xs text-muted">Вам выпало:</p>
            <h2 className="text-lg font-bold">{result.name}</h2>
            <p className="text-xs text-muted mt-0.5">
              {result.players} · {result.time} · сложность: {result.difficulty}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={spin} className="px-4 h-9 rounded-md bg-white border border-muted/50 text-xs hover:bg-soft">
              Ещё раз
            </button>
            <Link
              to={`/catalog/${result.slug}`}
              className="px-4 h-9 rounded-md bg-accent text-white text-xs font-bold grid place-items-center hover:bg-accent/90"
            >
              Играть!
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-muted text-sm mt-8">
          Выпавшая версия выбирается случайно из 6 — с учётом фильтров каталога
        </p>
      )}
    </div>
  );
}
