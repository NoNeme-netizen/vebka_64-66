// Типы данных приложения «Манчкин-пикер».
// Описывают сущности, с которыми работает интерфейс
// (впоследствии эти же структуры придут из базы данных).

// Версия игры «Манчкин»
export interface GameVersion {
  id: number; // идентификатор (в БД — PRIMARY KEY)
  slug: string; // латинский адрес для страницы (/catalog/pirate)
  name: string; // название версии
  theme: string; // тематика
  tags: string[]; // оценочные теги («Кровавый», «Новичкам»…)
  players: string; // количество игроков
  time: string; // время партии
  difficulty: "низкая" | "средняя" | "высокая"; // уровень сложности
  age: number; // возрастное ограничение
  rating: string; // средняя оценка (по отзывам из БД)
  ratingsCount: number; // количество оценок
  description: string; // краткое описание
  box: string[]; // содержимое коробки
  photo: string; // путь к фото коробки
}

// Отзыв игрока о версии
export interface Review {
  id: number;
  author: string;
  score: string; // оценка 1–5
  text: string;
}

// Запись в коллекции пользователя
export interface CollectionItem {
  slug: string;
  status: string; // «есть дома», «у друга», «хочу купить»
  ok: boolean; //_TRUE если версия есть в наличии
  note: string; // заметка о состоянии коробки
  rating: string; // личная оценка 1–5
}

// Друг (для страницы «Друзья»)
export interface Friend {
  id: number;
  initials: string; // буквы для аватарки
  color: string; // цвет аватарки
  name: string;
  status: string; // текст статуса («онлайн», «играет в …»)
  canInvite: boolean; // можно ли позвать играть прямо сейчас
}

// Игрок, которого можно добавить в друзья (страница «Друзья»)
export interface FriendCandidate {
  id: number;
  initials: string;
  color: string;
  name: string;
  status: string;
}
