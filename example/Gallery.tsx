import * as React from 'react'
import { VirtuosoGrid, type VirtuosoGridProps } from 'react-virtuoso'

import { ICON_STYLES } from './styles'
import { useReveal } from './useReveal'
import type { Asset, Props, Setter } from './types'

function Tile({ title, src, cry }: Props) {
  return (
    <button
      className="tile"
      type="button"
      onClick={() => {
        const audio = new Audio(cry)
        audio.play().catch(() => undefined)
      }}
    >
      <img className="image" src={src} alt={title} loading="lazy" />
      <span className="cap">{title}</span>
    </button>
  )
}

const COMPONENTS: VirtuosoGridProps<Props, unknown>['components'] = {
  List: React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} {...props} className={`${className ?? ''} tile-list`} />
  )),
  Item: ({ className, ...props }) => (
    <div {...props} className={`${className ?? ''} tile-cell`} />
  ),
}

interface GalleryProps {
  mons: Props[]
  icon: Asset
  setIcon: Setter
  full: boolean
  setFull: React.Dispatch<React.SetStateAction<boolean>>
}

export function Gallery({ mons, icon, setIcon, full, setFull }: GalleryProps) {
  const head = useReveal<HTMLDivElement>()
  const panel = useReveal<HTMLDivElement>()

  return (
    <section className="wrap" id="gallery">
      <div className="section-head reveal" ref={head}>
        <span className="eyebrow">
          <span className="dot" />
          Live demo
        </span>
        <h2 className="h2">
          Every icon set,
          <br />
          <span className="grad">one API.</span>
        </h2>
        <p>
          Swap between real community icon repositories below. Tap any Pokémon to
          hear its cry — resolved through the same methods, live.
        </p>
      </div>

      <div className="gallery-controls">
        <div className="segment" role="tablist" aria-label="Icon repository">
          {ICON_STYLES.map((style) => (
            <button
              key={style.name}
              role="tab"
              aria-selected={style.name === icon.name}
              className={style.name === icon.name ? 'active' : ''}
              onClick={() => setIcon(style)}
            >
              {style.name}
            </button>
          ))}
        </div>
        <button
          className={`toggle${full ? ' on' : ''}`}
          onClick={() => setFull((f) => !f)}
          aria-pressed={full}
        >
          <span className="track" />
          {full ? 'Full repository' : 'Masterfile only'}
        </button>
      </div>

      <div className="shell reveal" ref={panel}>
        <div className="core gallery-core">
          <VirtuosoGrid
            className="gallery-grid"
            totalCount={mons.length}
            data={mons}
            components={COMPONENTS}
            itemContent={(_, props) => <Tile key={props.title} {...props} />}
            overscan={40}
          />
        </div>
      </div>
    </section>
  )
}
