import type {
  UiconsIndex,
  RewardTypeKeys,
  TimeOfDay,
  ExtensionMap,
  Paths,
} from './types'
import { buildExtensions } from './util'

/**
 * Universal ICONS Class for Pokémon GO asset management
 *
 * Can be used with any image or audio extensions, as long as they follow the UICONS guidelines
 * @see https://github.com/UIcons/UIcons
 * @example
 * // Without generic and with the optional label argument
 * const uicons = new UICONS('https://example.com/uicons', 'cagemons')
 * // With stronger typing from index file
 * const uicons = new UICONS<UiconsIndex>('https://example.com/uicons', 'cagemons')
 * // Async initialization fetches the index.json file for you
 * await uicons.remoteInit()
 * // Sync initialization if you already have the index.json
 * uicons.init(indexJson)
 */
export class UICONS<Index extends UiconsIndex = UiconsIndex> {
  #path: string
  #extensionMap: ExtensionMap
  #label: string

  #device: Set<Index['device'][number]>
  #gym: Set<Index['gym'][number]>
  #invasion: Set<Index['invasion'][number]>
  #misc: Set<Index['misc'][number]>
  #nest: Set<Index['nest'][number]>
  #pokemon: Set<Index['pokemon'][number]>
  #pokestop: Set<Index['pokestop'][number]>
  #raid: { egg: Set<Index['raid']['egg'][number]> }
  #reward: { [key in RewardTypeKeys]?: Set<Index['reward'][key][number]> }
  #spawnpoint: Set<Index['spawnpoint'][number]>
  #team: Set<Index['team'][number]>
  #type: Set<Index['type'][number]>
  #weather: Set<Index['weather'][number]>

  constructor(path: string, label?: string) {
    this.#path = path.endsWith('/') ? path.slice(0, -1) : path
    this.#label = label || this.#path

    this.#device = new Set()
    this.#gym = new Set()
    this.#invasion = new Set()
    this.#misc = new Set()
    this.#nest = new Set()
    this.#pokemon = new Set()
    this.#pokestop = new Set()
    this.#raid = { egg: new Set() }
    this.#reward = {
      unset: new Set(),
      experience: new Set(),
      item: new Set(),
      stardust: new Set(),
      candy: new Set(),
      avatar_clothing: new Set(),
      quest: new Set(),
      pokemon_encounter: new Set(),
      pokecoin: new Set(),
      xl_candy: new Set(),
      level_cap: new Set(),
      sticker: new Set(),
      mega_resource: new Set(),
      incident: new Set(),
      player_attribute: new Set(),
      event_badge: new Set(),
    }
    this.#spawnpoint = new Set()
    this.#team = new Set()
    this.#type = new Set()
    this.#weather = new Set()
  }

  async remoteInit(): Promise<void> {
    const data = await fetch(`${this.#path}/index.json`)
    if (!data.ok) {
      throw new Error(
        `Failed to fetch ${this.#path} ${data.status} ${data.statusText}`
      )
    }
    const indexFile = await data.json()
    this.init(indexFile)
  }

  init(data: UiconsIndex) {
    this.#device = new Set(data.device || [])
    this.#gym = new Set(data.gym || [])
    this.#invasion = new Set(data.invasion || [])
    this.#misc = new Set(data.misc || [])
    this.#nest = new Set(data.nest || [])
    this.#pokemon = new Set(data.pokemon || [])
    this.#pokestop = new Set(data.pokestop || [])
    this.#raid.egg = new Set(data.raid?.egg || [])
    Object.assign(
      this.#reward,
      Object.fromEntries(
        Object.entries(data.reward || {})
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, new Set(v)])
      )
    )
    this.#spawnpoint = new Set(data.spawnpoint || [])
    this.#team = new Set(data.team || [])
    this.#type = new Set(data.type || [])
    this.#weather = new Set(data.weather || [])

    this.#extensionMap = buildExtensions(data)
  }

  has(location: Paths<Index>, fileName: string): boolean {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const [first, second] = location.split('.', 2)
    switch (first) {
      case 'device':
        return this.#device.has(`${fileName}.${this.#extensionMap.device}`)
      case 'gym':
        return this.#gym.has(`${fileName}.${this.#extensionMap.gym}`)
      case 'invasion':
        return this.#invasion.has(`${fileName}.${this.#extensionMap.invasion}`)
      case 'misc':
        return this.#misc.has(`${fileName}.${this.#extensionMap.misc}`)
      case 'nest':
        return this.#nest.has(`${fileName}.${this.#extensionMap.nest}`)
      case 'pokemon':
        return this.#pokemon.has(`${fileName}.${this.#extensionMap.pokemon}`)
      case 'pokestop':
        return this.#pokestop.has(`${fileName}.${this.#extensionMap.pokestop}`)
      case 'raid':
        return this.#raid.egg.has(`${fileName}.${this.#extensionMap.raid.egg}`)
      case 'reward':
        return second in this.#reward
          ? this.#reward[second]?.has(
              `${fileName}.${this.#extensionMap.reward[second]}`
            ) ?? false
          : false
      case 'spawnpoint':
        return this.#spawnpoint.has(
          `${fileName}.${this.#extensionMap.spawnpoint}`
        )
      case 'team':
        return this.#team.has(`${fileName}.${this.#extensionMap.team}`)
      case 'type':
        return this.#type.has(`${fileName}.${this.#extensionMap.type}`)
      case 'weather':
        return this.#weather.has(`${fileName}.${this.#extensionMap.weather}`)
      default:
        return false
    }
  }

  device(online = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    return online && this.#device.has(`1.${this.#extensionMap.device}`)
      ? `${this.#path}/device/1.${this.#extensionMap.device}`
      : `${this.#path}/device/0.${this.#extensionMap.device}`
  }

  gym(
    teamId: string | number = 0,
    trainerCount: string | number = 0,
    inBattle = false,
    ex = false,
    ar = false
  ): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/gym`

    const trainerSuffixes = trainerCount ? [`_t${trainerCount}`, ''] : ['']
    const inBattleSuffixes = inBattle ? ['_b', ''] : ['']
    const exSuffixes = ex ? ['_ex', ''] : ['']
    const arSuffixes = ar ? ['_ar', ''] : ['']
    for (let t = 0; t < trainerSuffixes.length; t += 1) {
      for (let b = 0; b < inBattleSuffixes.length; b += 1) {
        for (let e = 0; e < exSuffixes.length; e += 1) {
          for (let a = 0; a < arSuffixes.length; a += 1) {
            const result = `${teamId}${trainerSuffixes[t]}${
              inBattleSuffixes[b]
            }${exSuffixes[e]}${arSuffixes[a]}.${this.#extensionMap.gym}`
            if (this.#gym.has(result)) {
              return `${baseUrl}/${result}`
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.gym}`
  }

  invasion(gruntId: string | number = 0, confirmed = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/invasion`

    const confirmedSuffixes = confirmed ? [''] : ['_u', '']
    for (let c = 0; c < confirmedSuffixes.length; c += 1) {
      const result = `${gruntId}${confirmedSuffixes[c]}.${
        this.#extensionMap.invasion
      }`
      if (this.#invasion.has(result)) {
        return `${baseUrl}/${result}`
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.invasion}`
  }

  /** Argument should be the filename without the extension */
  misc(fileName: string): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/misc`

    if (this.#misc.has(`${fileName}.${this.#extensionMap.misc}`)) {
      return `${baseUrl}/${fileName}.${this.#extensionMap.misc}`
    }
    return `${baseUrl}/0.${this.#extensionMap.misc}`
  }

  nest(typeId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/nest`

    const result = `${typeId}.${this.#extensionMap.nest}`
    if (this.#nest.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.nest}`
  }

  pokemon(
    pokemonId: string | number = 0,
    form: string | number = 0,
    evolution: string | number = 0,
    gender: string | number = 0,
    costume: string | number = 0,
    alignment: string | number = 0,
    shiny = false
  ): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/pokemon`

    const evolutionSuffixes = evolution ? [`_e${evolution}`, ''] : ['']
    const formSuffixes = form ? [`_f${form}`, ''] : ['']
    const costumeSuffixes = costume ? [`_c${costume}`, ''] : ['']
    const genderSuffixes = gender ? [`_g${gender}`, ''] : ['']
    const alignmentSuffixes = alignment ? [`_a${alignment}`, ''] : ['']
    const shinySuffixes = shiny ? ['_s', ''] : ['']

    for (let e = 0; e < evolutionSuffixes.length; e += 1) {
      for (let f = 0; f < formSuffixes.length; f += 1) {
        for (let c = 0; c < costumeSuffixes.length; c += 1) {
          for (let g = 0; g < genderSuffixes.length; g += 1) {
            for (let a = 0; a < alignmentSuffixes.length; a += 1) {
              for (let s = 0; s < shinySuffixes.length; s += 1) {
                const result = `${pokemonId}${evolutionSuffixes[e]}${
                  formSuffixes[f]
                }${costumeSuffixes[c]}${genderSuffixes[g]}${
                  alignmentSuffixes[a]
                }${shinySuffixes[s]}.${this.#extensionMap.pokemon}`
                if (this.#pokemon.has(result)) {
                  return `${baseUrl}/${result}`
                }
              }
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.pokemon}`
  }

  pokestop(
    lureId: string | number = 0,
    power: string | number = 0,
    display: string | number = 0,
    invasionActive = false,
    questActive = false,
    ar = false
  ): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/pokestop`

    const invasionSuffixes =
      invasionActive || display ? [`_i${display}`, ''] : ['']
    const questSuffixes = questActive ? ['_q', ''] : ['']
    const arSuffixes = ar ? ['_ar', ''] : ['']
    const powerUpSuffixes = power ? [`_p${power}`, ''] : ['']

    for (let i = 0; i < invasionSuffixes.length; i += 1) {
      for (let q = 0; q < questSuffixes.length; q += 1) {
        for (let a = 0; a < arSuffixes.length; a += 1) {
          for (let p = 0; p < powerUpSuffixes.length; p += 1) {
            const result = `${lureId}${invasionSuffixes[i]}${questSuffixes[q]}${
              arSuffixes[a]
            }${powerUpSuffixes[p]}.${this.#extensionMap.pokestop}`
            if (this.#pokestop.has(result)) {
              return `${baseUrl}/${result}`
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.pokestop}`
  }

  raidEgg(level: string | number = 0, hatched = false, ex = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/raid/egg`

    const hatchedSuffixes = hatched ? ['_h', ''] : ['']
    const exSuffixes = ex ? ['_ex', ''] : ['']
    for (let h = 0; h < hatchedSuffixes.length; h += 1) {
      for (let e = 0; e < exSuffixes.length; e += 1) {
        const result = `${level}${hatchedSuffixes[h]}${exSuffixes[e]}.${
          this.#extensionMap.raid.egg
        }`
        if (this.#raid.egg.has(result)) {
          return `${baseUrl}/${result}`
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.raid.egg}`
  }

  reward<U extends RewardTypeKeys>(
    // @ts-ignore // TODO: WHY TS
    questRewardType: U = 'unset',
    rewardId: string | number = 0,
    amount: string | number = 0
  ): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/reward/${questRewardType}`

    if (this.#reward[questRewardType]) {
      const amountSafe = typeof amount === 'number' ? amount : +amount
      const amountSuffixes =
        Number.isInteger(amountSafe) && amountSafe > 1
          ? [`_a${amount}`, '']
          : ['']
      for (let a = 0; a < amountSuffixes.length; a += 1) {
        const result = `${rewardId}${amountSuffixes[a]}.${
          this.#extensionMap.reward[questRewardType]
        }`
        if (this.#reward[questRewardType].has(result)) {
          return `${baseUrl}/${result}`
        }
      }
    } else {
      console.warn(
        `[${this.#label.toUpperCase()}]`,
        `Missing category: ${questRewardType}`
      )
    }
    return `${baseUrl}/0.${this.#extensionMap.reward[questRewardType]}`
  }

  spawnpoint(hasTth = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    return hasTth && this.#spawnpoint.has(`1.${this.#extensionMap.spawnpoint}`)
      ? `${this.#path}/spawnpoint/1.${this.#extensionMap.spawnpoint}`
      : `${this.#path}/spawnpoint/0.${this.#extensionMap.spawnpoint}`
  }

  team(teamId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/team`

    const result = `${teamId}.${this.#extensionMap}`
    if (this.#team.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.team}`
  }

  type(typeId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/type`

    const result = `${typeId}.${this.#extensionMap.type}`
    if (this.#type.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.type}`
  }

  weather(
    weatherId: string | number = 0,
    timeOfDay: TimeOfDay = 'day'
  ): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/weather`

    const timeSuffixes = timeOfDay === 'night' ? ['_n', ''] : ['_d', '']
    for (let t = 0; t < timeSuffixes.length; t += 1) {
      const result = `${weatherId}${timeSuffixes[t]}.${
        this.#extensionMap.weather
      }`
      if (this.#weather.has(result)) {
        return `${baseUrl}/${result}`
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.weather}`
  }
}

export * from './types'
