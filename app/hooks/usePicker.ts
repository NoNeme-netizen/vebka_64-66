// Кастомный хук «Слепого пикера»: выносит логику вращения колеса
import { useEffect, useRef, useState } from "react";
import type { GameVersion } from "~/types";

const SPIN_MS = 3000;
const WHEEL_SOUND_SRC = "/sounds/wheel-spin.mp3";

export function usePicker(games: GameVersion[]) {
  const [rotation, setRotation] = useState(0); 
  const [spinning, setSpinning] = useState(false); 
  const [resultIdx, setResultIdx] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  // предзагрузка звука на клиенте и очистка таймера/аудио при уходе со страницы
  useEffect(() => {
    const audio = new Audio(WHEEL_SOUND_SRC);
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      if (timer.current) clearTimeout(timer.current);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResultIdx(null);

    if (typeof Audio !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new Audio(WHEEL_SOUND_SRC);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
      });
    }

    const extra =
      360 * (4 + Math.floor(Math.random() * 2)) + Math.floor(Math.random() * 360);
    const target = rotation + extra;
    setRotation(target);
    timer.current = setTimeout(() => {
      stopSound();
      const sector = Math.floor(((360 - (target % 360)) % 360) / 60);
      setResultIdx(sector % games.length);
      setSpinning(false);
    }, SPIN_MS);
  };

  const result = resultIdx !== null ? games[resultIdx] : null;

  return { rotation, spinning, result, resultIdx, spin };
}
