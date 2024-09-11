import type { Rpc } from '@na-ji/pogo-protos'
import type {
  UiconsIndex,
  RewardTypeKeys,
  TimeOfDay,
  ExtensionMap,
  Paths,
  EnumVal,
  TrainerCounts,
  LureIDs,
  Options,
} from './types.js'

/**
 * Universal ICONS Class for Pokémon GO asset management
 *
 * Can be used with any image or audio extensions, as long as they follow the UICONS guidelines
 * @see https://github.com/UIcons/UIcons
 * @example
 * import { UICONS } from 'uicons.js'
 *
 * // Basic usage
 * const uicons = new UICONS('https://example.com/uicons')
 * // With all constructor options
 * const uicons = new UICONS({
 *  // base URL of the UICONS repository
 *  path: 'https://example.com/uicons',
 *  // label for debug purposes
 *  label: 'cagemons',
 *  // your own index.json data if you want to load in the constructor
 *  data: { pokemon: [...], device: [...] },
 * })
 * // With stronger typing from index file
 * const uicons = new UICONS<UiconsIndex>({ path: 'https://example.com/uicons' })
 * // Async initialization fetches the index.json file for you
 * await uicons.remoteInit()
 * // Sync initialization if you already have the index.json and want to load it manually
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
  #station: Set<Index['station'][number]>
  #team: Set<Index['team'][number]>
  #type: Set<Index['type'][number]>
  #weather: Set<Index['weather'][number]>

  /**
   * @param options The options object for the UICONS instance
   */
  constructor(options: Options<Index>)
  /**
   * @param path The base URL of the UICONS repository
   */
  constructor(path: string)
  /**
   * @param path The base URL of the UICONS repository
   * @param label The optional label for the UICONS instance
   * @deprecated Use the new constructor with an options object
   */
  constructor(path: string, label?: string)
  constructor(optionsOrPath: string | Options<Index>, oldLabel?: string) {
    const { path, label, data }: Options<Index> =
      typeof optionsOrPath === 'string'
        ? { path: optionsOrPath, label: oldLabel }
        : optionsOrPath

    this.#path = path.endsWith('/') ? path.slice(0, -1) : path
    this.#label = label ?? this.#path
    if (oldLabel) {
      this.#warn(
        'The label parameter is deprecated, use the options object instead'
      )
    }
    if (data) this.init(data)
  }

  #warn(...args: unknown[]) {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn(`[UICONS ${this.#label}]`, ...args)
    }
  }

  #buildExtensions(json: Index): ExtensionMap<Index> {
    return Object.fromEntries(
      Object.entries(json)
        .map(([category, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            return [category, values[0].split('.').pop()]
          } else if (typeof values === 'object') {
            return [category, this.#buildExtensions(values)]
          }
          return [category, '']
        })
        .filter(([_, value]) => value !== '')
    )
  }

  #isReady(key?: keyof ExtensionMap): boolean {
    if (!this.#extensionMap) throw new Error('UICONS not initialized')
    if (key && !this.#extensionMap[key]) return false
    return true
  }

  #evalPossiblyEmptyFlag(flag: string, value: boolean | string | number) {
    return typeof value === 'number'
      ? [`${flag}${value || ''}`, '']
      : value
      ? [flag, '']
      : ['']
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
  init(data: Index) {
    this.#device = new Set(data.device || [])
    this.#gym = new Set(data.gym || [])
    this.#invasion = new Set(data.invasion || [])
    this.#misc = new Set(data.misc || [])
    this.#nest = new Set(data.nest || [])
    this.#pokemon = new Set(data.pokemon || [])
    this.#pokestop = new Set(data.pokestop || [])
    this.#raid = { egg: new Set(data.raid?.egg || []) }
    this.#reward = Object.fromEntries(
      Object.entries(data.reward || {})
        .filter(([, v]) => Array.isArray(v))
        .map(([k, v]) => [k, new Set(v)])
    )
    this.#spawnpoint = new Set(data.spawnpoint || [])
    this.#station = new Set(data.station || [])
    this.#team = new Set(data.team || [])
    this.#type = new Set(data.type || [])
    this.#weather = new Set(data.weather || [])

    this.#extensionMap = this.#buildExtensions(data)
    return this
  }

  /**
   * Check to see if an icon path exists in the UICONS repository
   * @param location This is the dot notation path of the folders in the UICONS repository
   * @param fileName The filename without the extension
   */
  has(location: Paths<Index>, fileName: string | number): boolean {
    this.#isReady()
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
        return this.#raid.egg.has(`${fileName}.${this.#extensionMap.raid?.egg}`)
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
      case 'station':
        return this.#station.has(`${fileName}.${this.#extensionMap.station}`)
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
    if (!this.#isReady('device')) return ''

    return online && this.#device.has(`1.${this.#extensionMap.device}`)
      ? `${this.#path}/device/1.${this.#extensionMap.device}`
      : `${this.#path}/device/0.${this.#extensionMap.device}`
  }

  /**
   * @param teamId the team id of the gym, @see Rpc.Team
   * @param trainerCount the number of trainers in the gym
   * @param inBattle is the gym is in battle
   * @param ex is the gym an EX raid gym
   * @param ar is the gym AR eligible
   * @param power the power up level of the gym, @see Rpc.FortPowerUpLevel
   * @returns the src of the gym icon
   */
  gym(
    teamId?: EnumVal<typeof Rpc.Team>,
    trainerCount?: TrainerCounts,
    inBattle?: boolean,
    ex?: boolean,
    ar?: boolean,
    power?: boolean | EnumVal<typeof Rpc.FortPowerUpLevel>
  ): string
  gym(
    teamId?: string | number,
    trainerCount?: string | number,
    inBattle?: boolean,
    ex?: boolean,
    ar?: boolean,
    power?: boolean | string | number
  ): string
  gym(
    teamId = 0,
    trainerCount: string | number = 0,
    inBattle = false,
    ex = false,
    ar = false,
    power = false
  ): string {
    if (!this.#isReady('gym')) return ''

    const baseUrl = `${this.#path}/gym`

    const trainerSuffixes = trainerCount ? [`_t${trainerCount}`, ''] : ['']
    const inBattleSuffixes = inBattle ? ['_b', ''] : ['']
    const exSuffixes = ex ? ['_ex', ''] : ['']
    const arSuffixes = ar ? ['_ar', ''] : ['']
    const powerUpSuffixes = this.#evalPossiblyEmptyFlag('_p', power)

    for (let t = 0; t < trainerSuffixes.length; t += 1) {
      for (let b = 0; b < inBattleSuffixes.length; b += 1) {
        for (let e = 0; e < exSuffixes.length; e += 1) {
          for (let a = 0; a < arSuffixes.length; a += 1) {
            for (let p = 0; p < powerUpSuffixes.length; p += 1) {
              const result = `${teamId}${trainerSuffixes[t]}${
                inBattleSuffixes[b]
              }${exSuffixes[e]}${arSuffixes[a]}${powerUpSuffixes[p]}.${
                this.#extensionMap.gym
              }`
              if (this.#gym.has(result)) {
                return `${baseUrl}/${result}`
              }
            }
          }
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.gym}`
  }

  /**
   * @param gruntId the grunt id of the invasion, @see Rpc.EnumWrapper.InvasionCharacter
   * @param confirmed if the invasion is confirmed - used for giovanni/decoy images
   * @returns the src of the invasion icon
   */
  invasion(
    gruntId?: EnumVal<typeof Rpc.EnumWrapper.InvasionCharacter>,
    confirmed?: boolean
  ): string
  invasion(gruntId?: string | number, confirmed?: boolean): string
  invasion(gruntId = 0, confirmed = false): string {
    if (!this.#isReady('invasion')) return ''

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
  misc(fileName?: string | number): string {
    if (!this.#isReady('misc')) return ''

    const baseUrl = `${this.#path}/misc`

    if (this.#misc.has(`${fileName}.${this.#extensionMap.misc}`)) {
      return `${baseUrl}/${fileName}.${this.#extensionMap.misc}`
    }
    return `${baseUrl}/0.${this.#extensionMap.misc}`
  }

  /**
   * @param typeId the pokemon type ID that is nesting, @see Rpc.HoloPokemonType
   * @returns the src of the nest icon
   */
  nest(typeId?: EnumVal<typeof Rpc.HoloPokemonType>): string
  nest(typeId?: string | number): string
  nest(typeId = 0): string {
    if (!this.#isReady('nest')) return ''

    const baseUrl = `${this.#path}/nest`

    const result = `${typeId}.${this.#extensionMap.nest}`
    if (this.#nest.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.nest}`
  }

  /**
   * @param pokemonId the pokemon ID
   * @param evolution the [mega] evolution ID of the pokemon, @see Rpc.HoloTemporaryEvolutionId
   * @param form the form ID of the pokemon, @see Rpc.PokemonDisplayProto.Form
   * @param costume the costume ID of the pokemon, @see Rpc.PokemonDisplayProto.Costume
   * @param gender the gender ID of the pokemon, @see Rpc.PokemonDisplayProto.PokemonGender
   * @param alignment the alignment ID of the pokemon, such as shadow or purified, @see Rpc.PokemonDisplayProto.Alignment
   * @param bread the bread mode of the pokemon, @see Rpc.BreadModeEnum.Modifier
   * @param shiny if the pokemon is shiny
   * @returns the src of the pokemon icon
   */
  pokemon(
    pokemonId?: EnumVal<typeof Rpc.HoloPokemonId>,
    evolution?: EnumVal<typeof Rpc.HoloTemporaryEvolutionId>,
    form?: EnumVal<typeof Rpc.PokemonDisplayProto.Form>,
    costume?: EnumVal<typeof Rpc.PokemonDisplayProto.Costume>,
    gender?: EnumVal<typeof Rpc.PokemonDisplayProto.Gender>,
    alignment?: EnumVal<typeof Rpc.PokemonDisplayProto.Alignment>,
    bread?: EnumVal<typeof Rpc.BreadModeEnum.Modifier>,
    shiny?: boolean
  ): string
  pokemon(
    pokemonId?: string | number,
    evolution?: string | number,
    form?: string | number,
    costume?: string | number,
    gender?: string | number,
    alignment?: string | number,
    bread?: string | number,
    shiny?: boolean
  ): string
  pokemon(
    pokemonId = 0,
    evolution = 0,
    form = 0,
    costume = 0,
    gender = 0,
    alignment = 0,
    bread = 0,
    shiny = false
  ): string {
    if (!this.#isReady('pokemon')) return ''

    const baseUrl = `${this.#path}/pokemon`

    const evolutionSuffixes = evolution ? [`_e${evolution}`, ''] : ['']
    const formSuffixes = form ? [`_f${form}`, ''] : ['']
    const costumeSuffixes = costume ? [`_c${costume}`, ''] : ['']
    const genderSuffixes = gender ? [`_g${gender}`, ''] : ['']
    const alignmentSuffixes = alignment ? [`_a${alignment}`, ''] : ['']
    const breadSuffixes = bread ? [`_b${bread}`, ''] : ['']
    const shinySuffixes = shiny ? ['_s', ''] : ['']

    for (let e = 0; e < evolutionSuffixes.length; e += 1) {
      for (let f = 0; f < formSuffixes.length; f += 1) {
        for (let c = 0; c < costumeSuffixes.length; c += 1) {
          for (let g = 0; g < genderSuffixes.length; g += 1) {
            for (let a = 0; a < alignmentSuffixes.length; a += 1) {
              for (let b = 0; b < breadSuffixes.length; b += 1) {
                for (let s = 0; s < shinySuffixes.length; s += 1) {
                  const result = `${pokemonId}${evolutionSuffixes[e]}${
                    formSuffixes[f]
                  }${costumeSuffixes[c]}${genderSuffixes[g]}${
                    alignmentSuffixes[a]
                  }${breadSuffixes[b]}${shinySuffixes[s]}.${
                    this.#extensionMap.pokemon
                  }`
                  if (this.#pokemon.has(result)) {
                    return `${baseUrl}/${result}`
                  }
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
   * @param lureId the ID of the lure at the pokestop, 0 for no lure, @see Rpc.TROY_DISK values in Rpc.Item
   * @param displayTypeId the display ID of the pokestop, 0 for no display, @see Rpc.IncidentDisplayType
   * @param questActive does the pokestop currently have an active quest
   * @param ar is the pokestop AR eligible
   * @param power the power up level of the pokestop, 0 for no power up, @see Rpc.FortPowerUpLevel
   * @returns
   */
  pokestop(
    lureId?: LureIDs,
    displayTypeId?: boolean | EnumVal<typeof Rpc.IncidentDisplayType>,
    questActive?: boolean | string | number,
    ar?: boolean,
    power?: EnumVal<typeof Rpc.FortPowerUpLevel>
  ): string
  pokestop(
    lureId?: string | number,
    displayTypeId?: boolean | string | number,
    questActive?: boolean | string | number,
    ar?: boolean,
    power?: string | number
  ): string
  pokestop(
    lureId = 0,
    displayTypeId = false,
    questActive = false,
    ar = false,
    power = 0
  ): string {
    if (!this.#isReady('pokestop')) return ''

    const baseUrl = `${this.#path}/pokestop`

    const displaySuffixes = this.#evalPossiblyEmptyFlag('_i', displayTypeId)
    const questSuffixes = this.#evalPossiblyEmptyFlag('_q', questActive)
    const arSuffixes = ar ? ['_ar', ''] : ['']
    const powerUpSuffixes = power ? [`_p${power}`, ''] : ['']

    for (let i = 0; i < displaySuffixes.length; i += 1) {
      for (let q = 0; q < questSuffixes.length; q += 1) {
        for (let a = 0; a < arSuffixes.length; a += 1) {
          for (let p = 0; p < powerUpSuffixes.length; p += 1) {
            const result = `${lureId}${displaySuffixes[i]}${questSuffixes[q]}${
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
   * @param level the level of the raid egg, @see Rpc.RaidLevel
   * @param hatched if the raid egg has hatched
   * @param ex if the raid egg is an EX raid egg
   * @returns the src of the raid egg icon
   */
  raidEgg(
    level?: EnumVal<typeof Rpc.RaidLevel>,
    hatched?: boolean,
    ex?: boolean
  ): string
  raidEgg(level?: string | number, hatched?: boolean, ex?: boolean): string
  raidEgg(level = 0, hatched = false, ex = false): string {
    if (!this.#isReady('raid')) return ''

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
   * @param questRewardType the type of quest reward, @see Rpc.QuestRewardProto.Type
   * @param rewardId the ID or the amount of the reward. This depends on the complexity of the reward type. For example, item rewards use the item ID, while stardust rewards use the amount of stardust. Best to check uicons repository to see which of them use the `_a` flag
   * @param amount the amount of the reward
   * @returns the src of the quest reward icon
   */
  reward<U extends RewardTypeKeys>(
    questRewardType?: U,
    rewardId?: string | number,
    amount?: string | number
  ): string
  reward<U extends RewardTypeKeys>(
    questRewardType?: U,
    amount?: string | number
  ): string
  reward<U extends RewardTypeKeys>(
    questRewardType: U = 'unset' as U,
    rewardId = 0,
    amount = 0
  ): string {
    if (!this.#isReady('reward')) return ''

    const baseUrl = `${this.#path}/reward/${questRewardType}`
    const rewardSet = this.#reward[questRewardType]
    if (!rewardSet) {
      this.#warn('Invalid quest reward type,', questRewardType)
      return this.misc(0)
    }

    const amountSafe = typeof amount === 'number' ? amount : +amount
    const amountSuffixes =
      Number.isInteger(amountSafe) && amountSafe > 1
        ? [`_a${amount}`, '']
        : ['']
    const safeId = +rewardId || amountSafe || 0

    for (let a = 0; a < amountSuffixes.length; a += 1) {
      const result = `${safeId}${amountSuffixes[a]}.${
        this.#extensionMap.reward[questRewardType]
      }`
      if (rewardSet.has(result)) {
        return `${baseUrl}/${result}`
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.reward[questRewardType]}`
  }

  /**
   * @param hasTth if the spawnpoint has a confirmed timer or not
   * @returns the src of the spawnpoint icon
   */
  spawnpoint(hasTth = false): string {
    if (!this.#isReady('spawnpoint')) return ''

    return hasTth && this.#spawnpoint.has(`1.${this.#extensionMap.spawnpoint}`)
      ? `${this.#path}/spawnpoint/1.${this.#extensionMap.spawnpoint}`
      : `${this.#path}/spawnpoint/0.${this.#extensionMap.spawnpoint}`
  }

  /**
   * @param active if the station is active or not
   * @returns the src of the station icon
   */
  station(active = false): string {
    if (!this.#isReady('station')) return ''

    return `${this.#path}/station/${active ? 1 : 0}.${
      this.#extensionMap.station
    }`
  }

  /**
   * @param teamId the team ID, @see Rpc.Team
   * @returns the src of the team icon
   */
  team(teamId?: EnumVal<typeof Rpc.Team>): string
  team(teamId?: string | number): string
  team(teamId = 0): string {
    if (!this.#isReady('team')) return ''

    const baseUrl = `${this.#path}/team`

    const result = `${teamId}.${this.#extensionMap.team}`
    if (this.#team.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.team}`
  }

  /**
   * @param typeId the pokemon type ID, @see Rpc.HoloPokemonType
   * @returns the src of the pokemon type icon
   */
  type(typeId?: EnumVal<typeof Rpc.HoloPokemonType>): string
  type(typeId?: string | number): string
  type(typeId = 0): string {
    if (!this.#isReady('type')) return ''

    const baseUrl = `${this.#path}/type`

    const result = `${typeId}.${this.#extensionMap.type}`
    if (this.#type.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.type}`
  }

  /**
   * @param weatherId the weather ID, @see Rpc.GameplayWeatherProto.WeatherCondition
   * @param severityLevel the severity of the weather, @see Rpc.InternalWeatherAlertProto.Severity
   * @param timeOfDay the time of day, @see TimeOfDay
   * @returns the src of the weather icon
   */
  weather(
    weatherId?: EnumVal<typeof Rpc.GameplayWeatherProto.WeatherCondition>,
    severityLevel?: EnumVal<typeof Rpc.InternalWeatherAlertProto.Severity>,
    timeOfDay?: TimeOfDay
  ): string
  weather(
    weatherId?: string | number,
    severityLevel?: string | number,
    timeOfDay?: string
  ): string
  weather(weatherId = 0, severityLevel = 0, timeOfDay = 'day'): string {
    if (!this.#isReady('weather')) return ''

    const baseUrl = `${this.#path}/weather`

    const severitySuffixes = severityLevel ? [`_l${severityLevel}`, ''] : ['']
    const timeSuffixes = timeOfDay === 'night' ? ['_n', ''] : ['_d', '']
    for (let s = 0; s < severitySuffixes.length; s += 1) {
      for (let t = 0; t < timeSuffixes.length; t += 1) {
        const result = `${weatherId}${severitySuffixes[s]}${timeSuffixes[t]}.${
          this.#extensionMap.weather
        }`
        if (this.#weather.has(result)) {
          return `${baseUrl}/${result}`
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.weather}`
  }
}
