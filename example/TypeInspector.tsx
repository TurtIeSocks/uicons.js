import * as React from 'react'

import { UICONS } from '../src'
import { Check } from './icons'
import { ICON_STYLES } from './styles'
import { useReveal } from './useReveal'

const BASE = ICON_STYLES[0].path.replace(/\/$/, '')
const EXT = 'webp'

/**
 * A deliberately sparse index (all real files in the repo, so the resolved
 * icon still loads) — the gaps are what make the fallback search visible.
 */
const SAMPLE_GYM = [
  '0.webp',
  '1.webp',
  '2.webp',
  '3.webp',
  '1_ex.webp',
  '2_b.webp',
  '2_t3.webp',
  '3_t2.webp',
]

/**
 * Ordered gym filename candidates — a faithful mirror of the cross product in
 * `UICONS#gym` (suffix-first within each dimension, first dimension outermost),
 * so the trace shown here is the exact order the runtime probes.
 */
function gymCandidates(
  teamId: number,
  trainerCount: number,
  inBattle: boolean,
  ex: boolean
): string[] {
  const dims: string[][] = [
    trainerCount ? [`_t${trainerCount}`, ''] : [''],
    inBattle ? ['_b', ''] : [''],
    ex ? ['_ex', ''] : [''],
  ]
  let acc = ['']
  for (const dim of dims) {
    const next: string[] = []
    for (const prefix of acc)
      for (const suffix of dim) next.push(prefix + suffix)
    acc = next
  }
  return acc.map((suffix) => `${teamId}${suffix}`)
}

const TEAMS = [0, 1, 2, 3]

interface Row {
  file: string
  status: 'hit' | 'miss' | 'skip'
}

export function TypeInspector() {
  const head = useReveal<HTMLDivElement>()
  const panel = useReveal<HTMLDivElement>()

  const [teamId, setTeamId] = React.useState(2)
  const [trainerCount, setTrainerCount] = React.useState(3)
  const [inBattle, setInBattle] = React.useState(true)
  const [ex, setEx] = React.useState(true)

  // Dogfood the real class — the URL it returns IS what TypeScript infers for
  // these literal arguments, since the type engine mirrors this exact search.
  const uicons = React.useMemo(
    () => new UICONS({ path: BASE, data: { gym: SAMPLE_GYM } }),
    []
  )

  const { rows, url, winFile, args } = React.useMemo(() => {
    const present = new Set(SAMPLE_GYM)
    const candidates = gymCandidates(teamId, trainerCount, inBattle, ex)
    const winner = candidates.findIndex((c) => present.has(`${c}.${EXT}`))

    const rows: Row[] = candidates.map((name, i) => ({
      file: `${name}.${EXT}`,
      status:
        winner === -1
          ? 'miss'
          : i === winner
            ? 'hit'
            : i < winner
              ? 'miss'
              : 'skip',
    }))
    if (winner === -1) rows.push({ file: `0.${EXT}`, status: 'hit' })

    const resolved = uicons.gym({ teamId, trainerCount, inBattle, ex })

    const parts = [`teamId: ${teamId}`]
    if (trainerCount) parts.push(`trainerCount: ${trainerCount}`)
    if (inBattle) parts.push('inBattle: true')
    if (ex) parts.push('ex: true')

    return {
      rows,
      url: resolved,
      winFile: resolved.split('/').pop() ?? '',
      args: parts.join(', '),
    }
  }, [teamId, trainerCount, inBattle, ex, uicons])

  return (
    <section className="wrap" id="types">
      <div className="section-head reveal" ref={head}>
        <span className="eyebrow">
          <span className="dot" />
          The type engine
        </span>
        <h2 className="h2">
          Watch the types
          <br />
          <span className="grad">resolve themselves.</span>
        </h2>
        <p>
          Change the arguments. The type system walks the same candidate list
          the runtime does — most specific first, first match in your index wins
          — and lands on one URL literal. This is the real class running, so the
          type below is exactly what your editor would infer.
        </p>
      </div>

      <div className="inspector shell reveal" ref={panel}>
        <div className="core">
          <div className="inspector-grid">
            {/* -------- controls -------- */}
            <div className="insp-controls">
              <label className="insp-field">
                <span className="insp-label">teamId</span>
                <div className="segment">
                  {TEAMS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={t === teamId ? 'active' : ''}
                      onClick={() => setTeamId(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </label>

              <label className="insp-field">
                <span className="insp-label">trainerCount</span>
                <div className="segment">
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n === trainerCount ? 'active' : ''}
                      onClick={() => setTrainerCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              <div className="insp-switches">
                <button
                  className={`toggle${inBattle ? ' on' : ''}`}
                  type="button"
                  onClick={() => setInBattle((v) => !v)}
                  aria-pressed={inBattle}
                >
                  <span className="track" />
                  inBattle
                </button>
                <button
                  className={`toggle${ex ? ' on' : ''}`}
                  type="button"
                  onClick={() => setEx((v) => !v)}
                  aria-pressed={ex}
                >
                  <span className="track" />
                  ex
                </button>
              </div>

              <div className="insp-field">
                <span className="insp-label">sample index.json</span>
                <div className="insp-index">
                  {SAMPLE_GYM.map((f) => (
                    <span
                      key={f}
                      className={`idx-chip${f === winFile ? ' win' : ''}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <pre className="code insp-call">
                <code>
                  <span className="k">const</span> url = uicons.
                  <span className="f">gym</span>({'{ '}
                  <span className="insp-args">{args}</span>
                  {' }'})
                </code>
              </pre>
            </div>

            {/* -------- resolution -------- */}
            <div className="insp-out">
              <span className="insp-label">candidate search</span>
              <ul className="trace">
                {rows.map((row, i) => (
                  <li key={row.file + i} className={`trace-row ${row.status}`}>
                    <span className="trace-ic">
                      {row.status === 'hit' ? <Check /> : null}
                    </span>
                    <span className="trace-file">{row.file}</span>
                    <span className="trace-tag">
                      {row.status === 'hit'
                        ? 'match'
                        : row.status === 'miss'
                          ? 'absent'
                          : 'not reached'}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="insp-result">
                <img src={url} alt="resolved gym icon" width={56} height={56} />
                <div className="insp-type">
                  <span className="insp-label">inferred return type</span>
                  <code className="insp-literal">&quot;{url}&quot;</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
