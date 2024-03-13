import type { UiconsIndex, RewardTypeKeys, TimeOfDay } from './types'

/**
 * Universal ICONS Class for Pokémon GO asset management
 *
 * Can be used with any image or audio extensions, as long as they follow the UICONS guidelines
 * @see https://github.com/UIcons/UIcons
 * @example
 * // Without generic
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
  #extension: string
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
    this.#extension = 'png'
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
    this.init(await data.json())
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
        Object.entries(data.reward || {}).map(([k, v]) => [k, new Set(v)])
      )
    )
    this.#spawnpoint = new Set(data.spawnpoint || [])
    this.#team = new Set(data.team || [])
    this.#type = new Set(data.type || [])
    this.#weather = new Set(data.weather || [])

    this.#extension =
      Object.values(data)
        .find((d) =>
          Array.isArray(d)
            ? d.length > 0
            : Object.values(d).find((e) =>
                Array.isArray(e) ? e.length > 0 : false
              )
        )?.[0]
        .split('.')
        .pop() || this.#extension
  }

  getPokemon(
    pokemonId = 0,
    form = 0,
    evolution = 0,
    gender = 0,
    costume = 0,
    alignment = 0,
    shiny = false
  ): Index['pokemon'][number] {
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
                }${shinySuffixes[s]}.${this.#extension}`
                if (this.#pokemon.has(result)) {
                  return `${baseUrl}/${result}`
                }
              }
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getType(typeId = 0): Index['type'][number] {
    const baseUrl = `${this.#path}/type`

    const result = `${typeId}.${this.#extension}`
    if (this.#type.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getPokestop(
    lureId = 0,
    invasionActive = false,
    questActive = false,
    ar = false,
    power = 0,
    display = ''
  ): Index['pokestop'][number] {
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
            }${powerUpSuffixes[p]}.${this.#extension}`
            if (this.#pokestop.has(result)) {
              return `${baseUrl}/${result}`
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getReward<U extends RewardTypeKeys>(
    // @ts-ignore // TODO: WHY TS
    questRewardType: U = 'unset',
    rewardId = 0,
    amount = 0
  ): Index['reward'][U][number] {
    const baseUrl = `${this.#path}/reward/${questRewardType}`

    if (this.#reward[questRewardType]) {
      const amountSuffixes = amount > 1 ? [`_a${amount}`, ''] : ['']
      for (let a = 0; a < amountSuffixes.length; a += 1) {
        const result = `${rewardId}${amountSuffixes[a]}.${this.#extension}`
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
    return `${baseUrl}/0.${this.#extension}`
  }

  getInvasion(gruntId = 0, confirmed = false): Index['invasion'][number] {
    const baseUrl = `${this.#path}/invasion`

    const confirmedSuffixes = confirmed ? [''] : ['_u', '']
    for (let c = 0; c < confirmedSuffixes.length; c += 1) {
      const result = `${gruntId}${confirmedSuffixes[c]}.${this.#extension}`
      if (this.#invasion.has(result)) {
        return `${baseUrl}/${result}`
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getGym(
    teamId = 0,
    trainerCount = 0,
    inBattle = false,
    ex = false,
    ar = false
  ): Index['gym'][number] {
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
            }${exSuffixes[e]}${arSuffixes[a]}.${this.#extension}`
            if (this.#gym.has(result)) {
              return `${baseUrl}/${result}`
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getEgg(level = 0, hatched = false, ex = false): Index['raid']['egg'][number] {
    const baseUrl = `${this.#path}/raid/egg`

    const hatchedSuffixes = hatched ? ['_h', ''] : ['']
    const exSuffixes = ex ? ['_ex', ''] : ['']
    for (let h = 0; h < hatchedSuffixes.length; h += 1) {
      for (let e = 0; e < exSuffixes.length; e += 1) {
        const result = `${level}${hatchedSuffixes[h]}${exSuffixes[e]}.${
          this.#extension
        }`
        if (this.#raid.egg.has(result)) {
          return `${baseUrl}/${result}`
        }
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getTeam(teamId = 0): Index['team'][number] {
    const baseUrl = `${this.#path}/team`

    const result = `${teamId}.${this.#extension}`
    if (this.#team.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getWeather(
    weatherId = 0,
    timeOfDay: TimeOfDay = 'day'
  ): Index['weather'][number] {
    const baseUrl = `${this.#path}/weather`

    const timeSuffixes = timeOfDay === 'night' ? ['_n', ''] : ['_d', '']
    for (let t = 0; t < timeSuffixes.length; t += 1) {
      const result = `${weatherId}${timeSuffixes[t]}.${this.#extension}`
      if (this.#weather.has(result)) {
        return `${baseUrl}/${result}`
      }
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getNest(typeId = 0): Index['nest'][number] {
    const baseUrl = `${this.#path}/nest`

    const result = `${typeId}.${this.#extension}`
    if (this.#nest.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  miscHas(fileName: string) {
    return this.#misc.has(`${fileName}.${this.#extension}`)
  }

  getMisc(fileName: string): Index['misc'][number] {
    const baseUrl = `${this.#path}/misc`

    if (this.miscHas(fileName)) {
      return `${baseUrl}/${fileName}.${this.#extension}`
    }
    return `${baseUrl}/0.${this.#extension}`
  }

  getDevice(online = false): Index['device'][number] {
    return online && this.#device.has(`1.${this.#extension}`)
      ? `${this.#path}/device/1.${this.#extension}`
      : `${this.#path}/device/0.${this.#extension}`
  }

  getSpawnpoint(hasTth = false): Index['spawnpoint'][number] {
    return hasTth && this.#spawnpoint.has(`1.${this.#extension}`)
      ? `${this.#path}/spawnpoint/1.${this.#extension}`
      : `${this.#path}/spawnpoint/0.${this.#extension}`
  }
}

export * from './types'
