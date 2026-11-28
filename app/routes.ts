// Центральный узел маршрутизации приложения.
// Каждая страница — отдельный файл в папке app/routes.

import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"), 
  route("catalog", "routes/catalog.tsx"), 
  route("catalog/:slug", "routes/game.tsx"), 
  route("picker", "routes/picker.tsx"), 
  route("collection", "routes/collection.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("friends", "routes/friends.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
