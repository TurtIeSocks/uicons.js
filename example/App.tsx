import * as React from 'react'

import { getFullMons, getMasterfile } from './utils'
import { AUDIO_STYLES, ICON_STYLES } from './styles'
import { Virtual } from './Virtual'
import type { Props, RawMon } from './types'

export default function App() {
  const [mons, setMons] = React.useState<Props[]>([])
  const [rawMons, setRawMons] = React.useState<RawMon[]>([])
  const [icon, setIcon] = React.useState(ICON_STYLES[0])
  const [audio, setAudio] = React.useState(AUDIO_STYLES[0])

  React.useLayoutEffect(() => {
    getMasterfile().then((newRawMons) => setRawMons(newRawMons))
  }, [])

  React.useEffect(() => {
    getFullMons(icon, audio, rawMons).then((newMons) =>
      setMons(newMons)
    )
  }, [rawMons, icon, audio])

  return <Virtual mons={mons} setAudio={setAudio} setIcon={setIcon} />
}
