import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { getUser } from "~/auth.server";
import "./app.css";

import Header from "~/components/Header"; // шапка сайта
import Footer from "~/components/Footer"; // подвал сайта

// Корневой layout: обёртка всех страниц приложения.
// Шапка и подвал общие, содержимое страницы подставляется в <Outlet />.

// Корневой загрузчик: определяет, кто вошёл в приложение (или гость).
export async function loader({ request }: Route.LoaderArgs) {
  return { user: await getUser(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // данные корневого загрузчика (undefined — например, страница ошибки)
  const data = useRouteLoaderData<typeof loader>("root");
  const user = data?.user ?? null;

  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Упс!";
  let details = "Произошла неожиданная ошибка.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Ошибка";
    details =
      error.status === 404
        ? "Такой страницы нет в приложении."
        : error.statusText || details;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p className="mt-2 text-muted">{details}</p>
    </main>
  );
}
