// Центральный узел маршрутизации приложения.
// Каждая страница — отдельный файл в папке app/routes.

import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"), // главная
  route("catalog", "routes/catalog.tsx"), // каталог версий
  route("catalog/:slug", "routes/game.tsx"), // карточка версии
  route("picker", "routes/picker.tsx"), // слепой пикер
  route("collection", "routes/collection.tsx"), // коллекция
  route("login", "routes/login.tsx"), // вход
  route("signup", "routes/signup.tsx"), // регистрация
  route("friends", "routes/friends.tsx"),
  route("logout", "routes/logout.tsx"), // выход из аккаунта (POST) // друзья
] satisfies RouteConfig;
