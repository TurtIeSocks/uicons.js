import type * as React from 'react'
import { Bolt, Braces, Feather, Layers, Target, Waves } from './icons'
import { useReveal } from './useReveal'

interface Feature {
  icon: React.ReactNode
  title: string
  body: string
  mono?: React.ReactNode
  span: 'wide' | 'std'
}

const FEATURES: Feature[] = [
  {
    icon: <Target />,
    title: 'Exact return types',
    body: 'The type system simulates the same candidate search the runtime does — suffix fallbacks in order, first match wins — so a call resolves to a single URL literal, not string.',
    mono: (
      <span>
        gym(&#123; teamId: 2, inBattle: true &#125;){' '}
        <span className="grad">→ "…/gym/2_b.webp"</span>
      </span>
    ),
    span: 'wide',
  },
  {
    icon: <Braces />,
    title: 'One object argument',
    body: 'Every resolver takes a single options object. New UICONS spec fields are just new optional keys — never a breaking positional reshuffle.',
    span: 'std',
  },
  {
    icon: <Feather />,
    title: 'Zero runtime deps',
    body: 'Pure string building over a Set. Its one dependency is type-only, so nothing extra ships in your bundle. ESM + CJS with full .d.ts.',
    span: 'std',
  },
  {
    icon: <Layers />,
    title: 'Object-literal inference',
    body: 'Pass your index.json inline and const type parameters capture it — no as const needed for exact URLs.',
    span: 'std',
  },
  {
    icon: <Waves />,
    title: 'Graceful degradation',
    body: 'No static data? Methods return honest candidate unions. Widen an argument and the type widens with it — never a lie.',
    span: 'std',
  },
  {
    icon: <Bolt />,
    title: 'Runtime unchanged',
    body: 'All the typing lives at compile time. The lookup itself is the same battle-tested search, verified against the live repositories.',
    span: 'wide',
  },
]

function Cell({ f, i }: { f: Feature; i: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      className={`cell${f.span === 'wide' ? ' wide' : ''} reveal`}
      ref={ref}
      style={{ ['--reveal-delay' as string]: `${(i % 3) * 90}ms` }}
    >
      <div className="core">
        <span className="ic">{f.icon}</span>
        <h3>{f.title}</h3>
        <p>{f.body}</p>
        {f.mono && <div className="mono">{f.mono}</div>}
      </div>
    </div>
  )
}

export function Features() {
  const head = useReveal<HTMLDivElement>()
  return (
    <section className="wrap" id="features">
      <div className="section-head reveal" ref={head}>
        <span className="eyebrow">
          <span className="dot" />
          Why v3
        </span>
        <h2 className="h2">
          Boring to call.
          <br />
          <span className="grad">Impossible to misuse.</span>
        </h2>
        <p>
          The ergonomics of a one-line helper with the guarantees of a
          hand-written type for every possible URL.
        </p>
      </div>
      <div className="bento">
        {FEATURES.map((f, i) => (
          <Cell key={f.title} f={f} i={i} />
        ))}
      </div>
    </section>
  )
}
