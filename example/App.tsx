import * as React from 'react'
import { UICONS } from '../src'

interface Form {
  attack?: number
  defense?: number
  stamina?: number
}

interface Pokemon extends Required<Form> {
  forms: Record<string, Form>
  temp_evolutions?: Record<string, Form>
}

function Tile({
  title,
  src,
  cry,
}: {
  title: string
  src: string
  cry: string
}) {
  return (
    <button
      className="flex-item"
      onClick={() => new Audio(cry).play()}
      type="button"
    >
      <h3>{title}</h3>
      <img src={src} alt={title} />
    </button>
  )
}

export default function App() {
  const [masterfile, setMasterfile] = React.useState<Record<string, Pokemon>>(
    {}
  )
  const [uicons, setUicons] = React.useState<UICONS | null>(null)
  const [uaudio, setUaudio] = React.useState<UICONS | null>(null)

  React.useEffect(() => {
    ;(async () => {
      const newUicons = new UICONS(
        'https://raw.githubusercontent.com/nileplumb/PkmnHomeIcons/master/UICONS'
      )
      await newUicons.remoteInit()
      const newUaudio = new UICONS(
        'https://raw.githubusercontent.com/WatWowMap/wwm-uaudio/main/'
      )
      await newUaudio.remoteInit()
      const masterfile = await fetch(
        'https://raw.githubusercontent.com/WatWowMap/Masterfile-Generator/master/master-latest-basics.json'
      )
      const json = await masterfile.json()
      setMasterfile(json.pokemon)
      setUicons(newUicons)
      setUaudio(newUaudio)
    })()
  }, [])

  return uicons && uaudio ? (
    <div>
      <h1>UICONS Example Page</h1>
      <h2>Click to Hear Their Cry</h2>
      <div className="flex-container">
        {Object.entries(masterfile).map(([id, pokemon]) => {
          const forms = Object.keys(pokemon.forms)
          return (
            <React.Fragment key={id}>
              {forms.length ? (
                forms.map((form) => (
                  <Tile
                    key={`${id}-${form}`}
                    title={`${id}-${form}`}
                    src={uicons.pokemon(id, form)}
                    cry={uaudio.pokemon(id, form)}
                  />
                ))
              ) : (
                <Tile
                  title={id}
                  src={uicons.pokemon(id)}
                  cry={uaudio.pokemon(id)}
                />
              )}
              {Object.keys(pokemon.temp_evolutions || {}).map((evo) => (
                <Tile
                  key={`${id}-${evo}`}
                  title={`${id}-${evo}`}
                  src={uicons.pokemon(id, 0, evo)}
                  cry={uaudio.pokemon(id, 0, evo)}
                />
              ))}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  ) : null
}
