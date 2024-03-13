import { UICONS } from '../src'
import { MASTERFILE_URL } from './styles'
import type { Asset, Pokemon, Props, RawMon } from './types'

export async function getMasterfile() {
  const masterfile = await fetch(MASTERFILE_URL)
  const json: { pokemon: Record<string, Pokemon> } = await masterfile.json()
  const rawMons: RawMon[] = []
  Object.entries(json.pokemon).forEach(([id, pokemon]) => {
    const forms = Object.entries(pokemon.forms)
    if (forms.length) {
      forms.forEach(([form, { tempEvolutions }]) => {
        rawMons.push({ id: +id, form: +form })
        if (tempEvolutions) {
          Object.keys(tempEvolutions).forEach((evo) => {
            rawMons.push({ id: +id, form: +form, evo: +evo })
          })
        }
      })
    } else {
      rawMons.push({ id: +id })
    }
    Object.keys(pokemon.tempEvolutions || {}).forEach((evo) => {
      rawMons.push({ id: +id, evo: +evo })
    })
  })
  return rawMons
}

export async function getFullMons(
  icon: Asset,
  audio: Asset,
  rawMons: RawMon[]
) {
  const newUicons = new UICONS(icon.path)
  const newUaudio = new UICONS(audio.path)
  await Promise.all([newUicons.remoteInit(), newUaudio.remoteInit()])
  const newMons: Props[] = rawMons.map(({ id, form, evo }) => ({
    title: form ? `${id}-f${form}` : evo ? `${id}-e${evo}` : `${id}`,
    src: newUicons.pokemon(id, form, evo),
    cry: newUaudio.pokemon(id, form, evo),
  }))
  return newMons
}
