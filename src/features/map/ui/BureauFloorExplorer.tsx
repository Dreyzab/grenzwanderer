import { useMemo, useState, type CSSProperties } from "react";
import {
  Building2,
  DoorOpen,
  FlaskConical,
  Hotel,
  LibraryBig,
  Minus,
  Plus,
  RotateCcw,
  Route,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import "./bureauFloorExplorer.css";

type BureauFloorId = "minus-2" | "minus-1" | "one" | "two" | "three";
type BureauAccess = "public" | "staff" | "guest" | "restricted";
type BureauFloorIcon = "building" | "food" | "hotel" | "archive" | "lab";

interface BureauRoom {
  id: string;
  number: number;
  title: string;
  access: BureauAccess;
  x: number;
  y: number;
  note: string;
  tags: string[];
  links?: string[];
}

interface BureauFloor {
  id: BureauFloorId;
  level: string;
  title: string;
  role: string;
  image: string;
  icon: BureauFloorIcon;
  rooms: BureauRoom[];
}

const BUREAU_FLOORS: BureauFloor[] = [
  {
    id: "three",
    level: "3",
    title: "3 этаж",
    role: "Гостиница персонала и гостей",
    image: "/images/bureau/bureau-floor-3-hotel.png",
    icon: "hotel",
    rooms: [
      {
        id: "f3-stairs",
        number: 1,
        title: "Лестничный холл",
        access: "staff",
        x: 50,
        y: 19,
        note: "Верхняя точка вертикального маршрута. Хорошее место для контроля ночных перемещений.",
        tags: ["лестница", "маршрут"],
        links: ["2 этаж", "служебный коридор"],
      },
      {
        id: "f3-corridor",
        number: 2,
        title: "Коридор",
        access: "guest",
        x: 50,
        y: 47,
        note: "Длинная ось этажа связывает гостевые номера, завтрак и служебные комнаты.",
        tags: ["гостиница", "наблюдение"],
      },
      {
        id: "f3-suite",
        number: 3,
        title: "Номер люкс",
        access: "guest",
        x: 24,
        y: 31,
        note: "Тихий номер для важных гостей, которым лучше не показывать лабораторные уровни.",
        tags: ["VIP", "гость"],
      },
      {
        id: "f3-double-north",
        number: 4,
        title: "Двухместные номера",
        access: "guest",
        x: 60,
        y: 29,
        note: "Основной гостевой блок у лестницы, удобный для быстрого сопровождения вниз.",
        tags: ["номер", "постояльцы"],
      },
      {
        id: "f3-double-east",
        number: 5,
        title: "Двухместный номер",
        access: "guest",
        x: 82,
        y: 28,
        note: "Изолированный номер у внешней стены, подходит для наблюдения за улицей.",
        tags: ["номер", "улица"],
      },
      {
        id: "f3-single-west",
        number: 6,
        title: "Одноместный номер",
        access: "guest",
        x: 24,
        y: 70,
        note: "Малый номер рядом с ванной зоной. Удобен для кратких остановок агентов.",
        tags: ["номер", "дежурство"],
      },
      {
        id: "f3-single-inner",
        number: 7,
        title: "Одноместный номер",
        access: "guest",
        x: 38,
        y: 72,
        note: "Внутренний номер с коротким путем к завтраку и служебной комнате.",
        tags: ["номер", "персонал"],
      },
      {
        id: "f3-maid",
        number: 8,
        title: "Комната горничной",
        access: "staff",
        x: 54,
        y: 68,
        note: "Служебная точка для белья, запасных ключей и тихой логистики гостиницы.",
        tags: ["служебное", "ключи"],
      },
      {
        id: "f3-breakfast",
        number: 9,
        title: "Зона для завтраков",
        access: "guest",
        x: 72,
        y: 68,
        note: "Самое социальное место этажа. Разговоры за завтраком часто ценнее протоколов.",
        tags: ["социальное", "слухи"],
      },
      {
        id: "f3-pantry",
        number: 10,
        title: "Кладовая / буфетная",
        access: "staff",
        x: 83,
        y: 62,
        note: "Хранит посуду, чай, сухие пайки и мелкие предметы для обслуживания гостей.",
        tags: ["запасы", "буфет"],
      },
      {
        id: "f3-service-bath",
        number: 11,
        title: "Служебный санузел",
        access: "staff",
        x: 82,
        y: 78,
        note: "Служебный узел у восточного крыла, полезный для закрытых маршрутов персонала.",
        tags: ["служебное", "санузел"],
      },
    ],
  },
  {
    id: "two",
    level: "2",
    title: "2 этаж",
    role: "Гостиница и прием гостей",
    image: "/images/bureau/bureau-floor-2-hotel.png",
    icon: "hotel",
    rooms: [
      {
        id: "f2-stairs-down",
        number: 1,
        title: "Лестничный холл",
        access: "guest",
        x: 50,
        y: 83,
        note: "Главный вход на гостиничный уровень со стороны ресторана.",
        tags: ["лестница", "прием"],
        links: ["1 этаж", "3 этаж"],
      },
      {
        id: "f2-desk",
        number: 2,
        title: "Стойка администратора",
        access: "staff",
        x: 49,
        y: 66,
        note: "Узел учета гостей, ключей и смен. Лучше всего держать здесь оперативный журнал.",
        tags: ["учет", "ключи"],
      },
      {
        id: "f2-lounge",
        number: 3,
        title: "Общая гостиная",
        access: "guest",
        x: 50,
        y: 52,
        note: "Общий салон для встреч, ожидания и разговоров без формального протокола.",
        tags: ["гости", "беседы"],
      },
      {
        id: "f2-room-west",
        number: 4,
        title: "Номер для постояльцев",
        access: "guest",
        x: 31,
        y: 23,
        note: "Один из стандартных номеров западного крыла.",
        tags: ["номер", "постояльцы"],
      },
      {
        id: "f2-room-north",
        number: 4,
        title: "Номер для постояльцев",
        access: "guest",
        x: 49,
        y: 23,
        note: "Центральный номер ближе всего к лестнице на третий этаж.",
        tags: ["номер", "маршрут"],
      },
      {
        id: "f2-room-east",
        number: 4,
        title: "Номер для постояльцев",
        access: "guest",
        x: 65,
        y: 23,
        note: "Восточный стандартный номер, удобный для размещения сопровождающих.",
        tags: ["номер", "гости"],
      },
      {
        id: "f2-suite",
        number: 5,
        title: "Номер люкс",
        access: "guest",
        x: 78,
        y: 30,
        note: "Представительный номер для особо важных клиентов Бюро.",
        tags: ["VIP", "гость"],
      },
      {
        id: "f2-balcony",
        number: 6,
        title: "Балкон",
        access: "guest",
        x: 85,
        y: 39,
        note: "Выходит на улицу. Точка обзора и неброских разговоров на воздухе.",
        tags: ["улица", "наблюдение"],
      },
      {
        id: "f2-director",
        number: 7,
        title: "Апартаменты директора",
        access: "restricted",
        x: 38,
        y: 40,
        note: "Личные комнаты руководителя с прямым доступом к гостиничному управлению.",
        tags: ["директор", "закрыто"],
      },
      {
        id: "f2-service-corridor",
        number: 8,
        title: "Служебный коридор",
        access: "staff",
        x: 64,
        y: 52,
        note: "Технический путь персонала между номерами, ванной зоной и восточным крылом.",
        tags: ["служебное", "маршрут"],
      },
      {
        id: "f2-stairs-up",
        number: 9,
        title: "Лестница вверх",
        access: "staff",
        x: 50,
        y: 15,
        note: "Переход на третий гостиничный этаж.",
        tags: ["лестница", "3 этаж"],
        links: ["3 этаж"],
      },
    ],
  },
  {
    id: "one",
    level: "1",
    title: "1 этаж",
    role: "Бар, ресторан и фасад",
    image: "/images/bureau/bureau-floor-1-bar.png",
    icon: "food",
    rooms: [
      {
        id: "f1-entry",
        number: 1,
        title: "Вход с вывеской BÜRO",
        access: "public",
        x: 49,
        y: 88,
        note: "Публичная маска Бюро. Через эту дверь входят клиенты, гости ресторана и те, кто еще не знает настоящего назначения здания.",
        tags: ["фасад", "публичное"],
      },
      {
        id: "f1-bar",
        number: 2,
        title: "Барная стойка",
        access: "public",
        x: 32,
        y: 42,
        note: "Рабочая витрина первого этажа. Бармен видит вход, зал и часть приватных кабинок.",
        tags: ["бар", "контакты"],
      },
      {
        id: "f1-restaurant",
        number: 3,
        title: "Зал ресторана",
        access: "public",
        x: 52,
        y: 56,
        note: "Главная социальная зона. Подходит для встреч, наблюдения и мягкого сбора слухов.",
        tags: ["зал", "слухи"],
      },
      {
        id: "f1-private-cabins",
        number: 4,
        title: "Приватные кабинки",
        access: "guest",
        x: 39,
        y: 25,
        note: "Полузакрытые места для клиентов, которым нужен разговор без лишних ушей.",
        tags: ["клиенты", "приватно"],
      },
      {
        id: "f1-kitchen",
        number: 5,
        title: "Кухня",
        access: "staff",
        x: 70,
        y: 42,
        note: "Плотная служебная зона с проходами к запасам и дворовому входу.",
        tags: ["персонал", "логистика"],
      },
      {
        id: "f1-storage",
        number: 6,
        title: "Подсобное помещение",
        access: "staff",
        x: 74,
        y: 19,
        note: "Запасы, инвентарь и короткий путь к служебным перемещениям.",
        tags: ["запасы", "служебное"],
      },
      {
        id: "f1-stairs-down",
        number: 7,
        title: "Лестница вниз",
        access: "staff",
        x: 51,
        y: 20,
        note: "Служебный спуск к архиву и лабораториям.",
        tags: ["лестница", "архив"],
        links: ["-1 этаж", "-2 этаж"],
      },
      {
        id: "f1-yard-entry",
        number: 8,
        title: "Служебный вход со двора",
        access: "staff",
        x: 80,
        y: 78,
        note: "Незаметный вход для персонала, поставок и тех, кого лучше не проводить через зал.",
        tags: ["двор", "маршрут"],
      },
      {
        id: "f1-stairs-up",
        number: 9,
        title: "Лестница вверх",
        access: "guest",
        x: 76,
        y: 70,
        note: "Путь на гостиничные этажи.",
        tags: ["лестница", "гостиница"],
        links: ["2 этаж", "3 этаж"],
      },
    ],
  },
  {
    id: "minus-1",
    level: "-1",
    title: "-1 этаж",
    role: "Архив и лаборатории",
    image: "/images/bureau/bureau-floor-minus-1-archive.png",
    icon: "archive",
    rooms: [
      {
        id: "b1-stairs",
        number: 1,
        title: "Лестничный холл",
        access: "staff",
        x: 50,
        y: 16,
        note: "Первый подземный узел, соединяющий ресторан с архивом и лабораториями.",
        tags: ["лестница", "контроль"],
        links: ["1 этаж", "-2 этаж"],
      },
      {
        id: "b1-archive",
        number: 2,
        title: "Архив",
        access: "restricted",
        x: 29,
        y: 20,
        note: "Основное хранилище дел, картотек и старых свидетельств.",
        tags: ["архив", "дела"],
      },
      {
        id: "b1-reading-room",
        number: 3,
        title: "Читальный зал архива",
        access: "staff",
        x: 30,
        y: 40,
        note: "Место для изучения дел без выноса документов в публичные зоны.",
        tags: ["исследование", "дела"],
      },
      {
        id: "b1-catalog",
        number: 4,
        title: "Каталогизация и учет",
        access: "staff",
        x: 28,
        y: 64,
        note: "Учетная комната для индексов, карточек и движения материалов.",
        tags: ["учет", "каталог"],
      },
      {
        id: "b1-lab-a",
        number: 5,
        title: "Исследовательская лаборатория A",
        access: "restricted",
        x: 69,
        y: 23,
        note: "Лаборатория для первичных опытов и измерений.",
        tags: ["лаборатория", "опыты"],
      },
      {
        id: "b1-lab-b",
        number: 6,
        title: "Исследовательская лаборатория B",
        access: "restricted",
        x: 69,
        y: 42,
        note: "Второй исследовательский блок с отдельной рабочей зоной.",
        tags: ["лаборатория", "изоляция"],
      },
      {
        id: "b1-reagents",
        number: 7,
        title: "Хранение реагентов",
        access: "restricted",
        x: 70,
        y: 62,
        note: "Закрытая комната для опасных и нестабильных веществ.",
        tags: ["реагенты", "опасно"],
      },
      {
        id: "b1-decon",
        number: 8,
        title: "Дезактивация и очистка",
        access: "restricted",
        x: 28,
        y: 79,
        note: "Санитарный шлюз перед работой с загрязненными материалами.",
        tags: ["очистка", "защита"],
      },
      {
        id: "b1-photo",
        number: 9,
        title: "Фотолаборатория",
        access: "staff",
        x: 41,
        y: 80,
        note: "Проявочная для снимков, пластин и визуальных следов.",
        tags: ["фото", "улики"],
      },
      {
        id: "b1-workshop",
        number: 10,
        title: "Мастерская приборов",
        access: "staff",
        x: 58,
        y: 80,
        note: "Ремонт, настройка и хранение полевых приборов.",
        tags: ["приборы", "ремонт"],
      },
      {
        id: "b1-corridor",
        number: 11,
        title: "Коридор и службы",
        access: "staff",
        x: 50,
        y: 52,
        note: "Центральный подземный ход между архивом и исследовательскими комнатами.",
        tags: ["маршрут", "служебное"],
      },
      {
        id: "b1-closet",
        number: 12,
        title: "Служебная кладовая",
        access: "staff",
        x: 82,
        y: 82,
        note: "Резервное хранение расходников и упаковки для образцов.",
        tags: ["кладовая", "запасы"],
      },
    ],
  },
  {
    id: "minus-2",
    level: "-2",
    title: "-2 этаж",
    role: "Лаборатории и камеры",
    image: "/images/bureau/bureau-floor-minus-2-labs.png",
    icon: "lab",
    rooms: [
      {
        id: "b2-stairs",
        number: 1,
        title: "Лестничный холл",
        access: "restricted",
        x: 50,
        y: 15,
        note: "Самый глубокий вход в закрытую часть Бюро.",
        tags: ["лестница", "допуск"],
        links: ["-1 этаж"],
      },
      {
        id: "b2-corridor",
        number: 2,
        title: "Коридор",
        access: "restricted",
        x: 50,
        y: 37,
        note: "Центральный коридор с жестким разделением лабораторных зон.",
        tags: ["маршрут", "контроль"],
      },
      {
        id: "b2-para-lab",
        number: 3,
        title: "Лаборатория парапсихологии",
        access: "restricted",
        x: 31,
        y: 23,
        note: "Зона для опытов с восприятием, медиумами и следами духовного вмешательства.",
        tags: ["парапсихология", "риск"],
      },
      {
        id: "b2-physical-lab",
        number: 4,
        title: "Лаборатория физических исследований",
        access: "restricted",
        x: 65,
        y: 23,
        note: "Измерения, приборы и материальные свойства аномалий.",
        tags: ["физика", "приборы"],
      },
      {
        id: "b2-observation",
        number: 5,
        title: "Камера наблюдения",
        access: "restricted",
        x: 30,
        y: 40,
        note: "Контролируемая комната для наблюдения без прямого контакта.",
        tags: ["наблюдение", "камера"],
      },
      {
        id: "b2-interrogation",
        number: 6,
        title: "Изолированная комната",
        access: "restricted",
        x: 66,
        y: 41,
        note: "Допросная и переговорная для нестабильных свидетелей или объектов.",
        tags: ["изоляция", "допрос"],
      },
      {
        id: "b2-artifacts",
        number: 7,
        title: "Хранилище артефактов",
        access: "restricted",
        x: 31,
        y: 65,
        note: "Закрытое хранение артефактов с отдельными витринами и журналом доступа.",
        tags: ["артефакты", "хранилище"],
      },
      {
        id: "b2-reagent-prep",
        number: 8,
        title: "Подготовка реагентов",
        access: "restricted",
        x: 65,
        y: 65,
        note: "Подготовка смесей, растворов и защитных составов перед опытами.",
        tags: ["реагенты", "подготовка"],
      },
      {
        id: "b2-cold-storage",
        number: 9,
        title: "Холодильная камера",
        access: "restricted",
        x: 31,
        y: 83,
        note: "Хранение образцов, требующих стабильной температуры и отдельного учета.",
        tags: ["образцы", "холод"],
      },
      {
        id: "b2-rest",
        number: 10,
        title: "Комната отдыха персонала",
        access: "staff",
        x: 42,
        y: 83,
        note: "Короткое восстановление между сменами на закрытом уровне.",
        tags: ["персонал", "отдых"],
      },
      {
        id: "b2-technical",
        number: 11,
        title: "Техническое помещение",
        access: "staff",
        x: 60,
        y: 83,
        note: "Шахты, трубы, вентиляция и обслуживание глубокого уровня.",
        tags: ["техника", "вентиляция"],
      },
      {
        id: "b2-service",
        number: 12,
        title: "Служебная кладовая",
        access: "staff",
        x: 79,
        y: 83,
        note: "Ящики, упаковка и расходники для лабораторной смены.",
        tags: ["кладовая", "запасы"],
      },
    ],
  },
];

const ACCESS_LABELS: Record<BureauAccess, string> = {
  public: "Публичная зона",
  staff: "Служебный доступ",
  guest: "Гостевой доступ",
  restricted: "Ограниченный доступ",
};

const FLOOR_ICON: Record<BureauFloorIcon, typeof Building2> = {
  building: Building2,
  food: UtensilsCrossed,
  hotel: Hotel,
  archive: LibraryBig,
  lab: FlaskConical,
};

const clampZoom = (value: number) => Math.min(1.9, Math.max(1, value));

export const BureauFloorExplorer = () => {
  const [activeFloorId, setActiveFloorId] = useState<BureauFloorId>("one");
  const [selectedRoomId, setSelectedRoomId] = useState("f1-entry");
  const [zoom, setZoom] = useState(1);

  const activeFloor = useMemo(
    () =>
      BUREAU_FLOORS.find((floor) => floor.id === activeFloorId) ??
      BUREAU_FLOORS[2],
    [activeFloorId],
  );
  const selectedRoom =
    activeFloor.rooms.find((room) => room.id === selectedRoomId) ??
    activeFloor.rooms[0];
  const accessCounts = useMemo(() => {
    return activeFloor.rooms.reduce<Record<BureauAccess, number>>(
      (counts, room) => {
        counts[room.access] += 1;
        return counts;
      },
      { public: 0, staff: 0, guest: 0, restricted: 0 },
    );
  }, [activeFloor.rooms]);

  const selectFloor = (floor: BureauFloor) => {
    setActiveFloorId(floor.id);
    setSelectedRoomId(floor.rooms[0].id);
  };

  const zoomStyle = {
    "--bureau-zoom": zoom,
    "--bureau-plan-width": `${Math.round(zoom * 100)}%`,
    "--bureau-origin-x": `${selectedRoom.x}%`,
    "--bureau-origin-y": `${selectedRoom.y}%`,
  } as CSSProperties;

  return (
    <section className="bureau-explorer" aria-labelledby="bureau-title">
      <aside className="bureau-rail" aria-label="Этажи Бюро">
        <div className="bureau-brand">
          <span className="bureau-brand__mark">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p>Бар "Бюро"</p>
            <h2 id="bureau-title">Оперативный штаб</h2>
            <span>Баден, Германия · 1900</span>
          </div>
        </div>

        <div className="bureau-floor-list" role="tablist">
          {BUREAU_FLOORS.map((floor) => {
            const Icon = FLOOR_ICON[floor.icon];
            const isActive = floor.id === activeFloor.id;

            return (
              <button
                key={floor.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className="bureau-floor-button"
                data-active={isActive ? "true" : "false"}
                onClick={() => selectFloor(floor)}
              >
                <Icon size={17} />
                <span className="bureau-floor-button__level">
                  {floor.level}
                </span>
                <span className="bureau-floor-button__text">
                  <strong>{floor.title}</strong>
                  <small>{floor.role}</small>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="bureau-stage">
        <header className="bureau-stage__header">
          <div>
            <p>{activeFloor.role}</p>
            <h2>{activeFloor.title}</h2>
          </div>
          <div className="bureau-toolbar" aria-label="Масштаб плана">
            <button
              type="button"
              aria-label="Уменьшить план"
              onClick={() => setZoom((current) => clampZoom(current - 0.18))}
            >
              <Minus size={16} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="Увеличить план"
              onClick={() => setZoom((current) => clampZoom(current + 0.18))}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              aria-label="Сбросить масштаб"
              onClick={() => setZoom(1)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        <div
          className="bureau-plan-scroll"
          data-zoomed={zoom > 1 ? "true" : "false"}
        >
          <div className="bureau-plan-frame" style={zoomStyle}>
            <img src={activeFloor.image} alt={`План: ${activeFloor.title}`} />
            {activeFloor.rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className="bureau-hotspot"
                data-access={room.access}
                data-selected={room.id === selectedRoom.id ? "true" : "false"}
                style={
                  {
                    "--bureau-room-x": `${room.x}%`,
                    "--bureau-room-y": `${room.y}%`,
                  } as CSSProperties
                }
                aria-label={`${room.number}. ${room.title}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                {room.number}
              </button>
            ))}
          </div>
        </div>
      </main>

      <aside className="bureau-room-panel" aria-live="polite">
        <div className="bureau-room-panel__eyebrow">
          <span>{ACCESS_LABELS[selectedRoom.access]}</span>
          <span>#{selectedRoom.number}</span>
        </div>
        <h2>{selectedRoom.title}</h2>
        <p>{selectedRoom.note}</p>

        <div className="bureau-room-tags" aria-label="Метки зоны">
          {selectedRoom.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        {selectedRoom.links?.length ? (
          <div className="bureau-room-links">
            <h3>
              <Route size={15} />
              Связи
            </h3>
            <ul>
              {selectedRoom.links.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="bureau-access-grid" aria-label="Сводка доступа этажа">
          {(Object.keys(accessCounts) as BureauAccess[]).map((access) => (
            <div key={access}>
              <span>{ACCESS_LABELS[access]}</span>
              <strong>{accessCounts[access]}</strong>
            </div>
          ))}
        </div>

        <div className="bureau-room-panel__footer">
          <DoorOpen size={16} />
          <span>{activeFloor.rooms.length} зон на этаже</span>
        </div>
      </aside>
    </section>
  );
};
