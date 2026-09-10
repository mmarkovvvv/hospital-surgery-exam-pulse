import Link from 'next/link'

type BrandProps = {
  onClick?: () => void
  compact?: boolean
}

export default function Brand({ onClick, compact = false }: BrandProps) {
  return (
    <Link className={`brand${compact ? ' brand-compact' : ''}`} href="/" onClick={onClick} aria-label="Beep Academy — на главную">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" role="presentation">
          <path d="M5 23h6l3-10 5 18 4-13 3 5h11" />
          <circle cx="5" cy="23" r="2" />
        </svg>
      </span>
      <span>Beep Academy</span>
    </Link>
  )
}

