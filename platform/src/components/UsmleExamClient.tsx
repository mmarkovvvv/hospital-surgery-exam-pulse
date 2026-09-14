'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import {
  ccsActions,
  formatExamTime,
  getBlockProgress,
  getUsmleStudyProgress,
  isUsmleSelectionCorrect,
  type UsmleExamMode,
  type UsmleQuestion,
  usmleStep1StudyPhases,
  usmleStep1Systems,
} from '@/lib/usmleExam'

type UsmleExamClientProps = { modes: UsmleExamMode[]; questions: UsmleQuestion[] }
const USMLE_PLAN_STORAGE_KEY = 'beep-academy-usmle-step1-plan-v1'
const EMPTY_STUDY_TASKS: string[] = []
let cachedStudyTasksRaw: string | null | undefined
let cachedStudyTasks = EMPTY_STUDY_TASKS

function readStudyTasks(): string[] {
  if (typeof window === 'undefined') return EMPTY_STUDY_TASKS

  const raw = window.localStorage.getItem(USMLE_PLAN_STORAGE_KEY)
  if (raw === cachedStudyTasksRaw) return cachedStudyTasks

  cachedStudyTasksRaw = raw
  if (!raw) {
    cachedStudyTasks = EMPTY_STUDY_TASKS
    return cachedStudyTasks
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    cachedStudyTasks = Array.isArray(parsed) && parsed.every((taskId): taskId is string => typeof taskId === 'string') ? parsed : EMPTY_STUDY_TASKS
  } catch {
    window.localStorage.removeItem(USMLE_PLAN_STORAGE_KEY)
    cachedStudyTasksRaw = null
    cachedStudyTasks = EMPTY_STUDY_TASKS
  }

  return cachedStudyTasks
}

function subscribeToStudyTasks(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getServerStudyTasks() {
  return EMPTY_STUDY_TASKS
}

function writeStudyTasks(taskIds: string[]) {
  const raw = JSON.stringify(taskIds)
  window.localStorage.setItem(USMLE_PLAN_STORAGE_KEY, raw)
  cachedStudyTasksRaw = raw
  cachedStudyTasks = taskIds
  window.dispatchEvent(new Event('storage'))
}

export default function UsmleExamClient({ modes, questions }: UsmleExamClientProps) {
  const [selectedMode, setSelectedMode] = useState(modes[0]?.slug ?? 'step1-block')
  const [started, setStarted] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState((modes[0]?.blockMinutes ?? 30) * 60)
  const [flagged, setFlagged] = useState<string[]>([])
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [ccsLog, setCcsLog] = useState<string[]>([])
  const [ccsTime, setCcsTime] = useState(0)
  const [selectedSystemId, setSelectedSystemId] = useState(usmleStep1Systems[0]?.id ?? '')
  const completedStudyTasks = useSyncExternalStore(subscribeToStudyTasks, readStudyTasks, getServerStudyTasks)

  const mode = modes.find((item) => item.slug === selectedMode) ?? modes[0]
  const currentQuestion = questions.length > 0 ? questions[questionIndex % questions.length] : undefined
  const sequenceQuestion = currentQuestion?.sequence?.[sequenceIndex]
  const sequenceLength = currentQuestion?.sequence?.length ?? 0
  const isLastSequenceStep = Boolean(sequenceQuestion && sequenceIndex >= sequenceLength - 1)
  const isLastQuestion = questionIndex >= questions.length - 1 && (!sequenceQuestion || isLastSequenceStep)
  const activeOptions = sequenceQuestion?.options ?? currentQuestion?.options ?? []
  const activeCorrect = sequenceQuestion?.correct ?? currentQuestion?.correct ?? []
  const activeExplanation = sequenceQuestion?.explanation ?? currentQuestion?.explanation ?? ''
  const isCcs = mode?.slug === 'ccs'
  const selectedSystem = usmleStep1Systems.find((system) => system.id === selectedSystemId) ?? usmleStep1Systems[0]
  const studyProgress = useMemo(() => getUsmleStudyProgress(completedStudyTasks), [completedStudyTasks])

  useEffect(() => {
    if (!started || submitted || finished || isCcs) return
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [finished, isCcs, started, submitted])

  useEffect(() => {
    if (!started || finished || !isCcs) return
    const timer = window.setInterval(() => setCcsTime((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [finished, isCcs, started])

  const answered = useMemo(() => questionIndex + (submitted ? 1 : 0), [questionIndex, submitted])

  function begin() {
    setStarted(true)
    setFinished(false)
    setQuestionIndex(0)
    setSelected([])
    setSubmitted(false)
    setSequenceIndex(0)
    setCcsLog([])
    setCcsTime(0)
    setSecondsLeft((mode?.blockMinutes ?? 30) * 60)
  }

  function nextQuestion() {
    if (currentQuestion?.kind === 'sequential' && sequenceIndex < (currentQuestion.sequence?.length ?? 1) - 1) {
      setSequenceIndex((value) => value + 1)
      setSelected([])
      setSubmitted(false)
      return
    }
    if (questionIndex >= questions.length - 1) {
      setFinished(true)
      return
    }
    setQuestionIndex((value) => value + 1)
    setSequenceIndex(0)
    setSelected([])
    setSubmitted(false)
  }

  function toggleOption(index: number) {
    if (submitted) return
    setSelected((values) => values.includes(index) ? values.filter((value) => value !== index) : [...values, index])
  }

  function addCcsAction(label: string, result: string) {
    setCcsLog((values) => [...values, `${label}: ${result}`])
  }

  function toggleStudyTask(taskId: string) {
    const nextTasks = completedStudyTasks.includes(taskId) ? completedStudyTasks.filter((id) => id !== taskId) : [...completedStudyTasks, taskId]
    writeStudyTasks(nextTasks)
  }

  if (!mode) return null

  return (
    <div className="usmle-exam">
      <section className="usmle-roadmap" aria-labelledby="usmle-roadmap-title">
        <div className="usmle-roadmap-header">
          <div>
            <p className="eyebrow">Маршрут подготовки</p>
            <h2 id="usmle-roadmap-title">Step 1: одна система за раз</h2>
            <p>Рабочий цикл: пройти материал по одной системе, сразу решить соответствующий UWorld, разобрать ошибки и перейти к смешанным блокам.</p>
          </div>
          <div className="usmle-roadmap-progress" aria-label={`Выполнено ${studyProgress.completed} из ${studyProgress.total} шагов`}>
            <strong>{studyProgress.percent}%</strong>
            <span>{studyProgress.completed} из {studyProgress.total} шагов</span>
            <div className="usmle-roadmap-progress-track"><span style={{ width: `${studyProgress.percent}%` }} /></div>
          </div>
        </div>

        <div className="usmle-system-selector">
          <label htmlFor="usmle-system">Текущая система</label>
          <select id="usmle-system" value={selectedSystem?.id ?? ''} onChange={(event) => setSelectedSystemId(event.target.value)}>
            {usmleStep1Systems.map((system) => <option key={system.id} value={system.id}>{system.title}</option>)}
          </select>
          {selectedSystem && <p><strong>{selectedSystem.officialWeight}</strong> · {selectedSystem.focus}</p>}
        </div>

        <div className="usmle-roadmap-cycle" aria-label="Основной цикл подготовки">
          {['BnB + First Aid', 'UWorld по той же главе', 'Ошибки и карточки', 'CBSSA / NBME'].map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong></div>)}
        </div>

        <div className="usmle-roadmap-phases">
          {usmleStep1StudyPhases.map((phase, phaseIndex) => <section className="usmle-roadmap-phase" key={phase.id}>
            <div className="usmle-roadmap-phase-heading"><span>{String(phaseIndex + 1).padStart(2, '0')}</span><div><h3>{phase.title}</h3><p>{phase.detail}</p></div></div>
            <div className="usmle-roadmap-tasks">
              {phase.tasks.map((task) => <label className={`usmle-roadmap-task ${completedStudyTasks.includes(task.id) ? 'is-complete' : ''}`} key={task.id}>
                <input checked={completedStudyTasks.includes(task.id)} onChange={() => toggleStudyTask(task.id)} type="checkbox" />
                <span><strong>{task.title}</strong><small>{task.detail}</small></span>
              </label>)}
            </div>
          </section>)}
        </div>
        <p className="usmle-roadmap-note">Маршрут собран по опыту сообщества и официальным материалам, но не является официальным календарём подготовки. BnB, First Aid и UWorld — внешние ресурсы; их защищённые материалы не копируются в приложение.</p>
      </section>

      <section className="usmle-mode-picker" aria-label="Режим экзамена USMLE">
        <div>
          <p className="eyebrow">Формат экзамена</p>
          <h2>Выбери режим</h2>
          <p>Это учебная симуляция интерфейса и логики USMLE, а не официальный пробник и не банк вопросов.</p>
        </div>
        <div className="usmle-mode-list">
          {modes.map((item) => <button className={`usmle-mode-option ${item.slug === mode.slug ? 'is-selected' : ''}`} key={item.slug} onClick={() => { setSelectedMode(item.slug); setStarted(false) }} type="button"><strong>{item.title}</strong><span>{item.subtitle}</span><small>{item.blocks} блоков · {item.maximumItems} максимум · {item.sessionLabel}</small></button>)}
        </div>
        {!started && <button className="button button-aqua usmle-start" onClick={begin} type="button">Начать режим</button>}
      </section>

      {started && !finished && !isCcs && currentQuestion && <section className="usmle-session">
        <div className="usmle-session-bar"><span>{mode.title}</span><strong>Блок 1 из {mode.blocks}</strong><span className={secondsLeft < 60 ? 'time-warning' : ''}>{formatExamTime(secondsLeft)}</span></div>
        <div className="test-progress"><span style={{ width: `${getBlockProgress(answered, questions.length)}%` }} /></div>
        <article className="usmle-question-card">
          <div className="interactive-card-meta"><span>Вопрос {questionIndex + 1} · {currentQuestion.kind}</span><span>{currentQuestion.sourceLabel}</span></div>
          <h2>{currentQuestion.title}</h2>
          {currentQuestion.data && <div className="usmle-data-panel">{currentQuestion.data.map((row) => <div key={row.label}><strong>{row.label}</strong><span>{row.value}</span></div>)}</div>}
          <p className="interactive-summary">{sequenceQuestion ? currentQuestion.stem : currentQuestion.stem}</p>
          {sequenceQuestion && <p className="usmle-sequence-label">Шаг {sequenceIndex + 1} из {currentQuestion.sequence?.length}</p>}
          {currentQuestion.kind === 'audio-video' && <div className="usmle-media-placeholder"><span aria-hidden="true">◉</span><strong>Мультимедийная находка</strong><small>В официальных материалах часть заданий использует аудио или видео. Здесь — безопасная текстовая демонстрация формата.</small></div>}
          <div className="usmle-options" role="group" aria-label="Варианты ответа">{activeOptions.map((option, index) => <button className={`usmle-option ${selected.includes(index) ? 'is-selected' : ''} ${submitted && activeCorrect.includes(index) ? 'is-correct' : ''} ${submitted && selected.includes(index) && !activeCorrect.includes(index) ? 'is-wrong' : ''}`} disabled={submitted} key={option} onClick={() => toggleOption(index)} type="button"><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
          {submitted && <div className={`usmle-feedback ${isUsmleSelectionCorrect(selected, activeCorrect) ? 'is-correct' : 'is-wrong'}`}><strong>{isUsmleSelectionCorrect(selected, activeCorrect) ? 'Правильно' : 'Неправильно'}</strong><p>{activeExplanation}</p></div>}
          <div className="interactive-actions"><button className="button button-outline" onClick={() => setFlagged((values) => values.includes(currentQuestion.id) ? values.filter((value) => value !== currentQuestion.id) : [...values, currentQuestion.id])} type="button">{flagged.includes(currentQuestion.id) ? 'Помечено' : 'Пометить'}</button>{!submitted ? <button className="button button-dark" disabled={!selected.length} onClick={() => setSubmitted(true)} type="button">Проверить ответ</button> : <button className="button button-aqua" onClick={nextQuestion} type="button">{isLastQuestion ? 'Завершить блок' : 'Следующий вопрос →'}</button>}</div>
        </article>
      </section>}

      {started && !finished && isCcs && <section className="usmle-session usmle-ccs-session"><div className="usmle-session-bar"><span>{mode.title}</span><strong>Симуляция случая</strong><span>{formatExamTime(ccsTime)}</span></div><article className="usmle-question-card"><p className="eyebrow">Динамический случай</p><h2>Пациент с острой болью и нестабильными показателями</h2><p className="interactive-summary">Собирай данные, назначай обследования и начинай лечение. Время симуляции меняется после действий.</p><div className="ccs-actions">{ccsActions.map((action) => <button className="button button-outline" key={action.id} onClick={() => addCcsAction(action.label, action.result)} type="button">{action.label}</button>)}</div><div className="ccs-log" aria-live="polite"><strong>Журнал действий</strong>{ccsLog.length === 0 ? <p>Действия появятся здесь.</p> : ccsLog.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}</div><button className="button button-aqua" onClick={() => setFinished(true)} type="button">Завершить случай</button></article></section>}

      {finished && <section className="usmle-finished"><p className="eyebrow">Сессия завершена</p><h2>Разбор готов</h2><p>Ты прошёл учебную сессию в формате {mode.title}. В реальном экзамене блок закрывается после завершения, поэтому здесь тоже нельзя вернуться к закрытому вопросу.</p><button className="button button-dark" onClick={() => setStarted(false)} type="button">Выбрать другой режим</button></section>}
    </div>
  )
}
