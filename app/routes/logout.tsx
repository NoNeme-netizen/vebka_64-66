// Выход из аккаунта: очищает сессию и возвращает на главную.

import type { Route } from "./+types/logout";
import { destroyUserSession } from "~/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return destroyUserSession(request);
}
