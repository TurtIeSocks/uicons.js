import * as React from 'react'
import { VirtuosoGrid, VirtuosoGridProps } from 'react-virtuoso'

import { AUDIO_STYLES, ICON_STYLES } from './styles'
import type { Asset, Props, Setter } from './types'

function Tile({ title, src, cry }: Props) {
  return (
    <button onClick={() => new Audio(cry).play()} type="button">
      <h4>{title}</h4>
      <img className="image" src={src} alt={title} />
    </button>
  )
}

function Setter({ set, styles }: { set: Setter; styles: Asset[] }) {
  return (
    <select
      onChange={(e) =>
        set(styles.find((style) => style.name === e.target.value) || styles[0])
      }
    >
      {styles.map((style) => (
        <option key={style.name} value={style.name}>
          {style.name}
        </option>
      ))}
    </select>
  )
}

function GitHub() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27" />
    </svg>
  )
}

const COMPONENTS: VirtuosoGridProps<
  Props,
  {
    setIcon: Setter
    setAudio: Setter
    full: boolean
    setFull: React.Dispatch<React.SetStateAction<boolean>>
  }
>['components'] = {
  List: React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} {...props} className={`${className} flex-container`} />
  )),
  Item: ({ className, ...props }) => (
    <div {...props} className={`${className} flex-item`} />
  ),
  Header: React.forwardRef(({ context }, _) => (
    <header>
      <a
        className="item1"
        href="https://github.com/TurtIeSocks/uicons.js"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHub />
      </a>
      <div className="item2">
        <h1>UICONS Example Page</h1>
        <h2>Click Each Mon for Audio</h2>
      </div>
      {context && (
        <div className="item3">
          <span>Icons</span>
          <Setter set={context.setIcon} styles={ICON_STYLES} />
          <span>Audio</span>
          <Setter set={context.setAudio} styles={AUDIO_STYLES} />
          <button onClick={() => context.setFull((full) => !full)}>
            {context.full ? 'Show only Masterfile' : 'Show full Repo'}
          </button>
        </div>
      )}
    </header>
  )),
}

export function Virtual({
  mons,
  setIcon,
  setAudio,
  full,
  setFull,
}: {
  mons: Props[]
  setIcon: Setter
  setAudio: Setter
  full: boolean
  setFull: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <VirtuosoGrid
      className="virtuoso-container"
      totalCount={mons.length}
      data={mons}
      context={{ setIcon, setAudio, full, setFull }}
      components={COMPONENTS}
      itemContent={(_, props) => <Tile key={props.title} {...props} />}
      overscan={50}
    />
  )
}
