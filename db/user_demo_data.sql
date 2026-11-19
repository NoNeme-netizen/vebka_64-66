-- ============================================================
-- Личные данные пользователей: демо-инициализация.
-- Задача: у каждого зарегистрированного аккаунта есть свой набор
-- друзей (friendships) и коллекции (collection_items); у гостя их нет.
--
-- Скрипт делает две вещи:
-- 1) создаёт функцию и триггер: при каждой новой регистрации в
--    таблицу users данные добавляются автоматически (для будущих
--    пользователей это происходит без участия приложения);
-- 2) разово заполняет данные для УЖЕ зарегистрированных пользователей,
--    у которых ещё нет ни друзей, ни коллекции (запускать один раз).
--
-- Выполняется целиком в Supabase → SQL Editor → Run.
-- Повторный запуск безопасен (ON CONFLICT DO NOTHING).
-- ============================================================

-- ---------- 1. триггер для новых пользователей ----------
create or replace function init_user_demo_data()
returns trigger
language plpgsql
as $$
begin
  -- стартовые друзья: первые шесть игроков из каталога аккаунтов
  insert into friendships (user_id, friend_id, status)
  select new.id, v.fid, 'принята'
  from (values (2), (3), (4), (5), (6), (7)) as v(fid)
  where v.fid <> new.id
  on conflict do nothing;

  -- стартовая коллекция: две позиции (есть дома / хочу купить)
  insert into collection_items (user_id, version_id, status, note)
  values
      (new.id, 1, 'есть дома',   'коробка только куплена'),
      (new.id, 3, 'хочу купить', 'планирую на следующий месяц')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_init_user_demo_data on users;
create trigger trg_init_user_demo_data
after insert on users
for each row
execute function init_user_demo_data();

-- ---------- 2. разовое заполнение для существующих пользователей ----------
-- друзья: только тем, у кого ещё нет ни одной связи
insert into friendships (user_id, friend_id, status)
select u.id, v.fid, 'принята'
from users u
cross join (values (2), (3), (4), (5), (6), (7)) as v(fid)
where v.fid <> u.id
  and not exists (select 1 from friendships f where f.user_id = u.id)
on conflict do nothing;

-- коллекция: только тем, у кого ещё нет ни одной позиции
insert into collection_items (user_id, version_id, status, note)
select u.id, v.vid, v.st, v.note
from users u
cross join (values
    (1, 'есть дома',   'коробка только куплена'),
    (3, 'хочу купить', 'планирую на следующий месяц')
) as v(vid, st, note)
where not exists (select 1 from collection_items c where c.user_id = u.id)
on conflict do nothing;

-- ---------- проверка: сколько личных данных у каждого пользователя ----------
select u.id,
       u.nickname,
       (select count(*) from friendships f      where f.user_id = u.id) as friends,
       (select count(*) from collection_items c where c.user_id = u.id) as collection
from users u
order by u.id;
