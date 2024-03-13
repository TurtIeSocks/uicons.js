import * as React from 'react'

import { getMonsFromIndex, getMonsFromMf, getMasterfile } from './utils'
import { AUDIO_STYLES, ICON_STYLES } from './styles'
import { Virtual } from './Virtual'
import type { Props, RawMon } from './types'

export default function App() {
  const [mons, setMons] = React.useState<Props[]>([])
  const [rawMons, setRawMons] = React.useState<RawMon[]>([])
  const [icon, setIcon] = React.useState(ICON_STYLES[0])
  const [audio, setAudio] = React.useState(AUDIO_STYLES[0])
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
    <Virtual
      mons={mons}
      setAudio={setAudio}
      setIcon={setIcon}
      full={full}
      setFull={setFull}
    />
  )
}
