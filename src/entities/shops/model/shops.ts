import { Id } from "../../../../convex/_generated/dataModel";
import { Item } from "../../items/model/items";

// Типы торговцев
export type ShopkeeperType = 
  | 'arms_dealer'     // Торговец оружием
  | 'armorer'         // Бронник/торговец броней
  | 'tech_vendor'     // Продавец техно-снаряжения
  | 'magic_merchant'  // Торговец магическими товарами
  | 'ritual_dealer'   // Торговец ритуальными принадлежностями
  | 'bio_specialist'  // Специалист по био-товарам
  | 'medic'           // Медик (аптекарь)
  | 'smuggler'        // Контрабандист
  | 'craftsman'       // Ремесленник/крафтер
  | 'general_goods';  // Торговец общими товарами

// Интерфейс для товара в магазине
export interface ShopItem {
  itemId: string;            // ID предмета
  quantity: number;          // Доступное количество
  basePrice: number;         // Базовая цена
  currentPrice: number;      // Текущая цена (с учетом скидок/наценок)
  discount?: number;         // Скидка в процентах (0-100)
  requiredReputation?: number; // Требуемый уровень репутации для покупки
  isSpecialOffer?: boolean;  // Специальное предложение (временное)
  unlockRequirement?: string; // Требование для разблокировки (квест, событие и т.д.)
  restockTime?: number;      // Время до пополнения (в миллисекундах)
  item?: Item;               // Ссылка на сам предмет (может подгружаться отдельно)
}

// Интерфейс для магазина
export interface Shop {
  _id: Id<"shops">;           // ID магазина в базе данных
  shopId: string;             // Уникальный идентификатор магазина
  name: string;               // Название магазина
  description?: string;       // Описание магазина
  shopkeeperType: ShopkeeperType; // Тип торговца
  ownerId?: Id<"npcs">;       // ID NPC-владельца магазина
  ownerName?: string;         // Имя владельца (для отображения)
  location: string;           // Локация магазина
  items: ShopItem[];          // Товары в продаже
  buyMultiplier: number;      // Множитель цены при продаже игроком (0.0-1.0)
  restockInterval: number;    // Интервал пополнения товаров (в миллисекундах)
  lastRestock: number;        // Время последнего пополнения товаров
  specialization?: string[];   // Специализация (типы предметов, на которых специализируется)
  factionAlignment?: string;  // Принадлежность к фракции
  reputation?: Record<string, number>; // Репутация с различными фракциями
  services?: ShopService[];    // Дополнительные услуги (ремонт, улучшения и т.д.)
  dialogue?: ShopDialogue;     // Диалоги с торговцем
}

// Интерфейс для дополнительных услуг магазина
export interface ShopService {
  id: string;                // ID услуги
  name: string;              // Название услуги
  description: string;       // Описание услуги
  price: number;             // Базовая цена услуги
  type: 'repair' | 'upgrade' | 'identify' | 'crafting' | 'enchant' | 'other'; // Тип услуги
  requiredReputation?: number; // Требуемый уровень репутации
  parameters?: Record<string, any>; // Дополнительные параметры услуги
}

// Интерфейс для диалогов с торговцем
export interface ShopDialogue {
  greeting: string[];        // Приветствия (случайный выбор)
  farewell: string[];        // Прощания (случайный выбор)
  haggling: string[];        // Фразы при торге
  specialOffer: string[];    // Фразы о специальных предложениях
  noMoney: string[];         // Фразы, когда у игрока не хватает денег
  highReputation: string[];  // Фразы для игроков с высокой репутацией
  lowReputation: string[];   // Фразы для игроков с низкой репутацией
}

// Интерфейс для транзакции покупки/продажи
export interface TradeTransaction {
  _id?: Id<"transaction_history">; // ID транзакции в базе данных
  transactionId: string;        // Уникальный идентификатор транзакции
  playerId: Id<"players">;      // ID игрока
  shopId?: string;              // ID магазина (если применимо)
  type: 'buy' | 'sell';         // Тип транзакции
  itemId: string;               // ID предмета
  itemName?: string;            // Название предмета (для удобства)
  quantity: number;             // Количество
  pricePerUnit: number;         // Цена за единицу
  totalPrice: number;           // Общая сумма
  timestamp: number;            // Время транзакции
  location: string;             // Место транзакции
}

// Примеры магазинов
export const EXAMPLE_SHOPS: Partial<Shop>[] = [
  // Оружейная лавка
  {
    shopId: "frontier_arms",
    name: "Оружейная 'Фронтир'",
    description: "Надежное оружие для выживания в опасных районах. Специализация на огнестрельном оружии и боеприпасах.",
    shopkeeperType: "arms_dealer",
    ownerName: "Дмитрий Ковач",
    location: "market_district",
    buyMultiplier: 0.4, // Выкупает у игрока за 40% от базовой цены
    restockInterval: 86400000, // 24 часа
    lastRestock: Date.now(),
    specialization: ["weapon", "physical", "techno"],
    factionAlignment: "neutrals",
    dialogue: {
      greeting: [
        "Добро пожаловать в 'Фронтир'. Ищете что-нибудь, что стреляет?",
        "Здорово! Новое лицо или снова нужны патроны?",
        "У меня лучшие стволы в городе. Что интересует?"
      ],
      farewell: [
        "Берегите себя там. И помните: стреляйте первым.",
        "Возвращайтесь, когда закончатся патроны!",
        "Хорошей охоты. Не забудь почистить оружие после использования."
      ],
      haggling: [
        "Это уже минимальная цена, поверь.",
        "Даже не пытайся. Я не торгуюсь... ну, может совсем чуть-чуть.",
        "Я не могу снизить цену, у меня тоже есть счета для оплаты."
      ],
      specialOffer: [
        "Только сегодня! Специальное предложение на тактические винтовки.",
        "Новая партия импульсных пистолетов. Прямо с завода, еще горячие!"
      ],
      noMoney: [
        "Без кредитов не будет и оружия. Возвращайся с деньгами.",
        "Извини, но я не раздаю оружие в кредит. Слишком рискованно."
      ],
      highReputation: [
        "Для моего лучшего клиента могу сделать скидку.",
        "Рад тебя видеть! У меня есть кое-что особенное на складе."
      ],
      lowReputation: [
        "Я слежу за тобой. Не вздумай что-нибудь украсть.",
        "Платишь вперед. Никаких исключений."
      ]
    }
  },
  
  // Аптека/медицинские товары
  {
    shopId: "vital_meds",
    name: "Жизненно Важные Препараты",
    description: "Медикаменты, стимуляторы и все для вашего здоровья. Лицензированная аптека с опытным персоналом.",
    shopkeeperType: "medic",
    ownerName: "Елена Соколова",
    location: "clinic_district",
    buyMultiplier: 0.3,
    restockInterval: 43200000, // 12 часов
    lastRestock: Date.now(),
    specialization: ["consumable", "healing", "bio"],
    factionAlignment: "scientists",
    services: [
      {
        id: "radiation_treatment",
        name: "Лечение радиации",
        description: "Удаление радиационного заражения и восстановление здоровья",
        price: 500,
        type: "other"
      },
      {
        id: "status_cure",
        name: "Лечение статусных эффектов",
        description: "Снятие отравления, болезней и других негативных эффектов",
        price: 300,
        type: "other"
      }
    ],
    dialogue: {
      greeting: [
        "Добро пожаловать в аптеку. Как я могу вам помочь?",
        "Здравствуйте! Нужны медикаменты или консультация?",
        "Добрый день! Что беспокоит? У нас есть решения для любых проблем."
      ],
      farewell: [
        "Берегите себя и не забывайте о профилактике!",
        "Будьте здоровы! Возвращайтесь, если понадобится еще помощь.",
        "До свидания! Помните, здоровье - это самое ценное."
      ],
      haggling: [
        "Извините, но это медицинские препараты. У нас фиксированные цены.",
        "Мы не можем торговаться на лекарствах. Это вопрос здоровья.",
        "Поверьте, наши цены уже очень конкурентные для такого качества."
      ],
      specialOffer: [
        "У нас новая партия улучшенных стимуляторов. Очень эффективны!",
        "Сегодня скидка на антидоты и универсальные лекарства."
      ],
      noMoney: [
        "К сожалению, без оплаты я не могу выдать препараты.",
        "Может, вам подойдут более доступные аналоги? Давайте посмотрим."
      ],
      highReputation: [
        "Для постоянных клиентов у нас есть программа лояльности и особые предложения.",
        "Рада вас видеть снова! У меня есть кое-что новое, что вас может заинтересовать."
      ],
      lowReputation: [
        "Пожалуйста, соблюдайте правила аптеки. Никаких проблем, хорошо?",
        "Все препараты отпускаются строго по правилам. Никаких исключений."
      ]
    }
  },
  
  // Черный рынок / контрабандист
  {
    shopId: "shadow_market",
    name: "Теневой Рынок",
    description: "Секретный рынок с редкими, экспериментальными и иногда запрещенными товарами. Вход только для проверенных клиентов.",
    shopkeeperType: "smuggler",
    ownerName: "Крыса",
    location: "undercity",
    buyMultiplier: 0.6, // Выкупает дороже, но только определенные товары
    restockInterval: 604800000, // Неделя
    lastRestock: Date.now(),
    specialization: ["weapon", "artifact", "consumable"],
    reputation: {
      "officers": -100, // Негативная репутация с законниками
      "villains": 50,   // Хорошая репутация с преступниками
      "neutrals": 0
    },
    services: [
      {
        id: "fence_items",
        name: "Сбыт краденого",
        description: "Продажа предметов с пометкой 'краденое' без вопросов",
        price: 0, // Процент берется при каждой транзакции
        type: "other"
      },
      {
        id: "identity_change",
        name: "Смена личности",
        description: "Сброс репутации с определенной фракцией",
        price: 2000,
        type: "other",
        requiredReputation: 75 // Требуется высокая репутация с рынком
      }
    ],
    dialogue: {
      greeting: [
        "Тише, тише. Что тебе нужно? Говори быстро.",
        "Кто тебя прислал? Ладно, неважно. Что ищешь?",
        "У меня есть товары, которые ты не найдешь в обычных магазинах. Заинтересован?"
      ],
      farewell: [
        "Исчезни. И не приводи хвост.",
        "Нас не видели вместе, понял? Удачи.",
        "Сделка закрыта. Теперь уходи, пока не пришли нежелательные гости."
      ],
      haggling: [
        "Думаешь, легко достать такой товар? Цена фиксированная.",
        "За эту цену тебя даже не застрелят. Считай это удачей.",
        "Торгуйся, и я решу, что ты коп. Тебе это надо?"
      ],
      specialOffer: [
        "У меня есть кое-что особенное. Только что с секретной базы.",
        "Это редкость. Буквально единственный экземпляр в городе."
      ],
      noMoney: [
        "Без кредитов даже не думай что-то здесь получить.",
        "Сначала деньги, потом товар. Никаких исключений."
      ],
      highReputation: [
        "Для тебя у меня есть особый товар. Настоящая редкость.",
        "Ты проверенный клиент. Могу показать настоящие сокровища."
      ],
      lowReputation: [
        "Почему я должен тебе доверять? Покажи, что не коп.",
        "Один неверный шаг, и наша сделка отменяется. Навсегда."
      ]
    }
  }
];

// Функции для работы с магазинами

// Расчет цены товара с учетом репутации игрока и других факторов
export function calculateItemPrice(
  item: ShopItem, 
  playerReputation: number = 0, 
  haggleSkill: number = 0
): number {
  let price = item.basePrice;
  
  // Применяем скидку, если есть
  if (item.discount && item.discount > 0) {
    price = price * (1 - item.discount / 100);
  }
  
  // Применяем модификатор за репутацию (до 20% скидки при максимальной репутации)
  const reputationDiscount = Math.min(playerReputation, 100) * 0.2;
  price = price * (1 - reputationDiscount / 100);
  
  // Применяем модификатор за навык торговли (до 25% скидки при максимальном навыке)
  const haggleDiscount = Math.min(haggleSkill, 100) * 0.25;
  price = price * (1 - haggleDiscount / 100);
  
  // Округляем до целого числа
  return Math.round(price);
}

// Проверка доступности товара для игрока
export function isItemAvailableForPlayer(
  item: ShopItem, 
  playerReputation: number = 0, 
  completedQuests: string[] = []
): boolean {
  // Проверяем требования к репутации
  if (item.requiredReputation && playerReputation < item.requiredReputation) {
    return false;
  }
  
  // Проверяем требования к разблокировке (например, выполненный квест)
  if (item.unlockRequirement && !completedQuests.includes(item.unlockRequirement)) {
    return false;
  }
  
  // Проверяем наличие товара
  if (item.quantity <= 0) {
    return false;
  }
  
  return true;
}

// Получение случайной фразы диалога
export function getRandomDialogue(
  dialogue: ShopDialogue, 
  type: keyof ShopDialogue, 
  playerReputation: number = 0
): string {
  let phrases: string[] = dialogue[type] || [];
  
  // Если репутация высокая и есть специальные фразы
  if (playerReputation >= 75 && dialogue.highReputation && type === 'greeting') {
    phrases = dialogue.highReputation;
  }
  
  // Если репутация низкая и есть специальные фразы
  if (playerReputation <= 25 && dialogue.lowReputation && type === 'greeting') {
    phrases = dialogue.lowReputation;
  }
  
  // Выбираем случайную фразу
  if (phrases.length === 0) return "...";
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

// Создание транзакции покупки/продажи
export function createTradeTransaction(
  playerId: Id<"players">,
  shopId: string,
  type: 'buy' | 'sell',
  itemId: string,
  itemName: string,
  quantity: number,
  pricePerUnit: number,
  location: string
): TradeTransaction {
  return {
    transactionId: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    playerId,
    shopId,
    type,
    itemId,
    itemName,
    quantity,
    pricePerUnit,
    totalPrice: quantity * pricePerUnit,
    timestamp: Date.now(),
    location
  };
} 