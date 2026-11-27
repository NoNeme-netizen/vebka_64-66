// Фотографии коробок (резервные локальные WebP для режима без БД).
// При подключённом Supabase ссылки берутся из таблицы game_versions (Storage).
import origUrl from "../assets/boxes/orig.webp";
import vampUrl from "../assets/boxes/vamp.webp";
import rusUrl from "../assets/boxes/rus.webp";
import zombUrl from "../assets/boxes/zomb.webp";
import pirateUrl from "../assets/boxes/pirate.webp";
import apocUrl from "../assets/boxes/apoc.webp";

// фото ищутся по slug версии из базы данных
export const boxes: Record<string, string> = {
  orig: origUrl,
  vamp: vampUrl,
  rus: rusUrl,
  zomb: zombUrl,
  pirate: pirateUrl,
  apoc: apocUrl,
};
