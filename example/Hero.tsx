import * as React from 'react'
import { ArrowUpRight, Copy, Check } from './icons'
import { useReveal } from './useReveal'

const REPO = 'https://github.com/TurtIeSocks/uicons.js'

function InstallButton() {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard?.writeText('npm i uicons.js').then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      },
      () => undefined
    )
  }
  return (
    <button className="btn btn-primary" onClick={copy}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        npm i uicons.js
      </span>
      <span className="btn-icon">{copied ? <Check /> : <Copy />}</span>
    </button>
  )
}

export function Hero() {
  const ref = useReveal<HTMLDivElement>()
  const code = useReveal<HTMLDivElement>()

  return (
    <header className="hero wrap" id="top">
      <div className="hero-grid">
        <div className="reveal" ref={ref}>
          <span className="eyebrow">
            <span className="dot" />
            Type-safe · Zero dependencies
          </span>
          <h1 className="display">
            Icons that know
            <br />
            their own <span className="grad">URLs</span>.
          </h1>
          <p className="lede">
            A tiny library for Pokémon GO asset URLs. Feed it your{' '}
            <code>index.json</code> and every method returns the{' '}
            <em>exact</em> URL string — resolved, fallbacks and all, at the type
            level.
          </p>
          <div className="hero-cta">
            <InstallButton />
            <a
              className="btn btn-ghost"
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
            >
              Star on GitHub
              <span className="btn-icon">
                <ArrowUpRight />
              </span>
            </a>
          </div>
          <div className="hero-meta">
            <div className="stat">
              <span className="num grad">0</span>
              <span className="lbl">runtime deps</span>
            </div>
            <div className="stat">
              <span className="num">~4kB</span>
              <span className="lbl">gzipped</span>
            </div>
            <div className="stat">
              <span className="num">17</span>
              <span className="lbl">typed resolvers</span>
            </div>
          </div>
        </div>

        <div className="code-card shell reveal" id="types" ref={code}>
          <div className="core">
            <div className="code-top">
              <span className="tl" />
              <span className="tl" />
              <span className="tl" />
              <span className="name">team.ts</span>
            </div>
            <pre className="code">
              <code>
                <span className="k">const</span> uicons ={' '}
                <span className="k">new</span> <span className="t">UICONS</span>({'{'}
                {'\n'}
                {'  '}path: <span className="s">'https://cdn.gg/uicons'</span>,
                {'\n'}
                {'  '}data: {'{'} team: [<span className="s">'0.webp'</span>,{' '}
                <span className="s">'1.webp'</span>] {'}'},{'\n'}
                {'}'}){'\n'}
                {'\n'}
                <span className="c">// exact literal — not just `string`</span>
                {'\n'}
                uicons.<span className="f">team</span>({'{'} teamId:{' '}
                <span className="n">1</span> {'}'}){'\n'}
                <span className="hint">
                  {'//'} ^? "https://cdn.gg/uicons/team/1.webp"
                </span>
                {'\n'}
                {'\n'}
                <span className="c">// 9.webp is absent → type sees the</span>
                {'\n'}
                <span className="c">// fallback the runtime would pick</span>
                {'\n'}
                uicons.<span className="f">team</span>({'{'} teamId:{' '}
                <span className="n">9</span> {'}'}){'\n'}
                <span className="hint">
                  {'//'} ^? "https://cdn.gg/uicons/team/0.webp"
                </span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </header>
  )
}
