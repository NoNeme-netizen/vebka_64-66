# Манчкин-пикер

Учебный проект веб-приложения для выбора версии настольной игры «Манчкин»
под состав и настроение компании.

## Возможности

- **Каталог версий** с фильтрами по тематике, сложности и времени партии;
- **Карточка версии** — фото коробки, характеристики, описание, отзывы;
- **Слепой пикер** — случайный выбор версии с анимацией колеса;
- **Коллекция** — учёт своих коробок с заметками и оценками;
- **Вход и регистрация** (интерфейс форм);
- **Друзья** — список друзей, заявки, «Позвать играть», приглашение по ссылке.

## Стек

- React 19 + React Router v7 (framework mode) — интерфейс и маршрутизация;
- TypeScript — статическая типизация;
- Tailwind CSS v4 — стилизация;
- Vite — сборка;
- SQLite — база данных (`db/munchkin_picker.db`, схема в `db/schema.sql`).

## Запуск

```bash
npm install
npm run dev      
npm run build   
npm start        
```

## Запуск через Docker

```bash
docker build -t munchkin-picker .
docker run -p 3000:3000 munchkin-picker
```

Приложение будет доступно на http://localhost:3000.
Docker-образ также публикуется автоматически в GitHub Container Registry
при каждом push в main (см. `.github/workflows/build.yml`):

```bash
docker pull ghcr.io/noneme-netizen/vebka_64-66:latest
```

## Структура

```
app/
  assets/boxes/   фото коробок версий
  components/     переиспользуемые компоненты (Header, Footer, GameCard)
    ui/           простые UI-элементы (Button)
  data/           данные о версиях, коллекции и друзьях (имитация таблиц БД)
  hooks/          кастомные хуки (usePicker — логика колеса Слепого пикера)
  routes/         страницы приложения
  types/          TypeScript-интерфейсы сущностей
db/
  munchkin_picker.db          база данных SQLite
  schema.sql                  DDL-схема SQLite
  munchkin_picker_mssql.sql   T-SQL-скрипт создания БД для SSMS

.github/workflows/build.yml  CI: проверка типов + сборка и публикация
                             Docker-образа в GHCR
```

## База данных

Схема из 8 таблиц: users, game_versions, tags, version_tags,
reviews, collection_items, friendships, game_invitations.
ER-диаграмма и описание — в отчёте по практике 61-63.

Файлы базы данных:

- `db/munchkin_picker.db` — база SQLite (используется проектом);
- `db/schema.sql` — DDL-схема SQLite;
- `db/munchkin_picker_mssql.sql` — T-SQL-скрипт для Microsoft SQL Server
  (SSMS): создаёт базу `munchkin_picker`, все таблицы с ограничениями
  целостности и демонстрационные данные; запускается целиком по F5.
