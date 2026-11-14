-- ============================================================================
-- Учебный проект «Манчкин-пикер» — скрипт создания базы данных
-- для Microsoft SQL Server (SSMS).
-- Составлено по ER-диаграмме из отчёта 61-63; данные согласованы
-- с макетами интерфейса и демонстрационными данными проекта.
-- Запуск: открыть в SSMS и выполнить целиком (F5).
-- ВЕРСИЯ: v3 — исправлены каскадные пути (friendships, game_invitations)
-- ============================================================================

PRINT N'=== munchkin_picker: скрипт v3 (каскадные пути исправлены) ===';
GO

IF DB_ID(N'munchkin_picker') IS NULL
    CREATE DATABASE munchkin_picker;
GO

USE munchkin_picker;
GO

-- ---------------------------------------------------------------------------
-- Пересоздание таблиц (в порядке зависимости)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.game_invitations', N'U') IS NOT NULL DROP TABLE dbo.game_invitations;
IF OBJECT_ID(N'dbo.friendships',     N'U') IS NOT NULL DROP TABLE dbo.friendships;
IF OBJECT_ID(N'dbo.collection_items',N'U') IS NOT NULL DROP TABLE dbo.collection_items;
IF OBJECT_ID(N'dbo.reviews',         N'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID(N'dbo.version_tags',    N'U') IS NOT NULL DROP TABLE dbo.version_tags;
IF OBJECT_ID(N'dbo.tags',            N'U') IS NOT NULL DROP TABLE dbo.tags;
IF OBJECT_ID(N'dbo.game_versions',   N'U') IS NOT NULL DROP TABLE dbo.game_versions;
IF OBJECT_ID(N'dbo.users',           N'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- ---------------------------------------------------------------------------
-- 1. Пользователи
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.users (
    id            INT           IDENTITY (1, 1) NOT NULL,
    nickname      NVARCHAR(60)  NOT NULL,
    email         NVARCHAR(120) NOT NULL,
    password_hash NVARCHAR(120) NOT NULL,
    avatar_color  NVARCHAR(7)   NOT NULL CONSTRAINT DF_users_avatar DEFAULT (N'#4066B0'),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_users_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_nickname UNIQUE (nickname),
    CONSTRAINT UQ_users_email    UNIQUE (email)
);
GO

-- ---------------------------------------------------------------------------
-- 2. Версии игры «Манчкин»
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.game_versions (
    id           INT           IDENTITY (1, 1) NOT NULL,
    name         NVARCHAR(100) NOT NULL,
    theme        NVARCHAR(40)  NOT NULL,
    players_min  INT           NOT NULL,
    players_max  INT           NOT NULL,
    duration_min INT           NOT NULL,
    duration_max INT           NOT NULL,
    difficulty   NVARCHAR(10)  NOT NULL,
    age_limit    INT           NOT NULL,
    description  NVARCHAR(500) NOT NULL,
    photo_path   NVARCHAR(200) NOT NULL,
    CONSTRAINT PK_game_versions PRIMARY KEY (id),
    CONSTRAINT UQ_game_versions_name UNIQUE (name),
    CONSTRAINT CK_game_versions_players  CHECK (players_min BETWEEN 2 AND 10 AND players_max BETWEEN players_min AND 10),
    CONSTRAINT CK_game_versions_duration CHECK (duration_min > 0 AND duration_max >= duration_min),
    CONSTRAINT CK_game_versions_diff     CHECK (difficulty IN (N'низкая', N'средняя', N'высокая')),
    CONSTRAINT CK_game_versions_age      CHECK (age_limit BETWEEN 6 AND 21)
);
GO

-- ---------------------------------------------------------------------------
-- 3. Теги версий и связь «многие ко многим»
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.tags (
    id   INT          IDENTITY (1, 1) NOT NULL,
    name NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_tags PRIMARY KEY (id),
    CONSTRAINT UQ_tags_name UNIQUE (name)
);
GO

CREATE TABLE dbo.version_tags (
    version_id INT NOT NULL,
    tag_id     INT NOT NULL,
    CONSTRAINT PK_version_tags PRIMARY KEY (version_id, tag_id),
    CONSTRAINT FK_version_tags_versions FOREIGN KEY (version_id)
        REFERENCES dbo.game_versions (id) ON DELETE CASCADE,
    CONSTRAINT FK_version_tags_tags     FOREIGN KEY (tag_id)
        REFERENCES dbo.tags (id) ON DELETE CASCADE
);
GO

-- ---------------------------------------------------------------------------
-- 4. Отзывы и оценки (шкала 1–5 по четырём критериям)
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.reviews (
    id            INT           IDENTITY (1, 1) NOT NULL,
    user_id       INT           NOT NULL,
    version_id    INT           NOT NULL,
    entertainment INT           NOT NULL,
    rules_ease    INT           NOT NULL,
    replayability INT           NOT NULL,
    theme_match   INT           NOT NULL,
    comment       NVARCHAR(400) NULL,
    status        NVARCHAR(15)  NOT NULL CONSTRAINT DF_reviews_status DEFAULT (N'на модерации'),
    created_at    DATETIME2     NOT NULL CONSTRAINT DF_reviews_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_reviews PRIMARY KEY (id),
    CONSTRAINT FK_reviews_users    FOREIGN KEY (user_id)    REFERENCES dbo.users (id)         ON DELETE CASCADE,
    CONSTRAINT FK_reviews_versions FOREIGN KEY (version_id) REFERENCES dbo.game_versions (id) ON DELETE CASCADE,
    CONSTRAINT CK_reviews_scores CHECK (
        entertainment BETWEEN 1 AND 5 AND rules_ease BETWEEN 1 AND 5
        AND replayability BETWEEN 1 AND 5 AND theme_match BETWEEN 1 AND 5),
    CONSTRAINT CK_reviews_status CHECK (status IN (N'на модерации', N'одобрен', N'отклонён'))
);
GO

-- ---------------------------------------------------------------------------
-- 5. Коллекция пользователя
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.collection_items (
    id         INT           IDENTITY (1, 1) NOT NULL,
    user_id    INT           NOT NULL,
    version_id INT           NOT NULL,
    status     NVARCHAR(15)  NOT NULL CONSTRAINT DF_collection_status DEFAULT (N'есть дома'),
    note       NVARCHAR(200) NULL,
    rating     INT           NULL,
    added_at   DATETIME2     NOT NULL CONSTRAINT DF_collection_added DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_collection_items PRIMARY KEY (id),
    CONSTRAINT FK_collection_users    FOREIGN KEY (user_id)    REFERENCES dbo.users (id)         ON DELETE CASCADE,
    CONSTRAINT FK_collection_versions FOREIGN KEY (version_id) REFERENCES dbo.game_versions (id) ON DELETE CASCADE,
    CONSTRAINT UQ_collection_user_version UNIQUE (user_id, version_id),
    CONSTRAINT CK_collection_status CHECK (status IN (N'есть дома', N'у друга', N'хочу купить')),
    CONSTRAINT CK_collection_rating CHECK (rating BETWEEN 1 AND 5)
);
GO

-- ---------------------------------------------------------------------------
-- 6. Друзья (связь пользователя с пользователем)
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.friendships (
    id         INT       IDENTITY (1, 1) NOT NULL,
    user_id    INT       NOT NULL,
    friend_id  INT       NOT NULL,
    status     NVARCHAR(10) NOT NULL CONSTRAINT DF_friendships_status DEFAULT (N'заявка'),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_friendships_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_friendships PRIMARY KEY (id),
    CONSTRAINT FK_friendships_user   FOREIGN KEY (user_id)   REFERENCES dbo.users (id) ON DELETE CASCADE,
    -- Вторая ссылка на users без каскада: SQL Server запрещает
    -- несколько каскадных путей между двумя таблицами.
    CONSTRAINT FK_friendships_friend FOREIGN KEY (friend_id) REFERENCES dbo.users (id),
    CONSTRAINT UQ_friendships_pair UNIQUE (user_id, friend_id),
    CONSTRAINT CK_friendships_not_self CHECK (user_id <> friend_id),
    CONSTRAINT CK_friendships_status CHECK (status IN (N'заявка', N'принята'))
);
GO

-- ---------------------------------------------------------------------------
-- 7. Приглашения к совместной игре («Позвать играть»)
-- ---------------------------------------------------------------------------
CREATE TABLE dbo.game_invitations (
    id           INT       IDENTITY (1, 1) NOT NULL,
    from_user_id INT       NOT NULL,
    to_user_id   INT       NOT NULL,
    version_id   INT       NULL,               -- NULL: версия ещё не выбрана
    status       NVARCHAR(12) NOT NULL CONSTRAINT DF_invitations_status DEFAULT (N'отправлено'),
    sent_at      DATETIME2 NOT NULL CONSTRAINT DF_invitations_sent DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_game_invitations PRIMARY KEY (id),
    CONSTRAINT FK_invitations_from    FOREIGN KEY (from_user_id) REFERENCES dbo.users (id)         ON DELETE CASCADE,
    CONSTRAINT FK_invitations_to      FOREIGN KEY (to_user_id)   REFERENCES dbo.users (id),
    CONSTRAINT FK_invitations_version FOREIGN KEY (version_id)   REFERENCES dbo.game_versions (id),
    CONSTRAINT CK_invitations_not_self CHECK (from_user_id <> to_user_id),
    CONSTRAINT CK_invitations_status   CHECK (status IN (N'отправлено', N'принято', N'отклонено'))
);
GO

-- ============================================================================
-- Демонстрационные данные
-- ============================================================================

SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users (id, nickname, email, password_hash, avatar_color) VALUES
    (1, N'Гаврилов',  N'gavrilov@mail.ru', N'sha256$demo0', N'#4066B0'),
    (2, N'Даня К.',   N'danya@mail.ru',    N'sha256$demo1', N'#4A7E8C'),
    (3, N'Кирилл М.', N'kirill@mail.ru',   N'sha256$demo2', N'#6E8A5A'),
    (4, N'Настя П.',  N'nastya@mail.ru',   N'sha256$demo3', N'#9C4A4A'),
    (5, N'Максим В.', N'maksim@mail.ru',   N'sha256$demo4', N'#8A7355'),
    (6, N'Соня Л.',   N'sonya@mail.ru',    N'sha256$demo5', N'#D9A441'),
    (7, N'Лёша Т.',   N'lesha@mail.ru',    N'sha256$demo6', N'#B85C38'),
    (8, N'Рома Ш.',   N'roma@mail.ru',     N'sha256$demo7', N'#8C6A8C');
SET IDENTITY_INSERT dbo.users OFF;
GO

SET IDENTITY_INSERT dbo.game_versions ON;
INSERT INTO dbo.game_versions
    (id, name, theme, players_min, players_max, duration_min, duration_max,
     difficulty, age_limit, description, photo_path)
VALUES
    (1, N'Манчкин Оригинальный', N'фэнтези',          3, 6, 60,  90,  N'низкая',  10,
        N'Та самая классика, с которой все начинают. Правила осваиваются за одну партию.',
        N'boxes/orig.png'),
    (2, N'Манчкин Вампирский',   N'вампиры',          3, 6, 60,  90,  N'средняя', 12,
        N'Готическая версия про вампиров: укусы, проклятия и новые расы.',
        N'boxes/vamp.png'),
    (3, N'Русский Манчкин',      N'народный юмор',    3, 6, 60,  90,  N'низкая',  12,
        N'Издание с нашим юмором: шутки и реалии, которые не надо объяснять.',
        N'boxes/rus.png'),
    (4, N'Манчкин Зомби',        N'зомби',            3, 6, 60,  60,  N'средняя', 12,
        N'Мир пал, но уровни качать всё равно надо. Чёрный юмор и напряжение.',
        N'boxes/zomb.png'),
    (5, N'Пиратский Манчкин',    N'пираты',           3, 6, 60,  90,  N'низкая',  10,
        N'Абордажи, проклятия и сундуки с добычей в пиратском колорите.',
        N'boxes/pirate.png'),
    (6, N'Манчкин Апокалипсис',  N'постапокалипсис',  3, 6, 90,  120, N'высокая', 14,
        N'Самая злая версия серии: бункеры, мутанты и жёсткие торги за консервы.',
        N'boxes/apoc.png'),
    (7, N'Манчкин Боевые кони',  N'боевые кони',      3, 6, 60,  60,  N'низкая',  10,
        N'Безумная версия про подковы, копыта и рыцарские дуэли.',
        N'boxes/horse.png');
SET IDENTITY_INSERT dbo.game_versions OFF;
GO

SET IDENTITY_INSERT dbo.tags ON;
INSERT INTO dbo.tags (id, name) VALUES
    (1, N'Классика'), (2, N'Новичкам'),  (3, N'Кровавый'),   (4, N'Страшный'),
    (5, N'Народный'), (6, N'Весёлый'),   (7, N'Чёрный юмор'),(8, N'Пираты'),
    (9, N'Авантюрный'),(10, N'Хардкор'), (11, N'Безумный'),  (12, N'Смешной');
SET IDENTITY_INSERT dbo.tags OFF;
GO

INSERT INTO dbo.version_tags (version_id, tag_id) VALUES
    (1, 1), (1, 2), (2, 3), (2, 4), (3, 5), (3, 6),
    (4, 4), (4, 7), (5, 8), (5, 9), (6, 10), (7, 11), (7, 12);
GO

INSERT INTO dbo.reviews (user_id, version_id, entertainment, rules_ease,
                         replayability, theme_match, comment, status) VALUES
    (2, 1, 5, 5, 5, 4, N'Первая партия затянулась на четыре часа — спорили до ночи, но все в восторге.', N'одобрен'),
    (3, 2, 5, 4, 4, 5, N'Атмосфера — топ. Механика укусов освежает знакомый ритм.',                       N'одобрен'),
    (6, 3, 5, 5, 4, 4, N'Шутки понятны без пояснений — компания влетела на ура.',                        N'одобрен'),
    (3, 4, 5, 4, 5, 5, N'Постоянно чувствуешь, что выживаешь. Напряжение держит всю партию.',            N'одобрен'),
    (5, 5, 4, 5, 4, 5, N'Отыгрывать пиратов весело, особенно проклятия с подвохом.',                     N'одобрен'),
    (7, 6, 4, 3, 5, 4, N'Жёстко и весело, но новичков жалко.',                                           N'одобрен'),
    (4, 1, 5, 4, 4, 4, N'Хорошая точка входа в серию.',                                                  N'на модерации');
GO

INSERT INTO dbo.collection_items (user_id, version_id, status, note, rating) VALUES
    (1, 1, N'есть дома', N'коробка новая, ни разу не теряли карты',          5),
    (1, 2, N'есть дома', N'коробка потрёпана, но карты целые',               5),
    (1, 4, N'есть дома', N'не хватает 2 карт из 200',                        4),
    (1, 3, N'у друга',   N'лежит у Лёши, заберу на следующий игровой вечер', 4);
GO

INSERT INTO dbo.friendships (user_id, friend_id, status) VALUES
    (1, 2, N'принята'), (1, 3, N'принята'), (1, 4, N'принята'),
    (1, 5, N'принята'), (1, 6, N'принята'), (1, 7, N'принята'),
    (8, 1, N'заявка');
GO

INSERT INTO dbo.game_invitations (from_user_id, to_user_id, version_id, status) VALUES
    (1, 2, 5,    N'принято'),
    (1, 3, 4,    N'отправлено'),
    (1, 7, NULL, N'отправлено');
GO

-- ============================================================================
-- Проверочные запросы
-- ============================================================================

-- перечень таблиц базы данных
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = N'BASE TABLE' AND TABLE_SCHEMA = N'dbo'
ORDER BY TABLE_NAME;
GO

-- версии игр с характеристиками
SELECT id, name, theme, difficulty, age_limit,
       CONCAT(players_min, N'–', players_max)  AS players,
       CONCAT(duration_min, N'–', duration_max) AS minutes
FROM dbo.game_versions;
GO

-- средние оценки версий по одобренным отзывам
SELECT g.name, COUNT(r.id) AS reviews,
       CAST(AVG(CAST((r.entertainment + r.rules_ease + r.replayability + r.theme_match) / 4.0
                AS DECIMAL(4,2))) AS DECIMAL(4,2)) AS avg_score
FROM dbo.game_versions g
JOIN dbo.reviews r ON r.version_id = g.id
WHERE r.status = N'одобрен'
GROUP BY g.id, g.name
ORDER BY avg_score DESC;
GO

-- коллекция пользователя
SELECT u.nickname, g.name, c.status, c.rating
FROM dbo.collection_items c
JOIN dbo.users u ON u.id = c.user_id
JOIN dbo.game_versions g ON g.id = c.version_id;
GO
