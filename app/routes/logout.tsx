// Выход из аккаунта: очищает сессию и возвращает на главную.
// Компонент (разметка) не нужен — маршрут только обрабатывает
// POST-запрос из кнопки «Выйти» в шапке.

import type { Route } from "./+types/logout";
import { destroyUserSession } from "~/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return destroyUserSession(request);
}
