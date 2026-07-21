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
  Scalar,
  BackgroundUrl,
  DeviceUrl,
  GymUrl,
  HasResult,
  InvasionUrl,
  MiscUrl,
  NestUrl,
  PokemonUrl,
  PokestopUrl,
  RaidEggUrl,
  RewardUrl,
  SpawnpointUrl,
  StationUrl,
  TappableUrl,
  TeamUrl,
  TypeUrl,
  WeatherUrl,
} from './types.js'

/**
 * Universal ICONS Class for Pokémon GO asset management
 *
 * Can be used with any image or audio extensions, as long as they follow the UICONS guidelines
 * @see https://github.com/UIcons/UIcons
 *
 * @typeParam Path The base URL of the UICONS repository, captured as a literal
 * @typeParam Ext Type-level hint for the file extension when the index data is not statically known
 * @typeParam Index The index.json data the instance was initialized with
 *
 * @example
 * import { UICONS } from 'uicons.js'
 *
 * // Basic usage
 * const uicons = new UICONS('https://example.com/uicons')
 * // With all constructor options
 * const uicons = new UICONS({
 *   // base URL of the UICONS repository
 *   path: 'https://example.com/uicons',
 *   // label for debug purposes
 *   label: 'cagemons',
 *   // type-level hint for narrowing return types when using remoteInit
 *   extension: 'webp',
 *   // your own index.json data if you want to load in the constructor
 *   data: { pokemon: [...], device: [...] },
 * })
 * // Async initialization fetches the index.json file for you
 * const ready = await uicons.remoteInit()
 * // Sync initialization if you already have the index.json and want to load it manually
 * const ready = uicons.init(indexJson)
 *
 * @example
 * // With literal index data every method resolves its exact return URL:
 * const uicons = new UICONS({
 *   path: 'https://example.com/uicons',
 *   data: { team: ['0.webp', '1.webp'] },
 * })
 * const mystic = uicons.team({ teamId: 1 })
 * //    ^? "https://example.com/uicons/team/1.webp"
 * const missing = uicons.team({ teamId: 9 })
 * //    ^? "https://example.com/uicons/team/0.webp"
 */
export class UICONS<
  const Path extends string = string,
  const Ext extends string = string,
  const Index extends UiconsIndex<readonly string[]> = UiconsIndex,
> {
  #path: Path
  #extensionMap: ExtensionMap
  #label: string

  #background: Set<string>
  #device: Set<string>
  #gym: Set<string>
  #invasion: Set<string>
  #misc: Set<string>
  #nest: Set<string>
  #pokemon: Set<string>
  #pokestop: Set<string>
  #tappable: Set<string>
  #raid: { egg: Set<string> }
  #reward: { [key in RewardTypeKeys]?: Set<string> }
  #spawnpoint: Set<string>
  #station: Set<string>
  #team: Set<string>
  #type: Set<string>
  #weather: Set<string>

  /**
   * @param options The options object for the UICONS instance
   */
  constructor(options: Options<Path, Ext, Index>)
  /**
   * @param path The base URL of the UICONS repository
   */
  constructor(path: Path)
  constructor(optionsOrPath: Path | Options<Path, Ext, Index>, oldLabel?: string) {
    const { path, label, data } =
      typeof optionsOrPath === 'string'
        ? ({ path: optionsOrPath, label: oldLabel } as Options<Path, Ext, Index>)
        : optionsOrPath

    this.#path = (path.endsWith('/') ? path.slice(0, -1) : path) as Path
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

  #buildExtensions(json: UiconsIndex<readonly string[]>): ExtensionMap {
    return Object.fromEntries(
      Object.entries(json)
        .map(([category, values]) => {
          if (Array.isArray(values)) {
            return [
              category,
              values.length > 0 ? values[0].split('.').pop() : '',
            ]
          } else if (values && typeof values === 'object') {
            const nested = this.#buildExtensions(values)
            return [category, Object.keys(nested).length > 0 ? nested : '']
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
    if (typeof value === 'boolean') return value ? [flag, ''] : ['']
    if (typeof value === 'number') return [`${flag}${value || ''}`, flag, '']
    return [`${flag}${Number(value) || ''}`, flag, '']
  }

  /**
   * This is used to initialize the UICONS class asynchronously by automatically fetching the index.json file
   * from the remote UICONS repository provided in the constructor
   * @returns the initialized UICONS instance, typed with unknown index data
   */
  async remoteInit(): Promise<UICONS<Path, Ext, UiconsIndex>> {
    const data = await fetch(`${this.#path}/index.json`)
    if (!data.ok) {
      throw new Error(
        `Failed to fetch ${this.#path} ${data.status} ${data.statusText}`
      )
    }
    const indexFile = await data.json()
    return this.init(indexFile as UiconsIndex)
  }

  /**
   * This is used to initialize the UICONS class if you have already fetched the index.json file and want init the class synchronously
   * @param data The index.json file from the UICONS repository
   * @returns the same instance, typed with the provided index data
   */
  init<const D extends UiconsIndex<readonly string[]>>(
    data: D
  ): UICONS<Path, Ext, D> {
    this.#background = new Set(data.background || [])
    this.#device = new Set(data.device || [])
    this.#gym = new Set(data.gym || [])
    this.#invasion = new Set(data.invasion || [])
    this.#misc = new Set(data.misc || [])
    this.#nest = new Set(data.nest || [])
    this.#pokemon = new Set(data.pokemon || [])
    this.#pokestop = new Set(data.pokestop || [])
    this.#tappable = new Set(data.tappable || [])
    this.#raid = { egg: new Set(data.raid?.egg || []) }
    this.#reward = Object.fromEntries(
      Object.entries(data.reward || {})
        .filter(([, v]) => Array.isArray(v) && v.length > 0)
        .map(([k, v]) => [k, new Set(v)])
    )
    this.#spawnpoint = new Set(data.spawnpoint || [])
    this.#station = new Set(data.station || [])
    this.#team = new Set(data.team || [])
    this.#type = new Set(data.type || [])
    this.#weather = new Set(data.weather || [])

    this.#extensionMap = this.#buildExtensions(data)
    return this as unknown as UICONS<Path, Ext, D>
  }

  /**
   * Check to see if an icon path exists in the UICONS repository
   * @param location This is the dot notation path of the folders in the UICONS repository
   * @param fileName The filename without the extension
   */
  has<L extends Paths<Index>, FN extends Scalar>(
    location: L,
    fileName: FN
  ): HasResult<Index, L, FN, Ext>
  has(location: string, fileName: Scalar): boolean {
    this.#isReady()
    const [first, second] = location.split('.', 2)
    switch (first) {
      case 'background':
        return this.#background.has(
          `${fileName}.${this.#extensionMap.background}`
        )
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
      case 'tappable':
        return this.#tappable.has(`${fileName}.${this.#extensionMap.tappable}`)
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
   * @param args.id the background ID
   * @returns the src of the background icon
   */
  background<Id extends Scalar = 0>(args?: {
    id?: Id
  }): BackgroundUrl<Index, Path, Ext, Id>
  background(args: { id?: Scalar } = {}): string {
    const { id = 0 } = args
    if (!this.#isReady('background')) return ''

    const baseUrl = `${this.#path}/background`

    const result = `${id}.${this.#extensionMap.background}`
    if (this.#background.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.background}`
  }

  /**
   * @param args.online a boolean to determine if the device is online or offline
   * @returns the src of the device icon
   */
  device<Online extends boolean = false>(args?: {
    online?: Online
  }): DeviceUrl<Index, Path, Ext, Online>
  device(args: { online?: boolean } = {}): string {
    const { online = false } = args
    if (!this.#isReady('device')) return ''

    return online && this.#device.has(`1.${this.#extensionMap.device}`)
      ? `${this.#path}/device/1.${this.#extensionMap.device}`
      : `${this.#path}/device/0.${this.#extensionMap.device}`
  }

  /**
   * @param args.teamId the team id of the gym, @see Rpc.Team
   * @param args.trainerCount the number of trainers in the gym
   * @param args.inBattle is the gym is in battle
   * @param args.ex is the gym an EX raid gym
   * @param args.ar is the gym AR eligible
   * @param args.power the power up level of the gym, @see Rpc.FortPowerUpLevel
   * @returns the src of the gym icon
   */
  gym<
    TeamId extends EnumVal<typeof Rpc.Team> | 0 = 0,
    TC extends TrainerCounts = 0,
    Battle extends boolean = false,
    Ex extends boolean = false,
    Ar extends boolean = false,
    Power extends boolean | EnumVal<typeof Rpc.FortPowerUpLevel> = false,
  >(args?: {
    teamId?: TeamId
    trainerCount?: TC
    inBattle?: Battle
    ex?: Ex
    ar?: Ar
    power?: Power
  }): GymUrl<Index, Path, Ext, TeamId, TC, Battle, Ex, Ar, Power>
  gym<
    TeamId extends Scalar = 0,
    TC extends Scalar = 0,
    Battle extends boolean = false,
    Ex extends boolean = false,
    Ar extends boolean = false,
    Power extends boolean | Scalar = false,
  >(args?: {
    teamId?: TeamId
    trainerCount?: TC
    inBattle?: Battle
    ex?: Ex
    ar?: Ar
    power?: Power
  }): GymUrl<Index, Path, Ext, TeamId, TC, Battle, Ex, Ar, Power>
  gym(
    args: {
      teamId?: Scalar
      trainerCount?: Scalar
      inBattle?: boolean
      ex?: boolean
      ar?: boolean
      power?: boolean | Scalar
    } = {}
  ): string {
    const {
      teamId = 0,
      trainerCount = 0,
      inBattle = false,
      ex = false,
      ar = false,
      power = false,
    } = args
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
   * @param args.gruntId the grunt id of the invasion, @see Rpc.EnumWrapper.InvasionCharacter
   * @param args.confirmed if the invasion is confirmed - used for giovanni/decoy images
   * @returns the src of the invasion icon
   */
  invasion<
    GruntId extends EnumVal<typeof Rpc.EnumWrapper.InvasionCharacter> | 0 = 0,
    Confirmed extends boolean = false,
  >(args?: {
    gruntId?: GruntId
    confirmed?: Confirmed
  }): InvasionUrl<Index, Path, Ext, GruntId, Confirmed>
  invasion<
    GruntId extends Scalar = 0,
    Confirmed extends boolean = false,
  >(args?: {
    gruntId?: GruntId
    confirmed?: Confirmed
  }): InvasionUrl<Index, Path, Ext, GruntId, Confirmed>
  invasion(args: { gruntId?: Scalar; confirmed?: boolean } = {}): string {
    const { gruntId = 0, confirmed = false } = args
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
   * @param args.fileName the filename without the extension
   * @returns the src of the misc icon
   */
  misc<FileName extends Scalar = 0>(args?: {
    fileName?: FileName
  }): MiscUrl<Index, Path, Ext, FileName>
  misc(args: { fileName?: Scalar } = {}): string {
    const { fileName = 0 } = args
    if (!this.#isReady('misc')) return ''

    const baseUrl = `${this.#path}/misc`

    if (this.#misc.has(`${fileName}.${this.#extensionMap.misc}`)) {
      return `${baseUrl}/${fileName}.${this.#extensionMap.misc}`
    }
    return `${baseUrl}/0.${this.#extensionMap.misc}`
  }

  /**
   * @param args.typeId the pokemon type ID that is nesting, @see Rpc.HoloPokemonType
   * @returns the src of the nest icon
   */
  nest<TypeId extends EnumVal<typeof Rpc.HoloPokemonType> | 0 = 0>(args?: {
    typeId?: TypeId
  }): NestUrl<Index, Path, Ext, TypeId>
  nest<TypeId extends Scalar = 0>(args?: {
    typeId?: TypeId
  }): NestUrl<Index, Path, Ext, TypeId>
  nest(args: { typeId?: Scalar } = {}): string {
    const { typeId = 0 } = args
    if (!this.#isReady('nest')) return ''

    const baseUrl = `${this.#path}/nest`

    const result = `${typeId}.${this.#extensionMap.nest}`
    if (this.#nest.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.nest}`
  }

  /**
   * @param args.pokemonId the pokemon ID
   * @param args.evolution the [mega] evolution ID of the pokemon, @see Rpc.HoloTemporaryEvolutionId
   * @param args.form the form ID of the pokemon, @see Rpc.PokemonDisplayProto.Form
   * @param args.costume the costume ID of the pokemon, @see Rpc.PokemonDisplayProto.Costume
   * @param args.gender the gender ID of the pokemon, @see Rpc.PokemonDisplayProto.PokemonGender
   * @param args.alignment the alignment ID of the pokemon, such as shadow or purified, @see Rpc.PokemonDisplayProto.Alignment
   * @param args.bread the bread mode of the pokemon, @see Rpc.BreadModeEnum.Modifier
   * @param args.shiny if the pokemon is shiny
   * @returns the src of the pokemon icon
   */
  pokemon<
    Id extends EnumVal<typeof Rpc.HoloPokemonId> | 0 = 0,
    Evolution extends EnumVal<typeof Rpc.HoloTemporaryEvolutionId> | 0 = 0,
    Form extends EnumVal<typeof Rpc.PokemonDisplayProto.Form> | 0 = 0,
    Costume extends EnumVal<typeof Rpc.PokemonDisplayProto.Costume> | 0 = 0,
    Gender extends EnumVal<typeof Rpc.PokemonDisplayProto.Gender> | 0 = 0,
    Alignment extends EnumVal<typeof Rpc.PokemonDisplayProto.Alignment> | 0 = 0,
    Bread extends EnumVal<typeof Rpc.BreadModeEnum.Modifier> | 0 = 0,
    Shiny extends boolean = false,
  >(args?: {
    pokemonId?: Id
    evolution?: Evolution
    form?: Form
    costume?: Costume
    gender?: Gender
    alignment?: Alignment
    bread?: Bread
    shiny?: Shiny
  }): PokemonUrl<
    Index,
    Path,
    Ext,
    Id,
    Evolution,
    Form,
    Costume,
    Gender,
    Alignment,
    Bread,
    Shiny
  >
  pokemon<
    Id extends Scalar = 0,
    Evolution extends Scalar = 0,
    Form extends Scalar = 0,
    Costume extends Scalar = 0,
    Gender extends Scalar = 0,
    Alignment extends Scalar = 0,
    Bread extends Scalar = 0,
    Shiny extends boolean = false,
  >(args?: {
    pokemonId?: Id
    evolution?: Evolution
    form?: Form
    costume?: Costume
    gender?: Gender
    alignment?: Alignment
    bread?: Bread
    shiny?: Shiny
  }): PokemonUrl<
    Index,
    Path,
    Ext,
    Id,
    Evolution,
    Form,
    Costume,
    Gender,
    Alignment,
    Bread,
    Shiny
  >
  pokemon(
    args: {
      pokemonId?: Scalar
      evolution?: Scalar
      form?: Scalar
      costume?: Scalar
      gender?: Scalar
      alignment?: Scalar
      bread?: Scalar
      shiny?: boolean
    } = {}
  ): string {
    const {
      pokemonId = 0,
      evolution = 0,
      form = 0,
      costume = 0,
      gender = 0,
      alignment = 0,
      bread = 0,
      shiny = false,
    } = args
    if (!this.#isReady('pokemon')) return ''

    const baseUrl = `${this.#path}/pokemon`

    const breadSuffixes = bread ? [`_b${bread}`, ''] : ['']
    const evolutionSuffixes = evolution ? [`_e${evolution}`, ''] : ['']
    const formSuffixes = form ? [`_f${form}`, ''] : ['']
    const costumeSuffixes = costume ? [`_c${costume}`, ''] : ['']
    const genderSuffixes = gender ? [`_g${gender}`, ''] : ['']
    const alignmentSuffixes = alignment ? [`_a${alignment}`, ''] : ['']
    const shinySuffixes = shiny ? ['_s', ''] : ['']

    for (let b = 0; b < breadSuffixes.length; b += 1) {
      for (let e = 0; e < evolutionSuffixes.length; e += 1) {
        for (let f = 0; f < formSuffixes.length; f += 1) {
          for (let c = 0; c < costumeSuffixes.length; c += 1) {
            for (let g = 0; g < genderSuffixes.length; g += 1) {
              for (let a = 0; a < alignmentSuffixes.length; a += 1) {
                for (let s = 0; s < shinySuffixes.length; s += 1) {
                  const result = `${pokemonId}${breadSuffixes[b]}${
                    evolutionSuffixes[e]
                  }${formSuffixes[f]}${costumeSuffixes[c]}${genderSuffixes[g]}${
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
    }
    return `${baseUrl}/0.${this.#extensionMap.pokemon}`
  }

  /**
   * @param args.lureId the ID of the lure at the pokestop, 0 for no lure, @see Rpc.TROY_DISK values in Rpc.Item
   * @param args.displayTypeId the display ID of the pokestop, 0 for no display, @see Rpc.IncidentDisplayType
   * @param args.questActive does the pokestop currently have an active quest
   * @param args.ar is the pokestop AR eligible
   * @param args.power the power up level of the pokestop, 0 for no power up, @see Rpc.FortPowerUpLevel
   * @returns the src of the pokestop icon
   */
  pokestop<
    LureId extends LureIDs = 0,
    DisplayTypeId extends
      | boolean
      | EnumVal<typeof Rpc.IncidentDisplayType> = false,
    QuestActive extends boolean | Scalar = false,
    Ar extends boolean = false,
    Power extends boolean | EnumVal<typeof Rpc.FortPowerUpLevel> = false,
  >(args?: {
    lureId?: LureId
    displayTypeId?: DisplayTypeId
    questActive?: QuestActive
    ar?: Ar
    power?: Power
  }): PokestopUrl<Index, Path, Ext, LureId, DisplayTypeId, QuestActive, Ar, Power>
  pokestop<
    LureId extends Scalar = 0,
    DisplayTypeId extends boolean | Scalar = false,
    QuestActive extends boolean | Scalar = false,
    Ar extends boolean = false,
    Power extends boolean | Scalar = false,
  >(args?: {
    lureId?: LureId
    displayTypeId?: DisplayTypeId
    questActive?: QuestActive
    ar?: Ar
    power?: Power
  }): PokestopUrl<Index, Path, Ext, LureId, DisplayTypeId, QuestActive, Ar, Power>
  pokestop(
    args: {
      lureId?: Scalar
      displayTypeId?: boolean | Scalar
      questActive?: boolean | Scalar
      ar?: boolean
      power?: boolean | Scalar
    } = {}
  ): string {
    const {
      lureId = 0,
      displayTypeId = false,
      questActive = false,
      ar = false,
      power = false,
    } = args
    if (!this.#isReady('pokestop')) return ''

    const baseUrl = `${this.#path}/pokestop`

    const displaySuffixes = this.#evalPossiblyEmptyFlag('_i', displayTypeId)
    const questSuffixes = this.#evalPossiblyEmptyFlag('_q', questActive)
    const arSuffixes = ar ? ['_ar', ''] : ['']
    const powerUpSuffixes = this.#evalPossiblyEmptyFlag('_p', power)

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
   * @param args.level the level of the raid egg, @see Rpc.RaidLevel
   * @param args.hatched if the raid egg has hatched
   * @param args.ex if the raid egg is an EX raid egg
   * @returns the src of the raid egg icon
   */
  raidEgg<
    Level extends EnumVal<typeof Rpc.RaidLevel> | 0 = 0,
    Hatched extends boolean = false,
    Ex extends boolean = false,
  >(args?: {
    level?: Level
    hatched?: Hatched
    ex?: Ex
  }): RaidEggUrl<Index, Path, Ext, Level, Hatched, Ex>
  raidEgg<
    Level extends Scalar = 0,
    Hatched extends boolean = false,
    Ex extends boolean = false,
  >(args?: {
    level?: Level
    hatched?: Hatched
    ex?: Ex
  }): RaidEggUrl<Index, Path, Ext, Level, Hatched, Ex>
  raidEgg(
    args: { level?: Scalar; hatched?: boolean; ex?: boolean } = {}
  ): string {
    const { level = 0, hatched = false, ex = false } = args
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
   * @param args.questRewardType the type of quest reward, @see Rpc.QuestRewardProto.Type
   * @param args.rewardId the ID or the amount of the reward. This depends on the complexity of the reward type. For example, item rewards use the item ID, while stardust rewards use the amount of stardust. Best to check uicons repository to see which of them use the `_a` flag
   * @param args.amount the amount of the reward
   * @param args.evolution the temporary evolution ID of the reward Pokemon, @see Rpc.HoloTemporaryEvolutionId
   * @returns the src of the quest reward icon
   */
  reward<
    QT extends RewardTypeKeys = 'unset',
    Id extends Scalar = 0,
    Amount extends Scalar = 0,
    Evolution extends EnumVal<typeof Rpc.HoloTemporaryEvolutionId> | 0 = 0,
  >(args?: {
    questRewardType?: QT
    rewardId?: Id
    amount?: Amount
    evolution?: Evolution
  }): RewardUrl<Index, Path, Ext, QT, Id, Amount, Evolution>
  reward<
    QT extends RewardTypeKeys = 'unset',
    Id extends Scalar = 0,
    Amount extends Scalar = 0,
    Evolution extends Scalar = 0,
  >(args?: {
    questRewardType?: QT
    rewardId?: Id
    amount?: Amount
    evolution?: Evolution
  }): RewardUrl<Index, Path, Ext, QT, Id, Amount, Evolution>
  reward(
    args: {
      questRewardType?: RewardTypeKeys
      rewardId?: Scalar
      amount?: Scalar
      evolution?: Scalar
    } = {}
  ): string {
    const {
      questRewardType = 'unset',
      rewardId = 0,
      amount = 0,
      evolution = 0,
    } = args
    if (!this.#isReady('reward')) return ''

    const baseUrl = `${this.#path}/reward/${questRewardType}`
    const rewardSet = this.#reward[questRewardType]
    if (!rewardSet) {
      this.#warn('Invalid quest reward type,', questRewardType)
      return this.misc()
    }

    const amountSafe = typeof amount === 'number' ? amount : +amount
    const amountSuffixes =
      Number.isInteger(amountSafe) && amountSafe > 1
        ? [`_a${amount}`, '']
        : ['']
    const evolutionSuffixes = evolution ? [`_e${evolution}`, ''] : ['']
    const safeId = +rewardId || amountSafe || 0

    for (let e = 0; e < evolutionSuffixes.length; e += 1) {
      for (let a = 0; a < amountSuffixes.length; a += 1) {
        const result = `${safeId}${evolutionSuffixes[e]}${amountSuffixes[a]}.${
          this.#extensionMap.reward[questRewardType]
        }`
        if (rewardSet.has(result)) {
          return `${baseUrl}/${result}`
        }
      }
    }
    return `${baseUrl}/0.${this.#extensionMap.reward[questRewardType]}`
  }

  /**
   * @param args.hasTth if the spawnpoint has a confirmed timer or not
   * @returns the src of the spawnpoint icon
   */
  spawnpoint<HasTth extends boolean = false>(args?: {
    hasTth?: HasTth
  }): SpawnpointUrl<Index, Path, Ext, HasTth>
  spawnpoint(args: { hasTth?: boolean } = {}): string {
    const { hasTth = false } = args
    if (!this.#isReady('spawnpoint')) return ''

    return hasTth && this.#spawnpoint.has(`1.${this.#extensionMap.spawnpoint}`)
      ? `${this.#path}/spawnpoint/1.${this.#extensionMap.spawnpoint}`
      : `${this.#path}/spawnpoint/0.${this.#extensionMap.spawnpoint}`
  }

  /**
   * @param args.active if the station is active or not
   * @returns the src of the station icon
   */
  station<Active extends boolean = false>(args?: {
    active?: Active
  }): StationUrl<Index, Path, Ext, Active>
  station(args: { active?: boolean } = {}): string {
    const { active = false } = args
    if (!this.#isReady('station')) return ''

    return `${this.#path}/station/${active ? 1 : 0}.${
      this.#extensionMap.station
    }`
  }

  /**
   * @param args.tappableType the tappable type identifier
   * @returns the src of the tappable icon, falling back to the reward item icon when tappable assets are unavailable
   */
  tappable<T extends Scalar = 'TAPPABLE_TYPE_POKEBALL'>(args?: {
    tappableType?: T
  }): TappableUrl<Index, Path, Ext, T>
  tappable(args: { tappableType?: Scalar } = {}): string {
    const { tappableType } = args
    if (!this.#isReady('tappable')) {
      return this.reward({ questRewardType: 'item', rewardId: 1 })
    }

    const extension = this.#extensionMap.tappable
    if (!extension) {
      return this.reward({ questRewardType: 'item', rewardId: 1 })
    }

    const baseUrl = `${this.#path}/tappable`
    const tryCandidate = (candidate: string) => {
      const fileName = `${candidate}.${extension}`
      return this.#tappable.has(fileName) ? `${baseUrl}/${fileName}` : undefined
    }

    const typeKey = tappableType?.toString() ?? 'TAPPABLE_TYPE_POKEBALL'
    const primary = tryCandidate(typeKey)
    if (primary) {
      return primary
    }

    const fallback = tryCandidate('TAPPABLE_TYPE_POKEBALL')
    if (fallback) {
      return fallback
    }

    return this.reward({ questRewardType: 'item', rewardId: 1 })
  }

  /**
   * @param args.teamId the team ID, @see Rpc.Team
   * @returns the src of the team icon
   */
  team<TeamId extends EnumVal<typeof Rpc.Team> | 0 = 0>(args?: {
    teamId?: TeamId
  }): TeamUrl<Index, Path, Ext, TeamId>
  team<TeamId extends Scalar = 0>(args?: {
    teamId?: TeamId
  }): TeamUrl<Index, Path, Ext, TeamId>
  team(args: { teamId?: Scalar } = {}): string {
    const { teamId = 0 } = args
    if (!this.#isReady('team')) return ''

    const baseUrl = `${this.#path}/team`

    const result = `${teamId}.${this.#extensionMap.team}`
    if (this.#team.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.team}`
  }

  /**
   * @param args.typeId the pokemon type ID, @see Rpc.HoloPokemonType
   * @returns the src of the pokemon type icon
   */
  type<TypeId extends EnumVal<typeof Rpc.HoloPokemonType> | 0 = 0>(args?: {
    typeId?: TypeId
  }): TypeUrl<Index, Path, Ext, TypeId>
  type<TypeId extends Scalar = 0>(args?: {
    typeId?: TypeId
  }): TypeUrl<Index, Path, Ext, TypeId>
  type(args: { typeId?: Scalar } = {}): string {
    const { typeId = 0 } = args
    if (!this.#isReady('type')) return ''

    const baseUrl = `${this.#path}/type`

    const result = `${typeId}.${this.#extensionMap.type}`
    if (this.#type.has(result)) {
      return `${baseUrl}/${result}`
    }
    return `${baseUrl}/0.${this.#extensionMap.type}`
  }

  /**
   * @param args.weatherId the weather ID, @see Rpc.GameplayWeatherProto.WeatherCondition
   * @param args.severityLevel the severity of the weather, @see Rpc.InternalWeatherAlertProto.Severity
   * @param args.timeOfDay the time of day, @see TimeOfDay
   * @returns the src of the weather icon
   */
  weather<
    WeatherId extends
      | EnumVal<typeof Rpc.GameplayWeatherProto.WeatherCondition>
      | 0 = 0,
    Severity extends
      | EnumVal<typeof Rpc.InternalWeatherAlertProto.Severity>
      | 0 = 0,
    Time extends TimeOfDay = 'day',
  >(args?: {
    weatherId?: WeatherId
    severityLevel?: Severity
    timeOfDay?: Time
  }): WeatherUrl<Index, Path, Ext, WeatherId, Severity, Time>
  weather<
    WeatherId extends Scalar = 0,
    Severity extends Scalar = 0,
    Time extends string = 'day',
  >(args?: {
    weatherId?: WeatherId
    severityLevel?: Severity
    timeOfDay?: Time
  }): WeatherUrl<Index, Path, Ext, WeatherId, Severity, Time>
  weather(
    args: { weatherId?: Scalar; severityLevel?: Scalar; timeOfDay?: string } = {}
  ): string {
    const { weatherId = 0, severityLevel = 0, timeOfDay = 'day' } = args
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
