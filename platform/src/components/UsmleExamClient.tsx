'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  ccsActions,
  formatExamTime,
  getBlockProgress,
  getUsmleQuestionsForMode,
  isUsmleSelectionCorrect,
  type UsmleExamMode,
  type UsmleQuestion,
} from '@/lib/usmleExam'

type UsmleExamClientProps = { modes: UsmleExamMode[]; questions: UsmleQuestion[] }

const usmleModeGroups = [
  { step: 'step1', title: 'Step 1', description: 'Базовые науки и клинические виньетки: выбери один лучший ответ.' },
  { step: 'step2ck', title: 'Step 2 CK', description: 'Клинические решения, последовательные шаги, данные и мультимедиа.' },
  { step: 'step3', title: 'Step 3', description: 'FIP, ACM и компьютерные симуляции клинических случаев.' },
] as const

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

  const mode = modes.find((item) => item.slug === selectedMode) ?? modes[0]
  const modeQuestions = useMemo(() => getUsmleQuestionsForMode(questions, mode), [mode, questions])
  const currentQuestion = modeQuestions.length > 0 ? modeQuestions[questionIndex % modeQuestions.length] : undefined
  const sequenceQuestion = currentQuestion?.sequence?.[sequenceIndex]
  const sequenceLength = currentQuestion?.sequence?.length ?? 0
  const isLastSequenceStep = Boolean(sequenceQuestion && sequenceIndex >= sequenceLength - 1)
  const isLastQuestion = questionIndex >= modeQuestions.length - 1 && (!sequenceQuestion || isLastSequenceStep)
  const activeOptions = sequenceQuestion?.options ?? currentQuestion?.options ?? []
  const activeCorrect = sequenceQuestion?.correct ?? currentQuestion?.correct ?? []
  const activeExplanation = sequenceQuestion?.explanation ?? currentQuestion?.explanation ?? ''
  const isCcs = mode?.slug === 'ccs'

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

  function chooseMode(slug: UsmleExamMode['slug']) {
    setSelectedMode(slug)
    setStarted(false)
    setFinished(false)
    setQuestionIndex(0)
    setSelected([])
    setSubmitted(false)
    setSequenceIndex(0)
    setCcsLog([])
    setCcsTime(0)
  }

  function nextQuestion() {
    if (currentQuestion?.kind === 'sequential' && sequenceIndex < (currentQuestion.sequence?.length ?? 1) - 1) {
      setSequenceIndex((value) => value + 1)
      setSelected([])
      setSubmitted(false)
      return
    }
    if (questionIndex >= modeQuestions.length - 1) {
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

  if (!mode) return null

  return (
    <div className="usmle-exam">
      <section className="usmle-mode-picker usmle-format-hub" aria-labelledby="usmle-format-title">
        <div>
          <p className="eyebrow">Форматы USMLE</p>
          <h2 id="usmle-format-title">Выбери формат задания</h2>
          <p>Выбирай нужный режим и сразу решай интерактивные задания: ответ, проверка, разбор и следующий вопрос.</p>
        </div>
        <div className="usmle-interaction-steps" aria-label="Как проходит тренировка">
          <div><strong>1 · Решить</strong><span>Выбрать один или несколько вариантов.</span></div>
          <div><strong>2 · Проверить</strong><span>Сразу увидеть правильный ответ.</span></div>
          <div><strong>3 · Разобрать</strong><span>Прочитать объяснение и перейти дальше.</span></div>
        </div>
        <div className="usmle-format-groups">
          {usmleModeGroups.map((group) => {
            const groupModes = modes.filter((item) => item.step === group.step)
            if (groupModes.length === 0) return null
            return <section className="usmle-format-group" key={group.step} aria-labelledby={`usmle-${group.step}-title`}>
              <div className="usmle-format-group-heading"><h3 id={`usmle-${group.step}-title`}>{group.title}</h3><p>{group.description}</p></div>
              <div className="usmle-mode-list">
                {groupModes.map((item) => <button className={`usmle-mode-option ${item.slug === mode.slug ? 'is-selected' : ''}`} key={item.slug} onClick={() => chooseMode(item.slug)} type="button"><strong>{item.title}</strong><span>{item.subtitle}</span><small>{item.blocks} блоков · до {item.maximumItems} заданий · {item.sessionLabel}</small></button>)}
              </div>
            </section>
          })}
        </div>
        {!started && <><button className="button button-aqua usmle-start" disabled={!isCcs && modeQuestions.length === 0} onClick={begin} type="button">Начать режим</button>{!isCcs && modeQuestions.length === 0 && <p className="usmle-empty-state">Для этого режима пока нет демонстрационных вопросов.</p>}</>}
      </section>

      {started && !finished && !isCcs && currentQuestion && <section className="usmle-session">
        <div className="usmle-session-bar"><span>{mode.title}</span><strong>Блок 1 из {mode.blocks}</strong><span className={secondsLeft < 60 ? 'time-warning' : ''}>{formatExamTime(secondsLeft)}</span></div>
        <div className="test-progress"><span style={{ width: `${getBlockProgress(answered, modeQuestions.length)}%` }} /></div>
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
