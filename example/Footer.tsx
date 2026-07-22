import * as React from 'react'

const REPO = 'https://github.com/TurtIeSocks/uicons.js'

export function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <a className="brand" href="#top">
          uicons<span className="grad">.js</span>
        </a>
        <nav className="foot-links">
          <a href={`${REPO}#readme`}>Docs</a>
          <a href={`${REPO}/blob/main/MIGRATION.md`}>Migration</a>
          <a href="https://www.npmjs.com/package/uicons.js">npm</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </nav>
        <p className="fine">
          MIT licensed · Built on the{' '}
          <a
            href="https://github.com/UIcons/UIcons"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            UICONS
          </a>{' '}
          specification. Not affiliated with Niantic or Nintendo.
        </p>
      </div>
    </footer>
  )
}
