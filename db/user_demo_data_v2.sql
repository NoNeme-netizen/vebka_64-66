-- ============================================================
-- Личные данные пользователей: разные наборы у разных аккаунтов.
--
-- Зачем: предыдущий скрипт (user_demo_data.sql) выдавал всем новым
-- пользователям один и тот же набор — друзей 2–7 и версии 1 и 3.
-- Из-за этого на страницах «Друзья» и «Моя коллекция» у всех аккаунтов
-- было одинаково. Здесь набор подбирается по id пользователя:
-- количество и состав друзей и версий зависят от аккаунта.
--
-- Выполняется целиком в Supabase → SQL Editor → Run.
-- Повторный запуск безопасен (on conflict do nothing).
-- ============================================================

-- ---------- 1. триггер для новых пользователей ----------
create or replace function init_user_demo_data()
returns trigger
language plpgsql
as $$
begin
  -- друзья: 3–5 игроков, состав зависит от id нового пользователя
  insert into friendships (user_id, friend_id, status)
  select new.id, u.id, 'принята'
  from users u
  where u.id <> new.id
  order by (u.id * 7 + new.id * 13) % 97
  limit 3 + (new.id % 3)
  on conflict do nothing;

  -- коллекция: 2–4 версии со статусом, тоже зависят от id
  insert into collection_items (user_id, version_id, status)
  select new.id,
         g.id,
         case (g.id + new.id) % 3
           when 0 then 'есть дома'
           when 1 then 'у друга'
           else 'хочу купить'
         end
  from game_versions g
  order by (g.id * 11 + new.id * 5) % 101
  limit 2 + (new.id % 3)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_init_user_demo_data on users;
create trigger trg_init_user_demo_data
after insert on users
for each row
execute function init_user_demo_data();

-- ---------- 2. переназначить данные уже существующим пользователям ----------
-- ВНИМАНИЕ: этот блок удаляет текущие строки из friendships и
-- collection_items у ВСЕХ пользователей и создаёт наборы заново.
-- Запускать, только если в базе нет настоящих данных, которые нужно
-- сохранить (учебный проект — обычно так и есть).
-- Если удалять нельзя — пропустите блок целиком, новые аккаунты
-- в любом случае получат разные наборы из триггера выше.

delete from friendships;
delete from collection_items;

-- друзья: у каждого пользователя свой состав, 3–5 человек
insert into friendships (user_id, friend_id, status)
select u.id, f.id, 'принята'
from users u
join lateral (
  select u2.id
  from users u2
  where u2.id <> u.id
  order by (u2.id * 7 + u.id * 13) % 97
  limit 3 + (u.id % 3)
) f on true
on conflict do nothing;

-- коллекция: у каждого пользователя свой набор версий, 2–4 штуки
insert into collection_items (user_id, version_id, status)
select u.id, c.id, c.status
from users u
join lateral (
  select g.id,
         case (g.id + u.id) % 3
           when 0 then 'есть дома'
           when 1 then 'у друга'
           else 'хочу купить'
         end as status
  from game_versions g
  order by (g.id * 11 + u.id * 5) % 101
  limit 2 + (u.id % 3)
) c on true
on conflict do nothing;

-- ---------- 3. проверка результата ----------
-- у каждого пользователя должен быть свой набор
select u.id,
       u.nickname,
       (select count(*) from friendships f where f.user_id = u.id)      as друзей,
       (select count(*) from collection_items c where c.user_id = u.id) as версий
from users u
order by u.id;
