-- ============================================================
-- «Манчкин-пикер»: схема и данные для Supabase (PostgreSQL)
-- Запуск: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- Отличия от SQLite-схемы (db/schema.sql), продиктованные
-- потребностями приложения:
--   * game_versions.slug        — понятные адреса страниц (/catalog/pirate);
--   * game_versions.rating и ratings_count — кэш агрегата по отзывам
--     (пересчитывается приложением при добавлении отзыва);
--   * game_versions.box_contents (JSONB) — состав коробки для страницы версии;
--   * users.status_text, users.can_invite — статус присутствия для страницы «Друзья».
-- Доступ из приложения — серверным ключом service_role (RLS обходит),
-- для анонимного чтения включён RLS с политикой SELECT.
-- ============================================================

-- ---------- очистка при повторном запуске ----------
drop table if exists game_invitations cascade;
drop table if exists friendships cascade;
drop table if exists collection_items cascade;
drop table if exists reviews cascade;
drop table if exists version_tags cascade;
drop table if exists tags cascade;
drop table if exists game_versions cascade;
drop table if exists users cascade;

-- ---------- таблицы ----------
create table users (
    id            serial primary key,
    nickname      text    not null unique,
    email         text    not null unique,
    password_hash text    not null,
    avatar_color  text    not null default '#4066B0',
    status_text   text,
    can_invite    boolean not null default false,
    created_at    timestamptz not null default now()
);

create table game_versions (
    id            serial primary key,
    slug          text    not null unique,
    name          text    not null unique,
    theme         text    not null,
    players_min   integer not null check (players_min between 1 and 10),
    players_max   integer not null check (players_max <= 10),
    duration_min  integer not null,
    duration_max  integer not null,
    difficulty    text    not null check (difficulty in ('низкая','средняя','высокая')),
    age_limit     integer not null,
    description   text    not null,
    photo_path    text    not null,
    box_contents  jsonb   not null default '[]',
    rating        numeric(2,1) not null default 0,
    ratings_count integer not null default 0,
    check (players_min <= players_max),
    check (duration_min <= duration_max)
);

create table tags (
    id   serial primary key,
    name text not null unique
);

-- связь «многие ко многим»: версии <-> теги
create table version_tags (
    version_id integer not null references game_versions(id) on delete cascade,
    tag_id     integer not null references tags(id) on delete cascade,
    primary key (version_id, tag_id)
);

-- отзывы: оценка по четырём критериям, среднее — в game_versions.rating
create table reviews (
    id            serial primary key,
    user_id       integer not null references users(id) on delete cascade,
    version_id    integer not null references game_versions(id) on delete cascade,
    entertainment integer not null check (entertainment between 1 and 5),
    rules_ease    integer not null check (rules_ease between 1 and 5),
    replayability integer not null check (replayability between 1 and 5),
    theme_match   integer not null check (theme_match between 1 and 5),
    comment       text,
    status        text    not null default 'на модерации'
                  check (status in ('на модерации','одобрен','отклонён')),
    created_at    timestamptz not null default now()
);

create table collection_items (
    id         serial primary key,
    user_id    integer not null references users(id) on delete cascade,
    version_id integer not null references game_versions(id) on delete cascade,
    status     text    not null default 'есть дома'
               check (status in ('есть дома','у друга','хочу купить')),
    note       text,
    rating     integer check (rating between 1 and 5),
    added_at   timestamptz not null default now(),
    unique (user_id, version_id)
);

create table friendships (
    id         serial primary key,
    user_id    integer not null references users(id) on delete cascade,
    friend_id  integer not null references users(id) on delete cascade,
    status     text    not null default 'заявка'
               check (status in ('заявка','принята')),
    created_at timestamptz not null default now(),
    unique (user_id, friend_id),
    check (user_id <> friend_id)
);

create table game_invitations (
    id           serial primary key,
    from_user_id integer not null references users(id) on delete cascade,
    to_user_id   integer not null references users(id) on delete cascade,
    version_id   integer references game_versions(id) on delete set null,
    status       text not null default 'отправлено'
                 check (status in ('отправлено','принято','отклонено')),
    sent_at      timestamptz not null default now()
);

-- ---------- RLS: анонимам разрешено только читать ----------
alter table users            enable row level security;
alter table game_versions    enable row level security;
alter table tags             enable row level security;
alter table version_tags     enable row level security;
alter table reviews          enable row level security;
alter table collection_items enable row level security;
alter table friendships      enable row level security;
alter table game_invitations enable row level security;

create policy "public read users"            on users            for select using (true);
create policy "public read game_versions"    on game_versions    for select using (true);
create policy "public read tags"             on tags             for select using (true);
create policy "public read version_tags"     on version_tags     for select using (true);
create policy "public read reviews"          on reviews          for select using (true);
create policy "public read collection_items" on collection_items for select using (true);
create policy "public read friendships"      on friendships      for select using (true);
create policy "public read game_invitations" on game_invitations for select using (true);

-- ============================================================
-- ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ
-- ============================================================

-- пользователи (1 — основной; пароль по умолчанию: munchkin123)
insert into users (id, nickname, email, password_hash, avatar_color, status_text, can_invite) values
(1, 'Гаврилов', 'gavrilov@example.com', 'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#4066B0', null, false),
(2, 'Даня К.',   'danya@example.com',   'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#4A7E8C', 'онлайн · играет в «Пиратский Манчкин»', false),
(3, 'Кирилл М.', 'kirill@example.com',  'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#6E8A5A', 'онлайн · готов играть', true),
(4, 'Настя П.',  'nastya@example.com',  'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#9C4A4A', 'онлайн', true),
(5, 'Максим В.', 'maksim@example.com',  'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#8A7355', 'был(а) 2 часа назад', false),
(6, 'Соня Л.',   'sonya@example.com',   'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#D9A441', 'была вчера', false),
(7, 'Лёша Т.',   'lesha@example.com',   'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#B85C38', 'онлайн · смотрит каталог', true),
(8, 'Рома Ш.',   'roma@example.com',    'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#8C6A8C', null, false),
(9, 'Катя',      'katya@example.com',   'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#4066B0', null, false),
(10,'Андрей',    'andrey@example.com',  'aa4e273b7e82b24c1d74cbe865e30eb37846a74800c75acd89c5187f6f03f16a', '#4066B0', null, false);
select setval('users_id_seq', 10, true);

-- версии игры
insert into game_versions (id, slug, name, theme, players_min, players_max,
                           duration_min, duration_max, difficulty, age_limit,
                           description, photo_path, box_contents, rating, ratings_count) values
(1, 'orig', 'Манчкин Оригинальный', 'фэнтези', 3, 6, 60, 90, 'низкая', 10,
 'Та самая классика, с которой все начинают. Качайте уровни, надевайте шмотки и подставляйте друзей — правила осваиваются за одну партию. Идеальный первый «Манчкин».',
 '/assets/boxes/orig.png', '["168 карт","6 карточек персонажей","кубик","правила игры"]', 4.7, 152),
(2, 'vamp', 'Манчкин Вампирский', 'вампиры', 3, 6, 60, 90, 'средняя', 12,
 'Готическая версия про вампиров: качайтесь, пейте «кровь» и договаривайтесь с потомками ночи. Правила почти как в оригинале, но добавлены укусы и новые расы.',
 '/assets/boxes/vamp.png', '["165 карт","жетоны крови","кубик","правила игры"]', 4.6, 128),
(3, 'rus', 'Русский Манчкин', 'народный юмор', 3, 6, 60, 90, 'низкая', 12,
 'Издание с нашим юмором: шутки и реалии, которые не надо объяснять. Механика классического «Манчкина», но монстры и сокровища — родные и понятные.',
 '/assets/boxes/rus.png', '["164 карты","6 карточек персонажей","кубик","правила игры"]', 4.5, 96),
(4, 'zomb', 'Манчкин Зомби', 'зомби', 3, 6, 60, 60, 'средняя', 12,
 'Мир пал, но уровни качать всё равно надо. Выживайте среди ходячих, собирайте шмотье и не доверяйте никому. Чёрный юмор и постоянное напряжение прилагаются.',
 '/assets/boxes/zomb.png', '["168 карт","жетоны выживания","кубик","правила игры"]', 4.3, 104),
(5, 'pirate', 'Пиратский Манчкин', 'пираты', 3, 6, 60, 90, 'низкая', 10,
 'Абордажи, проклятия и сундуки с добычей. База та же, что в оригинале, но пиратский колорит меняет всё: корабли, чудовища из глубины и команды в тельняшках.',
 '/assets/boxes/pirate.png', '["168 карт","жетоны проклятий","кубик","правила игры"]', 4.2, 87),
(6, 'apoc', 'Манчкин Апокалипсис', 'постапокалипсис', 3, 6, 90, 150, 'высокая', 14,
 'Конец света по-манчкински: бункеры, мутанты и жёсткие торги за консервы. Самая злая версия серии — правил больше, а подставить могут так, что мало не покажется.',
 '/assets/boxes/apoc.png', '["168 карт","жетоны ресурсов","кубик","правила игры"]', 4.0, 63);
select setval('game_versions_id_seq', 6, true);

-- теги
insert into tags (id, name) values
(1,'Классика'),(2,'Новичкам'),(3,'10+'),(4,'Кровавый'),(5,'Страшный'),(6,'12+'),
(7,'Народный'),(8,'Весёлый'),(9,'Чёрный юмор'),(10,'Пираты'),(11,'Авантюрный'),
(12,'Хардкор'),(13,'Жёсткий'),(14,'14+');
select setval('tags_id_seq', 14, true);

-- связь версий с тегами
insert into version_tags (version_id, tag_id) values
(1,1),(1,2),(1,3),
(2,4),(2,5),(2,6),
(3,7),(3,8),(3,2),
(4,5),(4,9),(4,6),
(5,10),(5,11),(5,3),
(6,12),(6,13),(6,14);

-- отзывы (одобренные; score = среднее четырёх критериев)
insert into reviews (user_id, version_id, entertainment, rules_ease, replayability, theme_match, comment, status) values
(9,  1, 5,5,4,5, 'Первая партия затянулась на четыре часа — спорили до ночи, но все в восторге.', 'одобрен'),
(10, 1, 4,5,4,4, 'Лучший старт для новичков: правила реально понятны за пять минут.', 'одобрен'),
(4,  2, 5,4,5,5, 'Атмосфера — топ. Механика укусов освежает знакомый ритм.', 'одобрен'),
(2,  2, 4,4,4,4, 'Берите после оригинала — так заметнее и интереснее.', 'одобрен'),
(6,  3, 5,5,4,5, 'Шутки понятны без пояснений — компания влетела на ура.', 'одобрен'),
(7,  3, 4,5,4,4, 'Хорошая версия для первого знакомства с серией.', 'одобрен'),
(3,  4, 5,4,5,5, 'Постоянно чувствуешь, что выживаешь. Напряжение — огонь.', 'одобрен'),
(6,  4, 5,4,5,5, 'Наша любимая версия, играем чаще остальных.', 'одобрен'),
(5,  5, 4,5,4,4, 'Отыгрывать пиратов весело, особенно проклятия с подвохом.', 'одобрен'),
(4,  5, 4,4,4,4, 'Хорошая смена декораций после классики.', 'одобрен'),
(7,  6, 4,3,4,4, 'Жёстко и весело, но новичков жалко.', 'одобрен'),
(2,  6, 4,3,4,4, 'Многовато новых правил, зато втягивает надолго.', 'одобрен'),
-- пара отзывов на модерации (в выдачу не попадают)
(9,  4, 5,5,5,5, 'Забыла отметить: карты плотные, переживут много вечеров.', 'на модерации'),
(10, 5, 3,4,3,4, 'Ждал большего от проклятий.', 'на модерации');

-- коллекция основного пользователя
insert into collection_items (user_id, version_id, status, note, rating) values
(1, 1, 'есть дома', 'коробка новая, ни разу не теряли карты', 5),
(1, 2, 'есть дома', 'коробка потрёпана, но карты целые', 5),
(1, 4, 'есть дома', 'не хватает 2 карт из 200', 4),
(1, 3, 'у друга',   'лежит у Лёши, заберу на следующий игровой вечер', 4);

-- дружеские связи основного пользователя
insert into friendships (user_id, friend_id, status) values
(1,2,'принята'),(1,3,'принята'),(1,4,'принята'),(1,5,'принята'),(1,6,'принята'),(1,7,'принята'),
(8,1,'заявка');

-- приглашения сыграть
insert into game_invitations (from_user_id, to_user_id, version_id, status) values
(3, 1, 2, 'принято'),
(1, 3, 5, 'отправлено'),
(8, 1, null, 'отправлено');

-- ============================================================
-- проверка: количество строк по таблицам
-- ============================================================
select 'users' as t, count(*) from users
union all select 'game_versions', count(*) from game_versions
union all select 'tags', count(*) from tags
union all select 'version_tags', count(*) from version_tags
union all select 'reviews', count(*) from reviews
union all select 'collection_items', count(*) from collection_items
union all select 'friendships', count(*) from friendships
union all select 'game_invitations', count(*) from game_invitations;
