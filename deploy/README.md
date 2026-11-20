# Развёртывание «Манчкин-пикера»

В этой папке находятся скриншоты, относящиеся к запуску и проверке деплоя.
Файлы Docker Compose и nginx хранятся в отдельном репозитории деплоя:
[vebka_64-66-deploy](https://github.com/NoNeme-netizen/vebka_64-66-deploy).

Исходный код приложения находится в репозитории
[vebka_64-66](https://github.com/NoNeme-netizen/vebka_64-66).

## Что находится в репозитории деплоя

- `docker-compose.yml` — запускает приложение и nginx;
- `nginx/nginx.conf` — настройки HTTPS и обратного прокси;
- `screenshots/` — скриншоты работы Docker, nginx и CI;
- `.env` и `certs/` — локальные файлы для запуска, не загружаются в GitHub.

CI приложения собирает Docker-образ и публикует его в GitHub Container Registry:
`ghcr.io/noneme-netizen/vebka_64-66:latest`.

## Запуск

1. Установить и запустить Docker Desktop.
2. Скачать репозиторий деплоя и перейти в его папку:

   ```powershell
   git clone https://github.com/NoNeme-netizen/vebka_64-66-deploy.git
   cd vebka_64-66-deploy
   ```

3. При использовании Supabase создать рядом с `docker-compose.yml` локальный файл `.env` и указать в нём `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и `SESSION_SECRET`. Секретные значения не публиковать.
4. Поместить локальные HTTPS-сертификат и ключ в `certs/`. Файлы сертификатов и ключей в GitHub не добавлять.
5. Выполнить команды по очереди:

   ```powershell
   docker compose pull
   docker compose up -d
   ```

6. Проверить состояние контейнеров:

   ```powershell
   docker compose ps
   ```

7. Открыть приложение: <https://munchkin-picker.localhost>.

Для просмотра журнала приложения:

```powershell
docker compose logs app --tail 20
```

В Windows PowerShell 5.1 команды нужно вводить по одной — оператор `&&` там не поддерживается.
