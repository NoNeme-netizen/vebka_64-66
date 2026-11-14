-- Схема базы данных «Манчкин-пикер» (SQLite)
-- Генерация: python make_db.py / экспорт из db/munchkin_picker.db

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    avatar_color  TEXT    NOT NULL DEFAULT '#4066B0',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE game_versions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,
    theme        TEXT    NOT NULL,
    players_min  INTEGER NOT NULL,
    players_max  INTEGER NOT NULL,
    duration_min INTEGER NOT NULL,
    duration_max INTEGER NOT NULL,
    difficulty   TEXT    NOT NULL CHECK (difficulty IN ('низкая','средняя','высокая')),
    age_limit    INTEGER NOT NULL,
    description  TEXT    NOT NULL,
    photo_path   TEXT    NOT NULL
);

CREATE TABLE tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE version_tags (
    version_id INTEGER NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
    tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (version_id, tag_id)
);

CREATE TABLE reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_id    INTEGER NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
    entertainment INTEGER NOT NULL CHECK (entertainment BETWEEN 1 AND 5),
    rules_ease    INTEGER NOT NULL CHECK (rules_ease BETWEEN 1 AND 5),
    replayability INTEGER NOT NULL CHECK (replayability BETWEEN 1 AND 5),
    theme_match   INTEGER NOT NULL CHECK (theme_match BETWEEN 1 AND 5),
    comment       TEXT,
    status        TEXT    NOT NULL DEFAULT 'на модерации'
                  CHECK (status IN ('на модерации','одобрен','отклонён')),
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE collection_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_id INTEGER NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
    status     TEXT    NOT NULL DEFAULT 'есть дома'
               CHECK (status IN ('есть дома','у друга','хочу купить')),
    note       TEXT,
    rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
    added_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, version_id)
);

CREATE TABLE friendships (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     TEXT    NOT NULL DEFAULT 'заявка'
               CHECK (status IN ('заявка','принята')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, friend_id),
    CHECK (user_id <> friend_id)
);

CREATE TABLE game_invitations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_id  INTEGER REFERENCES game_versions(id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'отправлено'
                CHECK (status IN ('отправлено','принято','отклонено')),
    sent_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

