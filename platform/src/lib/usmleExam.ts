export type UsmleStep = 'step1' | 'step2ck' | 'step3'
export type UsmleQuestionKind = 'single-best-answer' | 'sequential' | 'abstract' | 'chart' | 'audio-video'

export type UsmleExamMode = {
  slug: 'step1-block' | 'step2ck-block' | 'step3-fip' | 'step3-acm' | 'ccs'
  step: UsmleStep
  title: string
  subtitle: string
  blocks: number
  itemsPerBlock: number
  blockMinutes: number
  maximumItems: number
  sessionLabel: string
  description: string
}

export type UsmleQuestion = {
  id: string
  step: UsmleStep
  kind: UsmleQuestionKind
  title: string
  stem: string
  options: string[]
  correct: number[]
  explanation: string
  sourceLabel: string
  data?: { label: string; value: string }[]
  sequence?: { stem: string; options: string[]; correct: number[]; explanation: string }[]
}

export type CcsAction = { id: string; label: string; result: string }

export const usmleExamModes: UsmleExamMode[] = [
  {
    slug: 'step1-block',
    step: 'step1',
    title: 'Step 1 · блоки',
    subtitle: 'Базовые науки и применение знаний к пациенту',
    blocks: 14,
    itemsPerBlock: 20,
    blockMinutes: 30,
    maximumItems: 280,
    sessionLabel: '1 день · около 8 часов',
    description: 'Тренировка актуального интерфейса Step 1: отдельный таймер на каждый блок и один лучший ответ.',
  },
  {
    slug: 'step2ck-block',
    step: 'step2ck',
    title: 'Step 2 CK · блоки',
    subtitle: 'Клинические решения и ведение пациента',
    blocks: 16,
    itemsPerBlock: 20,
    blockMinutes: 30,
    maximumItems: 318,
    sessionLabel: '1 день · около 9 часов',
    description: 'Клинические виньетки, таблицы, последовательные вопросы, абстракты и мультимедийные находки.',
  },
  {
    slug: 'step3-fip',
    step: 'step3',
    title: 'Step 3 · FIP',
    subtitle: 'Применение фундаментальных и клинических знаний',
    blocks: 12,
    itemsPerBlock: 20,
    blockMinutes: 30,
    maximumItems: 232,
    sessionLabel: 'День 1 · около 7 часов',
    description: 'Блоки Foundations of Independent Practice: биостатистика, безопасность, этика и клиническое мышление.',
  },
  {
    slug: 'step3-acm',
    step: 'step3',
    title: 'Step 3 · ACM',
    subtitle: 'Advanced Clinical Medicine',
    blocks: 9,
    itemsPerBlock: 20,
    blockMinutes: 30,
    maximumItems: 180,
    sessionLabel: 'День 2 · около 9 часов',
    description: 'Клинические блоки перед компьютерными симуляциями случаев.',
  },
  {
    slug: 'ccs',
    step: 'step3',
    title: 'Step 3 · CCS',
    subtitle: 'Computer-based case simulations',
    blocks: 1,
    itemsPerBlock: 14,
    blockMinutes: 20,
    maximumItems: 14,
    sessionLabel: '13–14 случаев · до 10 или 20 минут каждый',
    description: 'Тренажёр принятия решений: назначай действия, наблюдай изменения состояния и меняй тактику.',
  },
]

export const usmleQuestions: UsmleQuestion[] = [
  {
    id: 'step1-arterial-gas',
    step: 'step1',
    kind: 'single-best-answer',
    title: 'Интерпретация кислотно-основного состояния',
    stem: 'У пациента с тяжёлой диареей pH 7,28, HCO₃⁻ 15 ммоль/л и PaCO₂ 30 мм рт. ст. Какое нарушение наиболее вероятно?',
    options: ['Метаболический ацидоз с дыхательной компенсацией', 'Метаболический алкалоз', 'Респираторный ацидоз', 'Респираторный алкалоз'],
    correct: [0],
    explanation: 'Снижение HCO₃⁻ и pH указывает на метаболический ацидоз; снижение PaCO₂ отражает компенсацию.',
    sourceLabel: 'Авторская демонстрационная задача · не официальный вопрос USMLE',
  },
  {
    id: 'step1-nephron-chart',
    step: 'step1',
    kind: 'chart',
    title: 'Транспорт в нефроне',
    stem: 'На каком участке нефрона происходит основная реабсорбция профильтрованного натрия?',
    options: ['Проксимальный извитой каналец', 'Тонкий нисходящий отдел петли Генле', 'Собирательная трубочка', 'Дистальный извитой каналец'],
    correct: [0],
    explanation: 'Проксимальный каналец реабсорбирует большую часть фильтрата и натрия; таблица помогает сопоставить сегмент и функцию.',
    sourceLabel: 'Авторская демонстрационная задача · не официальный вопрос USMLE',
    data: [
      { label: 'Проксимальный каналец', value: 'Большая часть Na⁺, воды, глюкозы и аминокислот' },
      { label: 'Петля Генле', value: 'Формирование осмотического градиента' },
      { label: 'Собирательная трубочка', value: 'Регуляция воды под действием АДГ' },
    ],
  },
  {
    id: 'step2ck-sequential-sepsis',
    step: 'step2ck',
    kind: 'sequential',
    title: 'Последовательный клинический набор · сепсис',
    stem: '62-летний пациент с лихорадкой, спутанностью сознания и гипотензией поступает в приёмное отделение. Первичный осмотр продолжается.',
    options: [],
    correct: [],
    explanation: 'В последовательном наборе каждое решение принимается на основе информации, доступной на этом шаге; нельзя возвращаться к закрытому вопросу.',
    sourceLabel: 'Авторская демонстрационная задача · не официальный вопрос USMLE',
    sequence: [
      { stem: 'Какое действие приоритетно в первые минуты?', options: ['Оценить дыхательные пути и гемодинамику', 'Назначить плановое УЗИ', 'Отложить осмотр до результатов посева', 'Дать пациенту пищу'], correct: [0], explanation: 'Начинают с ABC, мониторинга и немедленной стабилизации.' },
      { stem: 'Что следует сделать после взятия необходимых посевов, не задерживая лечение?', options: ['Начать эмпирическую антибактериальную терапию', 'Наблюдать без лечения', 'Назначить только витамины', 'Выполнить плановую выписку'], correct: [0], explanation: 'При подозрении на сепсис лечение и контроль источника не откладывают.' },
    ],
  },
  {
    id: 'step2ck-abstract-screening',
    step: 'step2ck',
    kind: 'abstract',
    title: 'Критическая оценка исследования',
    stem: 'Изучите краткий абстракт и выберите характеристику, лучше всего описывающую результат исследования.',
    options: ['Абсолютное снижение риска', 'Отношение правдоподобия', 'Чувствительность теста', 'Коэффициент корреляции'],
    correct: [0],
    explanation: 'Разность рисков в группах — абсолютное снижение риска; относительные показатели требуют другой формулы.',
    sourceLabel: 'Авторская демонстрационная задача · не официальный вопрос USMLE',
    data: [
      { label: 'Дизайн', value: 'Рандомизированное исследование, 1000 участников' },
      { label: 'События', value: '10% в контрольной группе и 6% в группе вмешательства' },
      { label: 'Разность', value: '10% − 6% = 4 процентных пункта' },
    ],
  },
  {
    id: 'step2ck-audio-heart',
    step: 'step2ck',
    kind: 'audio-video',
    title: 'Аускультация сердца',
    stem: 'В учебном мультимедийном фрагменте слышен шум, усиливающийся при пробе Вальсальвы. Какая находка наиболее вероятна?',
    options: ['Гипертрофическая обструктивная кардиомиопатия', 'Митральный стеноз', 'Дефект межжелудочковой перегородки', 'Перикардиальное трение'],
    correct: [0],
    explanation: 'Шум при гипертрофической обструктивной кардиомиопатии усиливается при уменьшении венозного возврата.',
    sourceLabel: 'Авторская демонстрационная задача · аудио не является официальным материалом USMLE',
  },
  {
    id: 'step3-fip-safety',
    step: 'step3',
    kind: 'single-best-answer',
    title: 'Безопасность пациента',
    stem: 'Перед введением препарата медицинский работник обнаружил несоответствие в дозировке. Какой следующий шаг наиболее безопасен?',
    options: ['Остановить введение и сверить назначение с источником', 'Ввести препарат и исправить запись позже', 'Попросить пациента выбрать дозу', 'Удалить назначение из истории'],
    correct: [0],
    explanation: 'При выявлении потенциальной ошибки нужно остановиться, проверить назначение и эскалировать сомнение до введения.',
    sourceLabel: 'Авторская демонстрационная задача · не официальный вопрос USMLE',
  },
]

export const ccsActions: CcsAction[] = [
  { id: 'history', label: 'Собрать анамнез', result: 'Уточнены начало симптомов, лекарства и факторы риска.' },
  { id: 'exam', label: 'Провести осмотр', result: 'Получены жизненные показатели и ключевые физикальные признаки.' },
  { id: 'labs', label: 'Назначить лабораторные тесты', result: 'Результаты доступны после перехода времени.' },
  { id: 'imaging', label: 'Назначить визуализацию', result: 'Исследование назначено; оцени его вместе с клиникой.' },
  { id: 'treatment', label: 'Начать лечение', result: 'Тактика применена; состояние пациента может измениться.' },
]

export function getUsmleMode(slug: string): UsmleExamMode | undefined {
  return usmleExamModes.find((mode) => mode.slug === slug)
}

export function isUsmleSelectionCorrect(selected: number[], correct: number[]): boolean {
  return selected.length === correct.length && selected.every((value) => correct.includes(value))
}

export function getBlockProgress(answered: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((answered / total) * 100)))
}

export function formatExamTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
