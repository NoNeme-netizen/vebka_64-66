import type { Config } from "@react-router/dev/config";

export default {
  // Сервер за nginx получает HTTP, хотя браузер подключается по HTTPS.
  // Разрешаем свой домен для POST-действий, чтобы CSRF-проверка
  // React Router не считала запрос подменённым из-за TLS-терминации в nginx.
  ssr: true,
  allowedActionOrigins: ["munchkin-picker.localhost"],
} satisfies Config;
