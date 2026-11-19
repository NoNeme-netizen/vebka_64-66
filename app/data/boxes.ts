// Фотографии коробок: единая точка подключения картинок.
// Vite сам подставит правильные пути при сборке проекта.
import origUrl from "../assets/boxes/orig.png";
import vampUrl from "../assets/boxes/vamp.png";
import rusUrl from "../assets/boxes/rus.png";
import zombUrl from "../assets/boxes/zomb.png";
import pirateUrl from "../assets/boxes/pirate.png";
import apocUrl from "../assets/boxes/apoc.png";

// фото ищутся по slug версии из базы данных
export const boxes: Record<string, string> = {
  orig: origUrl,
  vamp: vampUrl,
  rus: rusUrl,
  zomb: zombUrl,
  pirate: pirateUrl,
  apoc: apocUrl,
};
