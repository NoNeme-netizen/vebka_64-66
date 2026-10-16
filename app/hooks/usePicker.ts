import { useEffect, useRef, useState } from "react";
import { games } from "~/data/games";

// длительность вращения колеса, мс
const SPIN_MS = 3000;

export function usePicker() {
  const [rotation, setRotation] = useState(0); // текущий угол колеса
  const [spinning, setSpinning] = useState(false); // крутится ли сейчас
  const [resultIdx, setResultIdx] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // останавливаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResultIdx(null);
    // 4–6 полных оборотов плюс случайный довесок
    const extra =
      360 * (4 + Math.floor(Math.random() * 2)) + Math.floor(Math.random() * 360);
    const target = rotation + extra;
    setRotation(target);
    // когда колесо остановится — вычисляем сектор под стрелкой
    timer.current = setTimeout(() => {
      const sector = Math.floor(((360 - (target % 360)) % 360) / 60);
      setResultIdx(sector % games.length);
      setSpinning(false);
    }, SPIN_MS);
  };

  // выпавшая версия (или null, если ещё не крутили)
  const result = resultIdx !== null ? games[resultIdx] : null;

  return { rotation, spinning, result, resultIdx, spin };
}