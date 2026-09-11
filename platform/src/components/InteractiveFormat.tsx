'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

import {
  diagnosisOf,
  expectedOptionIds,
  explanationOf,
  imageOf,
  optionsOf,
  promptOf,
  sourceOf,
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
  const source = sourceOf(item)
  const answerPlan = Array.isArray(source.answerPlan)
    ? source.answerPlan.flatMap((section): Array<[string, string]> => {
      if (!Array.isArray(section) || section.length < 2) return []
      return [[String(section[0]), String(section[1])]]
    })
    : []

  if (answerPlan.length > 0) {
    return { answer: '', sections: answerPlan }
  }

  const topics = topicsOf(item)
  const answer = explanationOf(item)
  const sections: Array<[string, string]> = [
    ['Предмет ответа', topics[0] || item.title],
    ['Клиника и опасность', topics[1] || item.summary || 'Назови ведущие симптомы, осложнения и признаки неотложности.'],
    ['Обследование', topics[2] || 'Опиши лабораторную и инструментальную диагностику и ожидаемые результаты.'],
    ['Тактика', topics[3] || 'Заверши ответ стабилизацией, лечением причины и показаниями к вмешательству.'],
  ]
  return { answer, sections }
}

function ticketCategory(item: LearningItem) {
  const source = sourceOf(item)
  const category = source.tag || source.category || source.section
  return typeof category === 'string' && category.trim() ? category.trim() : 'Общие вопросы'
}

function ticketNumber(item: LearningItem, fallback: number) {
  const number = sourceOf(item).number
  return typeof number === 'string' || typeof number === 'number' ? String(number).padStart(2, '0') : String(fallback).padStart(2, '0')
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

function ImageCaseQueue({ items, index, onSelect }: { items: LearningItem[]; index: number; onSelect: (nextIndex: number) => void }) {
  return (
    <section aria-label="Все задачи с изображениями" className="image-case-queue">
      <div className="image-case-queue-header">
        <div>
          <span className="answer-label">Очередь задач</span>
          <strong>Выбери любую из {items.length}</strong>
        </div>
        <span className="image-case-queue-hint">Текущая задача отмечена</span>
      </div>
      <div className="image-case-queue-grid">
        {items.map((item, itemIndex) => {
          const image = imageOf(item)
          return (
            <button
              aria-label={`Открыть задачу ${itemIndex + 1}: ${item.title}`}
              className={`image-case-queue-item ${itemIndex === index ? 'is-current' : ''}`}
              key={item.id}
              onClick={() => onSelect(itemIndex)}
              type="button"
            >
              <span className="image-case-queue-number">{String(itemIndex + 1).padStart(2, '0')}</span>
              {image && <span className="image-case-queue-thumb"><Image alt="" fill sizes="96px" src={image.src} /></span>}
              <span className="image-case-queue-title">{item.title}</span>
            </button>
          )
        })}
      </div>
    </section>
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

function TicketCatalogItem({ item, number, isKnown, onKnow }: { item: LearningItem; number: string; isKnown: boolean; onKnow: () => void }) {
  const [revealed, setRevealed] = useState(false)
  const ticket = ticketAnswer(item)

  return (
    <article className={`ticket-list-card ${isKnown ? 'is-known' : ''}`}>
      <div className="ticket-list-card-top">
        <span className="ticket-number">Билет {number}</span>
        {isKnown && <span className="ticket-known">Освоено</span>}
      </div>
      <h3>{item.title}</h3>
      <p className="ticket-list-summary">{item.summary}</p>
      <p className="ticket-list-prompt">Сформулируй полный устный ответ, затем проверь себя.</p>
      <button className="button button-dark ticket-reveal-button" onClick={() => setRevealed((current) => !current)} type="button">
        {revealed ? 'Скрыть эталон' : 'Показать эталон'}
      </button>
      {revealed && <div className="ticket-answer">
        <h4>Что ответить</h4>
        <div className="ticket-answer-grid">
          {ticket.sections.map(([title, text]) => <div key={`${item.id}-${title}`}><span className="answer-label">{title}</span><p>{text}</p></div>)}
        </div>
        {ticket.answer && <div className="interactive-answer"><span className="answer-label">Дополнительная формулировка</span><p>{ticket.answer}</p></div>}
      </div>}
      <div className="ticket-list-actions">
        {isKnown ? <span className="ticket-known-note">Билет отмечен как освоенный</span> : <button className="button button-aqua" onClick={onKnow} type="button">Знаю</button>}
      </div>
    </article>
  )
}

function TicketCatalog({ items, progress, onKnow }: { items: LearningItem[]; progress: StoredProgress; onKnow: (itemId: string) => void }) {
  const groups = items.reduce<Array<{ title: string; items: LearningItem[] }>>((result, item) => {
    const title = ticketCategory(item)
    const group = result.find((candidate) => candidate.title === title)
    if (group) group.items.push(item)
    else result.push({ title, items: [item] })
    return result
  }, [])

  return (
    <div className="ticket-catalog">
      <div className="ticket-catalog-intro">
        <div>
          <span className="answer-label">Каталог билетов</span>
          <h2>Все билеты перед глазами</h2>
          <p>Выбери категорию, открой эталон ответа и отмечай освоенные билеты. Переходить к следующему билету не нужно.</p>
        </div>
        <span className="ticket-catalog-total">{items.length} билетов</span>
      </div>
      <nav aria-label="Категории билетов" className="ticket-category-nav">
        {groups.map((group, index) => <a href={`#ticket-group-${index}`} key={group.title}><span>{group.title}</span><strong>{group.items.length}</strong></a>)}
      </nav>
      {groups.map((group, groupIndex) => <section className="ticket-group" id={`ticket-group-${groupIndex}`} key={group.title}>
        <div className="ticket-group-header"><h2>{group.title}</h2><span>{group.items.length} {group.items.length === 1 ? 'билет' : 'билетов'}</span></div>
        <div className="ticket-list">
          {group.items.map((item, itemIndex) => <TicketCatalogItem isKnown={progress.known.includes(item.id)} item={item} key={item.id} number={ticketNumber(item, itemIndex + 1)} onKnow={() => onKnow(item.id)} />)}
        </div>
      </section>)}
    </div>
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
      {image && <figure className="interactive-image"><div className="interactive-image-frame"><Image alt={image.alt} fill sizes="(max-width: 560px) 100vw, 900px" src={image.src} /></div><figcaption>{image.sourceTitle || 'Изображение из учебного банка'}{image.license ? ` · ${image.license}` : ''}</figcaption></figure>}
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
  const markKnownById = (itemId: string) => setProgress((current) => ({ ...current, known: sortIds([...current.known, itemId]) }))
  const registerTestResult = (correct: boolean) => setProgress((current) => ({ ...current, answered: { ...current.answered, [currentItem.id]: correct } }))
  const restart = () => { setIndex(0); setFinished(false); setProgress(emptyProgress) }

  if (finished && format === 'test') {
    const answered = Object.keys(progress.answered).length
    const correct = Object.values(progress.answered).filter(Boolean).length
    return <section className="test-result"><span className="eyebrow">Тест завершён</span><strong>{correct} / {items.length}</strong><h2>{answered ? Math.round((correct / items.length) * 100) : 0}% правильных ответов</h2><p>Ошибки и вопросы для повторения сохраняются в этом браузере.</p><button className="button button-aqua" onClick={restart} type="button">Пройти заново</button></section>
  }

  return <>
    <div className="interactive-toolbar"><span>{format === 'ticket' ? `Билеты · ${items.length}` : `Материал ${index + 1} / ${items.length}`}</span><ProgressBadge progress={progress} total={items.length} /></div>
    {format === 'image-case' && <ImageCaseQueue index={index} items={items} onSelect={(nextIndex) => { setIndex(nextIndex); setFinished(false) }} />}
    {format === 'card' && <CardMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'ticket' && <TicketCatalog items={items} onKnow={markKnownById} progress={progress} />}
    {format === 'case' && <CaseMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'image-case' && <ImageCaseMode isLast={isLast} item={currentItem} key={currentItem.id} onKnow={markKnown} onNext={advance} />}
    {format === 'test' && <TestMode index={index} item={currentItem} key={`${currentItem.id}-${progress.answered[currentItem.id] ?? 'pending'}`} onNext={advance} onResult={registerTestResult} progress={progress} total={items.length} />}
  </>
}
