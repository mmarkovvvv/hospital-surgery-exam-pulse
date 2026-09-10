'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  diagnosisOf,
  expectedOptionIds,
  explanationOf,
  imageOf,
  optionsOf,
  promptOf,
  stepsOf,
  topicsOf,
  type LearningOption,
} from '@/lib/interactive'
import type { LearningItem } from '@/lib/learning'

type InteractiveFormatProps = {
  subjectSlug: string
  format: LearningItem['format']
  items: LearningItem[]
}

type StoredProgress = {
  known: string[]
  skipped: string[]
  answered: Record<string, boolean>
  scores: Record<string, number>
}

const emptyProgress: StoredProgress = { known: [], skipped: [], answered: {}, scores: {} }

function sortIds(ids: string[]) {
  return [...new Set(ids)]
}

function ticketAnswer(item: LearningItem) {
  const topics = topicsOf(item)
  const answer = explanationOf(item)
  const sections = [
    ['Предмет ответа', topics[0] || item.title],
    ['Клиника и опасность', topics[1] || item.summary || 'Назови ведущие симптомы, осложнения и признаки неотложности.'],
    ['Обследование', topics[2] || 'Опиши лабораторную и инструментальную диагностику и ожидаемые результаты.'],
    ['Тактика', topics[3] || 'Заверши ответ стабилизацией, лечением причины и показаниями к вмешательству.'],
  ]
  return { answer, sections }
}

function ProgressBadge({ progress, total }: { progress: StoredProgress; total: number }) {
  const completed = progress.known.length
  return <span className="progress-badge">Освоено {completed} / {total}</span>
}

function ConfidenceActions({ onRate }: { onRate: (score: number) => void }) {
  return (
    <div className="confidence-actions">
      <span>Насколько уверенно?</span>
      {[1, 2, 3].map((score) => <button className="button button-outline" key={score} onClick={() => onRate(score)} type="button">{score}</button>)}
    </div>
  )
}

function NavigationActions({ onNext, onKnow, isLast }: { onNext: () => void; onKnow: () => void; isLast: boolean }) {
  return (
    <div className="interactive-actions">
      <button className="button button-outline" onClick={onNext} type="button">{isLast ? 'Завершить' : 'Дальше'}</button>
      <button className="button button-aqua" onClick={onKnow} type="button">Знаю</button>
    </div>
  )
}

function CardMode({ item, isLast, onNext, onKnow }: { item: LearningItem; isLast: boolean; onNext: () => void; onKnow: () => void }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <article className="interactive-card">
      <div className="interactive-card-meta"><span>Карточка</span><span>{item.title}</span></div>
      <p className="interactive-kicker">Сначала ответь сам</p>
      <h2>{promptOf(item)}</h2>
      {!revealed ? <button className="button button-dark interactive-primary" onClick={() => setRevealed(true)} type="button">Показать ответ</button> : <div className="interactive-answer"><span className="answer-label">Эталон</span><p>{explanationOf(item)}</p></div>}
      {revealed && <NavigationActions isLast={isLast} onKnow={onKnow} onNext={onNext} />}
    </article>
  )
}

function TicketMode({ item, isLast, onNext, onKnow }: { item: LearningItem; isLast: boolean; onNext: () => void; onKnow: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const ticket = useMemo(() => ticketAnswer(item), [item])

  return (
    <article className="interactive-card ticket-interactive-card">
      <div className="interactive-card-meta"><span>Экзаменационный билет</span><span>{item.title}</span></div>
      <h2>{item.title}</h2>
      <p className="interactive-summary">{item.summary}</p>
      <p className="interactive-kicker">Сформулируй полный устный ответ, затем проверь себя.</p>
      {!revealed ? <button className="button button-dark interactive-primary" onClick={() => setRevealed(true)} type="button">Показать эталон</button> : <div className="ticket-answer"><h3>Что ответить</h3><div className="ticket-answer-grid">{ticket.sections.map(([title, text]) => <div key={title}><span className="answer-label">{title}</span><p>{text}</p></div>)}</div><div className="interactive-answer"><span className="answer-label">Дополнительная формулировка</span><p>{ticket.answer}</p></div></div>}
      {revealed && <NavigationActions isLast={isLast} onKnow={onKnow} onNext={onNext} />}
    </article>
  )
}

function CaseMode({ item, isLast, onNext, onKnow }: { item: LearningItem; isLast: boolean; onNext: () => void; onKnow: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const steps = stepsOf(item)

  return (
    <article className="interactive-card case-interactive-card">
      <div className="interactive-card-meta"><span>Клиническая задача</span><span>{item.title}</span></div>
      <h2>{item.title}</h2>
      <p className="case-scenario">{promptOf(item)}</p>
      <p className="interactive-kicker">Ответь по схеме: диагноз → опасность → обследование → тактика.</p>
      {!revealed ? <button className="button button-dark interactive-primary" onClick={() => setRevealed(true)} type="button">Показать разбор</button> : <div className="case-answer"><h3>Эталон разбора</h3><p className="answer-highlight">{diagnosisOf(item)}</p>{steps.length > 0 && <ol className="interactive-step-list">{steps.map((step, index) => <li key={`${item.id}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol>}</div>}
      {revealed && <><ConfidenceActions onRate={onKnow} /><NavigationActions isLast={isLast} onKnow={onKnow} onNext={onNext} /></>}
    </article>
  )
}

function ImageCaseMode({ item, isLast, onNext, onKnow }: { item: LearningItem; isLast: boolean; onNext: () => void; onKnow: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const image = imageOf(item)
  const steps = stepsOf(item)

  return (
    <article className="interactive-card image-interactive-card">
      <div className="interactive-card-meta"><span>Задача с изображением</span><span>{item.title}</span></div>
      {image && <figure className="interactive-image"><img alt={image.alt} src={image.src} /><figcaption>{image.sourceTitle || 'Изображение из учебного банка'}{image.license ? ` · ${image.license}` : ''}</figcaption></figure>}
      <h2>{item.title}</h2>
      <p className="case-scenario">{promptOf(item)}</p>
      <p className="interactive-kicker">Опиши находку на изображении и свяжи её с клинической тактикой.</p>
      {!revealed ? <button className="button button-dark interactive-primary" onClick={() => setRevealed(true)} type="button">Показать разбор</button> : <div className="case-answer"><h3>Эталон разбора</h3><p className="answer-highlight">{diagnosisOf(item)}</p>{steps.length > 0 && <ol className="interactive-step-list">{steps.map((step, index) => <li key={`${item.id}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol>}{image?.sourceUrl && <a className="content-source" href={image.sourceUrl} rel="noreferrer" target="_blank">Открыть источник изображения →</a>}</div>}
      {revealed && <><ConfidenceActions onRate={onKnow} /><NavigationActions isLast={isLast} onKnow={onKnow} onNext={onNext} /></>}
    </article>
  )
}

function TestMode({ item, index, total, progress, onResult, onNext }: { item: LearningItem; index: number; total: number; progress: StoredProgress; onResult: (correct: boolean) => void; onNext: () => void }) {
  const options = optionsOf(item)
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(() => typeof progress.answered[item.id] === 'boolean')

  const toggleOption = (option: LearningOption) => {
    if (submitted) return
    setSelected((current) => item.sourceData && Boolean((item.sourceData as Record<string, unknown>).multiple)
      ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]
      : [option.id])
  }
  const selectionIsCorrect = sortIds(selected).join('|') === expectedOptionIds(item).join('|')
  const isCorrect = submitted && selectionIsCorrect
  const correctText = options.filter((option) => option.correct).map((option) => option.text).join('; ')

  return (
    <article className="interactive-card test-interactive-card">
      <div className="test-toolbar"><span>Вопрос {index + 1} / {total}</span><ProgressBadge progress={progress} total={total} /></div>
      <div className="test-progress"><span style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      <p className="interactive-kicker">{item.sourceData && Boolean((item.sourceData as Record<string, unknown>).multiple) ? 'Можно выбрать несколько вариантов' : 'Выбери один вариант'}</p>
      <h2>{promptOf(item)}</h2>
      {options.length === 0 ? <div className="interactive-answer"><span className="answer-label">Ответ</span><p>{explanationOf(item)}</p></div> : <div className="interactive-options">{options.map((option) => { const selectedOption = selected.includes(option.id); const stateClass = submitted ? option.correct ? 'is-correct' : selectedOption ? 'is-wrong' : '' : selectedOption ? 'is-selected' : ''; return <button className={`interactive-option ${stateClass}`} disabled={submitted} key={option.id} onClick={() => toggleOption(option)} type="button"><span className="option-marker">{option.id.toUpperCase()}</span><span>{option.text}</span></button> })}</div>}
      {submitted && <div className={`test-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}><strong>{isCorrect ? 'Правильно' : 'Неправильно'}</strong><p>{item.summary || explanationOf(item)}</p>{!isCorrect && correctText && <p><strong>Правильный ответ:</strong> {correctText}</p>}</div>}
      <div className="interactive-actions">{!submitted ? <button className="button button-aqua" disabled={!selected.length || options.length === 0} onClick={() => { setSubmitted(true); onResult(selectionIsCorrect) }} type="button">Проверить ответ</button> : <button className="button button-aqua" onClick={onNext} type="button">{index === total - 1 ? 'Показать итог' : 'Следующий вопрос →'}</button>}</div>
    </article>
  )
}

export default function InteractiveFormat({ subjectSlug, format, items }: InteractiveFormatProps) {
  const storageKey = `beep-academy:${subjectSlug}:${format}`
  const [progress, setProgress] = useState<StoredProgress>(() => {
    if (typeof window === 'undefined') return emptyProgress
    try {
      const stored = window.localStorage.getItem(storageKey)
      return stored ? { ...emptyProgress, ...JSON.parse(stored) } : emptyProgress
    } catch {
      return emptyProgress
    }
  })
  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [progress, storageKey])

  if (items.length === 0) return <div className="empty-state"><h2>Материалов пока нет</h2><p>Для этого формата ещё не добавлены записи.</p></div>

  const currentItem = items[Math.min(index, items.length - 1)]
  const isLast = index === items.length - 1
  const advance = () => {
    if (isLast) setFinished(true)
    else setIndex((current) => current + 1)
  }
  const markKnown = () => {
    setProgress((current) => ({ ...current, known: sortIds([...current.known, currentItem.id]) }))
    advance()
  }
  const registerTestResult = (correct: boolean) => setProgress((current) => ({ ...current, answered: { ...current.answered, [currentItem.id]: correct } }))
  const restart = () => { setIndex(0); setFinished(false); setProgress(emptyProgress) }

  if (finished && format === 'test') {
    const answered = Object.keys(progress.answered).length
    const correct = Object.values(progress.answered).filter(Boolean).length
    return <section className="test-result"><span className="eyebrow">Тест завершён</span><strong>{correct} / {items.length}</strong><h2>{answered ? Math.round((correct / items.length) * 100) : 0}% правильных ответов</h2><p>Ошибки и вопросы для повторения сохраняются в этом браузере.</p><button className="button button-aqua" onClick={restart} type="button">Пройти заново</button></section>
  }

  return <>
    <div className="interactive-toolbar"><span>Материал {index + 1} / {items.length}</span><ProgressBadge progress={progress} total={items.length} /></div>
    {format === 'card' && <CardMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'ticket' && <TicketMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'case' && <CaseMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'image-case' && <ImageCaseMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'test' && <TestMode index={index} item={currentItem} key={`${currentItem.id}-${progress.answered[currentItem.id] ?? 'pending'}`} onNext={advance} onResult={registerTestResult} progress={progress} total={items.length} />}
    {lightbox && <button aria-label="Закрыть изображение" className="interactive-lightbox" onClick={() => setLightbox(null)} type="button"><img alt="Увеличенное изображение" src={lightbox} /></button>}
  </>
}
