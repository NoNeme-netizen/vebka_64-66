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
export interface CollectionItem {
  slug: string;
  status: string;
  ok: boolean; 
  note: string; 
  rating: string; 
}

export interface Friend {
  id: number;
  initials: string; 
  color: string; 
  name: string;
  status: string; 
  canInvite: boolean; 
}

export interface FriendCandidate {
  id: number;
  initials: string;
  color: string;
  name: string;
  status: string;
}
