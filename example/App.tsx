import * as React from 'react'
import { Features } from './Features'
import { Footer } from './Footer'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { Nav } from './Nav'
import { AUDIO_STYLES, ICON_STYLES } from './styles'
import { TypeInspector } from './TypeInspector'
import type { Props, RawMon } from './types'
import { getMasterfile, getMonsFromIndex, getMonsFromMf } from './utils'

export default function App() {
  const [mons, setMons] = React.useState<Props[]>([])
  const [rawMons, setRawMons] = React.useState<RawMon[]>([])
  const [icon, setIcon] = React.useState(ICON_STYLES[0])
  const [audio] = React.useState(AUDIO_STYLES[0])
  const [full, setFull] = React.useState(false)

  React.useLayoutEffect(() => {
    if (!full) {
      getMasterfile().then((newRawMons) => setRawMons(newRawMons))
    }
  }, [full])

  React.useEffect(() => {
    ;(full
      ? getMonsFromIndex(icon, audio)
      : getMonsFromMf(icon, audio, rawMons)
    ).then((newMons) => setMons(newMons))
  }, [rawMons, icon, audio, full])

  return (
    <>
      <div className="mesh" aria-hidden />
      <div className="grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Features />
        <TypeInspector />
        <Gallery
          mons={mons}
          icon={icon}
          setIcon={setIcon}
          full={full}
          setFull={setFull}
        />
      </main>
      <Footer />
    </>
  )
}
