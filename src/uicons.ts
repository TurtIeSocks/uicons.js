import type {
  UiconsIndex,
  RewardTypeKeys,
  TimeOfDay,
  ExtensionMap,
  Paths,
} from './types.js'

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

  /**
   * @param path The base URL of the UICONS repository
   * @param label Optional label for debugging purposes
   */
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

  static #buildExtensions(json: UiconsIndex): ExtensionMap {
    return Object.fromEntries(
      Object.entries(json)
        .map(([category, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            return [category, values[0].split('.').pop()]
          } else if (typeof values === 'object') {
            return [category, UICONS.#buildExtensions(values)]
          }
          return [category, '']
        })
        .filter(([_, value]) => value !== '')
    )
  }
  
  /**
   * This is used to initialize the UICONS class asynchronously by automatically fetching the index.json file
   * from the remote UICONS repository provided in the constructor
   */
  async remoteInit() {
    const data = await fetch(`${this.#path}/index.json`)
    if (!data.ok) {
      throw new Error(
        `Failed to fetch ${this.#path} ${data.status} ${data.statusText}`
      )
    }
    const indexFile = await data.json()
    return this.init(indexFile)
  }

  /**
   * This is used to initialize the UICONS class if you have already fetched the index.json file and want init the class synchronously
   * @param data The index.json file from the UICONS repository
   */
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

    this.#extensionMap = UICONS.#buildExtensions(data)
    return this
  }

  /**
   * Check to see if an icon path exists in the UICONS repository
   * @param location This is the dot notation path of the folders in the UICONS repository
   * @param fileName The filename without the extension
   */
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
          ? !!this.#reward[second]?.has(
              `${fileName}.${this.#extensionMap.reward[second]}`
            )
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

  /**
   * @param online a boolean to determine if the device is online or offline
   * @returns the src of the device icon
   */
  device(online = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    return online && this.#device.has(`1.${this.#extensionMap.device}`)
      ? `${this.#path}/device/1.${this.#extensionMap.device}`
      : `${this.#path}/device/0.${this.#extensionMap.device}`
  }

  /**
   * @param teamId the team id of the gym, see Rpc.Team
   * @param trainerCount the number of trainers in the gym
   * @param inBattle is the gym is in battle
   * @param ex is the gym an EX raid gym
   * @param ar is the gym AR eligible
   * @returns the src of the gym icon
   */
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

  /**
   * @param gruntId the grunt id of the invasion, see Rpc.EnumWrapper.InvasionCharacter
   * @param confirmed if the invasion is confirmed - used for giovanni/decoy images
   * @returns the src of the invasion icon
   */
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

  /**
   * @param fileName the filename without the extension
   * @returns the src of the misc icon
   */
  misc(fileName: string): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/misc`

    if (this.#misc.has(`${fileName}.${this.#extensionMap.misc}`)) {
      return `${baseUrl}/${fileName}.${this.#extensionMap.misc}`
    }
    return `${baseUrl}/0.${this.#extensionMap.misc}`
  }

  /**
   * @param typeId the pokemon type ID that is nesting, see Rpc.HoloPokemonType
   * @returns the src of the nest icon
   */
  nest(typeId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/nest`

    const result = `${typeId}.${this.#extensionMap.nest}`
    if (this.#nest.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.nest}`
  }

  /**
   * @param pokemonId the pokemon ID
   * @param form the form ID of the pokemon, see Rpc.PokemonDisplayProto.Form
   * @param evolution the [mega] evolution ID of the pokemon, see Rpc.HoloTemporaryEvolutionId
   * @param gender the gender ID of the pokemon, see Rpc.BelugaPokemonProto.PokemonGender
   * @param costume the costume ID of the pokemon, see Rpc.PokemonDisplayProto.Costume
   * @param alignment the alignment ID of the pokemon, such as shadow or purified, see Rpc.PokemonDisplayProto.Alignment
   * @param shiny if the pokemon is shiny
   * @returns the src of the pokemon icon
   */
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

  /**
   * @param lureId the ID of the lure at the pokestop, 0 for no lure, see TROY_DISK values in Rpc.Item
   * @param power the power up level of the pokestop, 0 for no power up, see Rpc.FortPowerUpLevel
   * @param display the display ID of the pokestop, 0 for no display, see Rpc.IncidentDisplayType
   * @param invasionActive does the pokestop currently have an invasion
   * @param questActive does the pokestop currently have an active quest
   * @param ar is the pokestop AR eligible
   * @returns
   */
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

  /**
   * @param level the level of the raid egg, see Rpc.RaidLevel
   * @param hatched if the raid egg has hatched
   * @param ex if the raid egg is an EX raid egg
   * @returns the src of the raid egg icon
   */
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

  /**
   * @param questRewardType the type of quest reward, see Rpc.QuestRewardProto.Type
   * @param rewardIdOrAmount the ID or the amount of the reward. This depends on the complexity of the reward type. For example, item rewards use the item ID, while stardust rewards use the amount of stardust. Best to check uicons repository to see which of them use the `_a` flag
   * @param amount the amount of the reward
   * @returns the src of the quest reward icon
   */
  reward<U extends RewardTypeKeys>(
    // @ts-ignore // TODO: WHY TS
    questRewardType: U = 'unset',
    rewardIdOrAmount: string | number = 0,
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
      const safeId = +rewardIdOrAmount || amountSafe || 0
      for (let a = 0; a < amountSuffixes.length; a += 1) {
        const result = `${safeId}${amountSuffixes[a]}.${
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

  /**
   * @param hasTth if the spawnpoint has a confirmed timer or not
   * @returns the src of the spawnpoint icon
   */
  spawnpoint(hasTth = false): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    return hasTth && this.#spawnpoint.has(`1.${this.#extensionMap.spawnpoint}`)
      ? `${this.#path}/spawnpoint/1.${this.#extensionMap.spawnpoint}`
      : `${this.#path}/spawnpoint/0.${this.#extensionMap.spawnpoint}`
  }

  /**
   * @param teamId the team ID, see Rpc.Team
   * @returns the src of the team icon
   */
  team(teamId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/team`

    const result = `${teamId}.${this.#extensionMap.team}`
    if (this.#team.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.team}`
  }

  /**
   * @param typeId the pokemon type ID, see Rpc.HoloPokemonType
   * @returns the src of the pokemon type icon
   */
  type(typeId: string | number = 0): string {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    const baseUrl = `${this.#path}/type`

    const result = `${typeId}.${this.#extensionMap.type}`
    if (this.#type.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.type}`
  }

  /**
   * @param weatherId the weather ID, see Rpc.GameplayWeatherProto.WeatherCondition
   * @param timeOfDay the time of day, either 'day' or 'night'
   * @returns the src of the weather icon
   */
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
