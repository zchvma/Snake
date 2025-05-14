// Размеры видимой сетки
const VISIBLE_GRID = { width: 10, height: 10 }

// Размеры всей сетки
const MAX_GRID = { width: 50, height: 50 }

// Скорость змейки
const INITIAL_SPEED = 200
const MAX_SPEED = 50
const MIN_SPEED = 300

// Количество очков, необходимое для прохода на следующий уровень
const POINTS_PER_LEVEL = 20
const POINTS_PER_REGENERATE = POINTS_PER_LEVEL * 1.5

// Безопасное расстояние для змейки при генерации
const SAFE_DISTANCE = 5

// Расстояние до границы, на котором триггерится сдвиг
const EXPANSION_THRESHOLD = 5

// Максимальное количество порталов
const MAX_PORTAL_PAIRS = 3

// Максимальное количество стен
const MIN_WALLS = 25
const MAX_WALLS = 100

// Константы для таблицы лучших результатов
const MAX_HIGH_SCORES = 10 // Максимальное количество записей в таблице
const HIGH_SCORES_KEY = "snakeHighScores" // Ключ для localStorage

// Длительность бонусов
const SPEED_UP_BONUS_DURATION_TIME = 5000 // 5 секунд
const SPEED_DOWN_BONUS_DURATION_TIME = 5000 // 5 секунд
const BONUS_DURATION = 5000 // 5 секунд

// Коэффициенты
const WALL_GENERATE_GROW_RATE = 1.5

// Темы игры в зависимости от уровня
const THEMES = [
  { name: "game__board--forest", minLevel: 1 },
  { name: "game__board--desert", minLevel: 3 },
  { name: "game__board--ocean", minLevel: 5 },
  { name: "game__board--volcano", minLevel: 7 },
  { name: "game__board--space", minLevel: 9 },
]

// Экспорт всех констант
export {
  VISIBLE_GRID,
  MAX_GRID,
  INITIAL_SPEED,
  MAX_SPEED,
  MIN_SPEED,
  POINTS_PER_LEVEL,
  POINTS_PER_REGENERATE,
  SAFE_DISTANCE,
  EXPANSION_THRESHOLD,
  MAX_PORTAL_PAIRS,
  MAX_HIGH_SCORES,
  HIGH_SCORES_KEY,
  SPEED_UP_BONUS_DURATION_TIME,
  SPEED_DOWN_BONUS_DURATION_TIME,
  BONUS_DURATION,
  THEMES,
  WALL_GENERATE_GROW_RATE,
  MIN_WALLS,
  MAX_WALLS
}
