import * as React from 'react'
import { ArrowUpRight } from './icons'

const REPO = 'https://github.com/TurtIeSocks/uicons.js'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#types', label: 'Types' },
  { href: '#gallery', label: 'Gallery' },
]

export function Nav() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav className="nav">
        <div className="nav-pill">
          <a className="brand" href="#top">
            uicons<span className="grad">.js</span>
            <span className="ver">v3.0</span>
          </a>
          <div className="nav-links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <a
            className="nav-cta"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
            <span className="btn-icon">
              <ArrowUpRight />
            </span>
          </a>
          <button
            className={`burger${open ? ' open' : ''}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`overlay${open ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </div>
    </>
  )
}
