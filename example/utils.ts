import { UICONS, UiconsIndex } from '../src'
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

export async function getMonsFromMf(
  icon: Asset,
  audio: Asset,
  rawMons: RawMon[]
): Promise<Props[]> {
  const newUicons = new UICONS(icon.path)
  const newUaudio = new UICONS(audio.path)
  await Promise.all([newUicons.remoteInit(), newUaudio.remoteInit()])
  return rawMons.map(({ id, form, evo }) => {
    let title = id.toString()
    if (form) title += `_${form}`
    if (evo) title += `_${evo}`
    return {
      title,
      src: newUicons.pokemon(id, evo, form),
      cry: newUaudio.pokemon(id, evo, form),
    }
  })
}

function parseArgs(args: string[], key: string): string | null {
  const found = args.find((arg) => arg.startsWith(key))
  return found ? found.split(key)[1] : null
}

export async function getMonsFromIndex(
  icon: Asset,
  audio: Asset
): Promise<Props[]> {
  const iconIndex = await fetch(icon.path + '/index.json')
  const iconJson: UiconsIndex = await iconIndex.json()
  const newUaudio = new UICONS(audio.path)
  await newUaudio.remoteInit()

  return (
    iconJson.pokemon
      ?.sort((a, b) => {
        try {
          const aId = a.split('_')[0].split('.')[0]
          const bId = b.split('_')[0].split('.')[0]
          return +aId - +bId
        } catch {
          return 0
        }
      })
      .map((file) => {
        const title = file.split('.')[0]
        const [id, ...rest] = title.split('_')
        const form = parseArgs(rest, '_f') ?? 0
        const evo = parseArgs(rest, '_e') ?? 0
        const gender = parseArgs(rest, '_g') ?? 0
        const alignment = parseArgs(rest, '_a') ?? 0
        const bread = parseArgs(rest, '_b') ?? 0
        const shiny = !!parseArgs(rest, '_s') ?? false
        return {
          title,
          src: `${icon.path}/pokemon/${file}`,
          cry: newUaudio.pokemon(
            id,
            evo,
            form,
            0,
            gender,
            alignment,
            bread,
            shiny
          ),
        }
      }) || []
  )
}
