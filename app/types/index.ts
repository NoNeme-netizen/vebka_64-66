// Типы данных приложения «Манчкин-пикер»
// Версия игры «Манчкин»
export interface GameVersion {
  id: number; // идентификатор
  slug: string; // адрес для страницы (/catalog/pirate)
  name: string; // название версии
  theme: string; // тематика
  tags: string[]; // оценочные теги
  players: string; // количество игроков
  time: string; // время партии
  difficulty: "низкая" | "средняя" | "высокая";
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
  score: string; 
  text: string;
}

// Запись в коллекции пользователя
export interface CollectionItem {
  slug: string;
  status: string; 
  ok: boolean; 
  note: string; 
  rating: string; 
}
export interface Friend {
  id: number;
  initials: string; // буквы для аватарки
  color: string; // аватарки
  name: string;
  status: string; // статуса 
  canInvite: boolean;
}
