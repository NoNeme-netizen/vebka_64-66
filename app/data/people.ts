// Данные коллекции и друзей (имитация таблиц collection_items,
// friendships из БД). Используются на страницах «Коллекция» и «Друзья».

import type { CollectionItem, Friend, FriendCandidate } from "~/types";

export const collection: CollectionItem[] = [
  {
    slug: "orig",
    status: "Есть дома",
    ok: true,
    note: "коробка новая, ни разу не теряли карты",
    rating: "5",
  },
  {
    slug: "vamp",
    status: "Есть дома",
    ok: true,
    note: "коробка потрёпана, но карты целые",
    rating: "5",
  },
  {
    slug: "zomb",
    status: "Есть дома",
    ok: true,
    note: "не хватает 2 карт из 200",
    rating: "4",
  },
  {
    slug: "rus",
    status: "У друга",
    ok: false,
    note: "лежит у Лёши, заберу на следующий игровой вечер",
    rating: "4",
  },
];

export const friends: Friend[] = [
  { id: 1, initials: "ДК", color: "#4A7E8C", name: "Даня К.", status: "онлайн · играет в «Пиратский Манчкин»", canInvite: false },
  { id: 2, initials: "КМ", color: "#6E8A5A", name: "Кирилл М.", status: "онлайн · готов играть", canInvite: true },
  { id: 3, initials: "НП", color: "#9C4A4A", name: "Настя П.", status: "онлайн", canInvite: true },
  { id: 4, initials: "МВ", color: "#8A7355", name: "Максим В.", status: "был(а) 2 часа назад", canInvite: false },
  { id: 5, initials: "СЛ", color: "#D9A441", name: "Соня Л.", status: "была вчера", canInvite: false },
  { id: 6, initials: "ЛТ", color: "#B85C38", name: "Лёша Т.", status: "онлайн · смотрит каталог", canInvite: true },
];

// Игроки, которых можно добавить в друзья в резервном режиме
// (когда Supabase не подключён). В базе этот список — таблица users.
export const candidates: FriendCandidate[] = [
  { id: 11, initials: "РШ", color: "#8C6A8C", name: "Рома Ш.", status: "онлайн · 3 общих друга" },
  { id: 12, initials: "АГ", color: "#4A7E8C", name: "Алина Г.", status: "была вчера" },
  { id: 13, initials: "ТБ", color: "#6E8A5A", name: "Тимур Б.", status: "онлайн · готов играть" },
  { id: 14, initials: "ЕС", color: "#9C4A4A", name: "Женя С.", status: "был(а) 3 дня назад" },
];
