import type { Rpc } from '@na-ji/pogo-protos'
import type {
  UiconsIndex,
  EnumVal,
  RewardTypeKeys,
  TrainerCounts,
  LureIDs,
  TimeOfDay,
  Options,
  Ext,
  ExtensionMap,
  Zero,
  One,
  Scalar,
  FileUrl,
  Paths,
} from './types/general.js'
import type {
  GymArgs,
  GymNameFromArgs,
  InvasionNameFromArgs,
  PokemonArgs,
  PokestopArgs,
  PokestopNameFromArgs,
  RaidEggArgs,
  RaidEggNameFromArgs,
  RewardArgs,
  RewardUrlFromArgs,
  TappableUrlFromArgs,
  WeatherArgs,
  WeatherNameFromArgs,
} from './types/index.js'

const ZERO: Zero = 0
const ONE: One = 1
type NestedExtensionCategory = 'raid' | 'reward'
type FlatExtensionCategory = Exclude<
  keyof ExtensionMap<UiconsIndex, string>,
  NestedExtensionCategory
>

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
export class UICONS<TPath extends string = string, TExt extends string = Ext> {
  #path: TPath
  #extensionMap: ExtensionMap<UiconsIndex, TExt>
  #label: string
  #fallback: Zero = ZERO

  #background: Set<UiconsIndex['background'][number]>
  #device: Set<UiconsIndex['device'][number]>
  #gym: Set<UiconsIndex['gym'][number]>
  #invasion: Set<UiconsIndex['invasion'][number]>
  #misc: Set<UiconsIndex['misc'][number]>
  #nest: Set<UiconsIndex['nest'][number]>
  #pokemon: Set<UiconsIndex['pokemon'][number]>
  #pokestop: Set<UiconsIndex['pokestop'][number]>
  #tappable: Set<UiconsIndex['tappable'][number]>
  #raid: { egg: Set<UiconsIndex['raid']['egg'][number]> }
  #reward: Record<string, Set<string>>
  #spawnpoint: Set<UiconsIndex['spawnpoint'][number]>
  #station: Set<UiconsIndex['station'][number]>
  #team: Set<UiconsIndex['team'][number]>
  #type: Set<UiconsIndex['type'][number]>
  #weather: Set<UiconsIndex['weather'][number]>

  /**
   * @param options The options object for the UICONS instance
   */
  constructor(options: Options<UiconsIndex, TPath, TExt>)
  /**
   * @param path The base URL of the UICONS repository
   */
  constructor(path: TPath)
  constructor(optionsOrPath: TPath | Options<UiconsIndex, TPath, TExt>) {
    const { path, label, data } =
      typeof optionsOrPath === 'string'
        ? { path: optionsOrPath }
        : optionsOrPath
    this.#path = path.endsWith('/') ? (path.slice(0, -1) as TPath) : path
    this.#label = label ?? this.#path
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

  #buildExtensions(json: UiconsIndex): ExtensionMap<UiconsIndex, TExt> {
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

  #extension<T extends FlatExtensionCategory>(
    category: T
  ): ExtensionMap<UiconsIndex, TExt>[T]
  #extension<
    T extends NestedExtensionCategory,
    U extends keyof ExtensionMap<UiconsIndex, TExt>[T],
  >(category: T, key: U): ExtensionMap<UiconsIndex, TExt>[T][U]
  #extension<
    T extends keyof ExtensionMap<UiconsIndex, TExt>,
    U extends keyof ExtensionMap<UiconsIndex, TExt>[T],
  >(category: T, key?: U) {
    const ext = this.#extensionMap[category]
    if (ext === undefined || typeof ext === 'string') {
      return ext
    }
    if (key === undefined) {
      throw new Error(`Sub-folder key is required for ${String(category)}`)
    }
    return ext[key]
  }

  #isIndexData(value: unknown): value is UiconsIndex {
    return !!value && typeof value === 'object' && !Array.isArray(value)
  }

  #isReady(key?: keyof UiconsIndex) {
    if (!this.#extensionMap) {
      throw new Error('UICONS has not been initialized')
    }
    if (key && !this.#extensionMap[key]) {
      throw new Error(`Folder: ${key} was not found for ${this.#path}`)
    }
  }

  #evalPossiblyEmptyFlag(flag: string, value: boolean | string | number) {
    if (typeof value === 'boolean') return value ? [flag, ''] : ['']

    const numericValue = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numericValue) || numericValue === 0) {
      return [flag, '']
    }
    return [`${flag}${numericValue}`, flag, '']
  }

  /**
   * Initialize this instance asynchronously by fetching the `index.json` file
   * from the UICONS repository path provided in the constructor.
   * @returns The initialized UICONS instance.
   */
  async remoteInit(): Promise<this> {
    const data = await fetch(`${this.#path}/index.json`)
    if (!data.ok) {
      throw new Error(
        `Failed to fetch ${this.#path} ${data.status} ${data.statusText}`
      )
    }
    const indexFile = await data.json()
    if (!this.#isIndexData(indexFile)) {
      throw new Error(`Invalid index.json payload from ${this.#path}`)
    }
    return this.init(indexFile)
  }

  /**
   * Initialize this instance synchronously using a previously fetched `index.json` payload.
   * @param data The index.json file from the UICONS repository
   * @returns The initialized UICONS instance.
   */
  init(data: UiconsIndex): this {
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
  has(location: Paths<UiconsIndex>, fileName: Scalar): boolean {
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
   * @param id the background ID
   * @returns the src of the background icon
   */
  background(): FileUrl<TPath, 'background', TExt, Zero>
  background<ID extends EnumVal<typeof Rpc.EncounterOutProto.Background>>(
    id: ID
  ): FileUrl<TPath, 'background', TExt, ID | Zero>
  background<ID extends Scalar>(
    id: ID
  ): FileUrl<TPath, 'background', TExt, ID | Zero>
  background(id = this.#fallback): FileUrl<TPath, 'background', TExt> {
    const folder = 'background'

    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const result = `${id}.${ext}` as const

    if (this.#background.has(result)) {
      return `${base}/${result}` as const
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param online a boolean to determine if the device is online or offline
   * @returns the src of the device icon
   */
  device(online: true): FileUrl<TPath, 'device', TExt, One | Zero>
  device(online?: false): FileUrl<TPath, 'device', TExt, Zero>
  device(online = false) {
    const folder = 'device'

    this.#isReady(folder)

    const ext = this.#extension(folder)
    const file = online ? ONE : this.#fallback

    return online && this.#device.has(`${file}.${ext}`)
      ? `${this.#path}/${folder}/${file}.${ext}`
      : `${this.#path}/${folder}/${file}.${ext}`
  }

  /**
   * @param teamId the team id of the gym, see {@link Rpc.Team}
   * @param trainerCount the number of trainers in the gym
   * @param inBattle is the gym is in battle
   * @param ex is the gym an EX raid gym
   * @param ar is the gym AR eligible
   * @param power the power up level of the gym, see {@link Rpc.FortPowerUpLevel}
   * @returns the src of the gym icon
   */
  gym<
    TeamId extends EnumVal<typeof Rpc.Team> | Zero = Zero,
    TC extends TrainerCounts = Zero,
    Battle extends boolean = false,
    Ex extends boolean = false,
    Ar extends boolean = false,
    Power extends boolean | EnumVal<typeof Rpc.FortPowerUpLevel> = false,
  >(
    teamId?: TeamId,
    trainerCount?: TC,
    inBattle?: Battle,
    ex?: Ex,
    ar?: Ar,
    power?: Power
  ): FileUrl<
    TPath,
    'gym',
    TExt,
    GymNameFromArgs<[TeamId, TC, Battle, Ex, Ar, Power]>
  >
  gym(
    teamId?: Scalar,
    trainerCount?: Scalar,
    inBattle?: boolean,
    ex?: boolean,
    ar?: boolean,
    power?: boolean | Scalar
  ): FileUrl<TPath, 'gym', TExt>
  gym(...args: GymArgs): FileUrl<TPath, 'gym', TExt> {
    const [
      teamId = this.#fallback,
      trainerCount = this.#fallback,
      inBattle = false,
      ex = false,
      ar = false,
      power = false,
    ] = args
    const folder = 'gym'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)

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
              }${exSuffixes[e]}${arSuffixes[a]}${powerUpSuffixes[p]}.${ext}` as const
              if (this.#gym.has(result)) {
                return `${base}/${result}` as const
              }
            }
          }
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param gruntId the grunt id of the invasion, see {@link Rpc.EnumWrapper.InvasionCharacter}
   * @param confirmed if the invasion is confirmed - used for giovanni/decoy images
   * @returns the src of the invasion icon
   */
  invasion<
    GruntId extends EnumVal<typeof Rpc.EnumWrapper.InvasionCharacter> | Zero =
      Zero,
    Confirmed extends boolean = false,
  >(
    gruntId?: GruntId,
    confirmed?: Confirmed
  ): FileUrl<
    TPath,
    'invasion',
    TExt,
    InvasionNameFromArgs<[GruntId, Confirmed]>
  >
  invasion(
    gruntId?: Scalar,
    confirmed?: boolean
  ): FileUrl<TPath, 'invasion', TExt>
  invasion(
    gruntId: Scalar = this.#fallback,
    confirmed = false
  ): FileUrl<TPath, 'invasion', TExt> {
    const folder = 'invasion'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)

    const confirmedSuffixes = confirmed
      ? ([''] as const)
      : (['_u', ''] as const)
    for (let c = 0; c < confirmedSuffixes.length; c += 1) {
      const result = `${gruntId}${confirmedSuffixes[c]}.${ext}` as const
      if (this.#invasion.has(result)) {
        return `${base}/${result}` as const
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param fileName the filename without the extension
   * @returns the src of the misc icon
   */
  misc(): FileUrl<TPath, 'misc', TExt, Zero>
  misc<FileName extends Scalar>(
    fileName: FileName
  ): FileUrl<TPath, 'misc', TExt, FileName | Zero>
  misc(fileName: Scalar = this.#fallback): FileUrl<TPath, 'misc', TExt> {
    const folder = 'misc'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const result = `${fileName}.${ext}` as const

    if (this.#misc.has(result)) {
      return `${base}/${result}` as const
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param typeId the pokemon type ID that is nesting, see {@link Rpc.HoloPokemonType}
   * @returns the src of the nest icon
   */
  nest(): FileUrl<TPath, 'nest', TExt, Zero>
  nest<TypeId extends Scalar>(
    typeId: TypeId
  ): FileUrl<TPath, 'nest', TExt, TypeId | Zero>
  nest(typeId: Scalar = this.#fallback): FileUrl<TPath, 'nest', TExt> {
    const folder = 'nest'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const result = `${typeId}.${ext}` as const
    if (this.#nest.has(result)) {
      return `${base}/${result}` as const
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param pokemonId the pokemon ID
   * @param evolution the [mega] evolution ID of the pokemon, see {@link Rpc.HoloTemporaryEvolutionId}
   * @param form the form ID of the pokemon, see {@link Rpc.PokemonDisplayProto.Form}
   * @param costume the costume ID of the pokemon, see {@link Rpc.PokemonDisplayProto.Costume}
   * @param gender the gender ID of the pokemon, see {@link Rpc.PokemonDisplayProto.Gender}
   * @param alignment the alignment ID of the pokemon, such as shadow or purified, see {@link Rpc.PokemonDisplayProto.Alignment}
   * @param bread the bread mode of the pokemon, see {@link Rpc.BreadModeEnum.Modifier}
   * @param shiny if the pokemon is shiny
   * @returns the src of the pokemon icon
   */
  pokemon<
    PokemonId extends EnumVal<typeof Rpc.HoloPokemonId> | Zero = Zero,
    Evolution extends EnumVal<typeof Rpc.HoloTemporaryEvolutionId> | Zero =
      Zero,
    Form extends EnumVal<typeof Rpc.PokemonDisplayProto.Form> | Zero = Zero,
    Costume extends EnumVal<typeof Rpc.PokemonDisplayProto.Costume> | Zero =
      Zero,
    Gender extends EnumVal<typeof Rpc.PokemonDisplayProto.Gender> | Zero = Zero,
    Alignment extends EnumVal<typeof Rpc.PokemonDisplayProto.Alignment> | Zero =
      Zero,
    Bread extends EnumVal<typeof Rpc.BreadModeEnum.Modifier> | Zero = Zero,
    Shiny extends boolean = false,
  >(
    pokemonId?: PokemonId,
    evolution?: Evolution,
    form?: Form,
    costume?: Costume,
    gender?: Gender,
    alignment?: Alignment,
    bread?: Bread,
    shiny?: Shiny
  ): FileUrl<TPath, 'pokemon', TExt>
  pokemon<
    PokemonId extends Scalar = Zero,
    Evolution extends Scalar = Zero,
    Form extends Scalar = Zero,
    Costume extends Scalar = Zero,
    Gender extends Scalar = Zero,
    Alignment extends Scalar = Zero,
    Bread extends Scalar = Zero,
    Shiny extends boolean = false,
  >(
    pokemonId?: PokemonId,
    evolution?: Evolution,
    form?: Form,
    costume?: Costume,
    gender?: Gender,
    alignment?: Alignment,
    bread?: Bread,
    shiny?: Shiny
  ): FileUrl<TPath, 'pokemon', TExt>
  pokemon(...args: PokemonArgs): FileUrl<TPath, 'pokemon', TExt> {
    const [
      pokemonId = this.#fallback,
      evolution = this.#fallback,
      form = this.#fallback,
      costume = this.#fallback,
      gender = this.#fallback,
      alignment = this.#fallback,
      bread = this.#fallback,
      shiny = false,
    ] = args
    const folder = 'pokemon'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)

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
                  }${shinySuffixes[s]}.${ext}` as const
                  if (this.#pokemon.has(result)) {
                    return `${base}/${result}` as const
                  }
                }
              }
            }
          }
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param lureId the ID of the lure at the pokestop, 0 for no lure, see {@link Rpc.Item} `ITEM_TROY_DISK*` values
   * @param displayTypeId the display ID of the pokestop, 0 for no display, see {@link Rpc.IncidentDisplayType}
   * @param questActive does the pokestop currently have an active quest
   * @param ar is the pokestop AR eligible
   * @param power the power up level of the pokestop, 0 for no power up, see {@link Rpc.FortPowerUpLevel}
   * @returns the src of the pokestop icon
   */
  pokestop<
    LureId extends LureIDs = Zero,
    DisplayTypeId extends boolean | EnumVal<typeof Rpc.IncidentDisplayType> =
      false,
    QuestActive extends boolean = false,
    Ar extends boolean = false,
    Power extends boolean | EnumVal<typeof Rpc.FortPowerUpLevel> = false,
  >(
    lureId?: LureId,
    displayTypeId?: DisplayTypeId,
    questActive?: QuestActive,
    ar?: Ar,
    power?: Power
  ): FileUrl<
    TPath,
    'pokestop',
    TExt,
    PokestopNameFromArgs<[LureId, DisplayTypeId, QuestActive, Ar, Power]>
  >
  pokestop<
    LureId extends Scalar = Zero,
    DisplayTypeId extends boolean | Scalar = false,
    QuestActive extends boolean | Scalar = false,
    Ar extends boolean = false,
    Power extends boolean | Scalar = false,
  >(
    lureId?: LureId,
    displayTypeId?: DisplayTypeId,
    questActive?: QuestActive,
    ar?: Ar,
    power?: Power
  ): FileUrl<
    TPath,
    'pokestop',
    TExt,
    PokestopNameFromArgs<[LureId, DisplayTypeId, QuestActive, Ar, Power]>
  >
  pokestop(...args: PokestopArgs): FileUrl<TPath, 'pokestop', TExt> {
    const [
      lureId = this.#fallback,
      displayTypeId = false,
      questActive = false,
      ar = false,
      power = false,
    ] = args
    const folder = 'pokestop'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)

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
            }${powerUpSuffixes[p]}.${ext}` as const
            if (this.#pokestop.has(result)) {
              return `${base}/${result}` as const
            }
          }
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param level the level of the raid egg, see {@link Rpc.RaidLevel}
   * @param hatched if the raid egg has hatched
   * @param ex if the raid egg is an EX raid egg
   * @returns the src of the raid egg icon
   */
  raidEgg<
    Level extends EnumVal<typeof Rpc.RaidLevel> | Zero = Zero,
    Hatched extends boolean = false,
    Ex extends boolean = false,
  >(
    level?: Level,
    hatched?: Hatched,
    ex?: Ex
  ): FileUrl<TPath, 'raid/egg', TExt, RaidEggNameFromArgs<[Level, Hatched, Ex]>>
  raidEgg<
    Level extends Scalar = Zero,
    Hatched extends boolean = false,
    Ex extends boolean = false,
  >(
    level?: Level,
    hatched?: Hatched,
    ex?: Ex
  ): FileUrl<TPath, 'raid/egg', TExt, RaidEggNameFromArgs<[Level, Hatched, Ex]>>
  raidEgg(...args: RaidEggArgs): FileUrl<TPath, 'raid/egg', TExt> {
    const [level = this.#fallback, hatched = false, ex = false] = args
    this.#isReady('raid')

    const folder = 'raid/egg'
    const base = `${this.#path}/${folder}` as const
    const raidExtension = this.#extension('raid', 'egg')
    if (!raidExtension) {
      throw new Error(`Folder: ${folder} was not found for ${this.#path}`)
    }
    const ext = raidExtension as TExt

    const hatchedSuffixes = hatched ? ['_h', ''] : ['']
    const exSuffixes = ex ? ['_ex', ''] : ['']
    for (let h = 0; h < hatchedSuffixes.length; h += 1) {
      for (let e = 0; e < exSuffixes.length; e += 1) {
        const result =
          `${level}${hatchedSuffixes[h]}${exSuffixes[e]}.${ext}` as const
        if (this.#raid.egg.has(result)) {
          return `${base}/${result}` as const
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param questRewardType the type of quest reward, see {@link Rpc.QuestRewardProto.Type}
   * @param rewardId the ID or the amount of the reward. This depends on the complexity of the reward type. For example, item rewards use the item ID, while stardust rewards use the amount of stardust. Best to check uicons repository to see which of them use the `_a` flag
   * @param amount the amount of the reward
   * @returns the src of the quest reward icon
   */
  reward<Args extends RewardArgs>(
    ...args: Args
  ): RewardUrlFromArgs<TPath, TExt, Args> {
    const [questRewardType, rewardIdOrAmount, amount] = args
    const safeQuestRewardType = questRewardType ?? ('unset' as RewardTypeKeys)
    const safeRewardIdOrAmount = rewardIdOrAmount ?? this.#fallback
    const safeAmount = amount ?? this.#fallback
    this.#isReady()

    const folder = `reward/${safeQuestRewardType}` as const
    const base = `${this.#path}/${folder}` as const
    const rewardSet = this.#reward[safeQuestRewardType]
    const rewardExtension = this.#extension('reward', safeQuestRewardType)
    if (!rewardSet || !rewardExtension) {
      this.#warn('Invalid quest reward type,', safeQuestRewardType)
      return this.misc() as RewardUrlFromArgs<TPath, TExt, Args>
    }
    const ext = rewardExtension as TExt

    const amountSafe = typeof safeAmount === 'number' ? safeAmount : +safeAmount
    const amountSuffixes =
      Number.isInteger(amountSafe) && amountSafe > 1
        ? [`_a${safeAmount}`, '']
        : ['']
    const safeId = +safeRewardIdOrAmount || amountSafe || this.#fallback

    for (let a = 0; a < amountSuffixes.length; a += 1) {
      const result = `${safeId}${amountSuffixes[a]}.${ext}` as const
      if (rewardSet.has(result)) {
        return `${base}/${result}` as RewardUrlFromArgs<TPath, TExt, Args>
      }
    }
    return `${base}/${this.#fallback}.${ext}` as RewardUrlFromArgs<
      TPath,
      TExt,
      Args
    >
  }

  /**
   * @param hasTth if the spawnpoint has a confirmed timer or not
   * @returns the src of the spawnpoint icon
   */
  spawnpoint(): FileUrl<TPath, 'spawnpoint', TExt, Zero>
  spawnpoint(hasTth: true): FileUrl<TPath, 'spawnpoint', TExt, One | Zero>
  spawnpoint(hasTth?: false): FileUrl<TPath, 'spawnpoint', TExt, Zero>
  spawnpoint(hasTth = false): FileUrl<TPath, 'spawnpoint', TExt, Zero | One> {
    const folder = 'spawnpoint'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const file = hasTth && this.#spawnpoint.has(`${ONE}.${ext}`) ? ONE : ZERO

    return `${base}/${file}.${ext}` as const
  }

  /**
   * @param active if the station is active or not
   * @returns the src of the station icon
   */
  station(): FileUrl<TPath, 'station', TExt, Zero>
  station(active: true): FileUrl<TPath, 'station', TExt, One>
  station(active?: false): FileUrl<TPath, 'station', TExt, Zero>
  station(active = false): FileUrl<TPath, 'station', TExt, Zero | One> {
    const folder = 'station'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const file = active ? ONE : ZERO

    return `${base}/${file}.${ext}` as const
  }

  /**
   * @param tappableType the tappable type identifier
   * @returns the src of the tappable icon
   */
  tappable(): TappableUrlFromArgs<TPath, TExt, []>
  tappable<TappableType extends Scalar>(
    tappableType: TappableType
  ): TappableUrlFromArgs<TPath, TExt, [TappableType]>
  tappable(
    tappableType?: Scalar
  ): TappableUrlFromArgs<TPath, TExt, [] | [Scalar]> {
    this.#isReady()

    const folder = 'tappable'
    const extension = this.#extension(folder)
    if (!extension) {
      return this.reward('item', 1) as TappableUrlFromArgs<
        TPath,
        TExt,
        [] | [Scalar]
      >
    }

    const base = `${this.#path}/${folder}` as const
    const tryCandidate = (
      candidate: string
    ): FileUrl<TPath, 'tappable', TExt, string> | undefined => {
      const fileName = `${candidate}.${extension}` as const
      return this.#tappable.has(fileName) ? `${base}/${fileName}` : undefined
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

    return this.reward('item', 1) as TappableUrlFromArgs<
      TPath,
      TExt,
      [] | [Scalar]
    >
  }

  /**
   * @param teamId the team ID, see {@link Rpc.Team}
   * @returns the src of the team icon
   */
  team(): FileUrl<TPath, 'team', TExt, Zero>
  team<TeamId extends Scalar>(
    teamId: TeamId
  ): FileUrl<TPath, 'team', TExt, TeamId | Zero>
  team(teamId: Scalar = this.#fallback): FileUrl<TPath, 'team', TExt> {
    const folder = 'team'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const result = `${teamId}.${ext}` as const
    if (this.#team.has(result)) {
      return `${base}/${result}` as const
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param typeId the pokemon type ID, see {@link Rpc.HoloPokemonType}
   * @returns the src of the pokemon type icon
   */
  type(): FileUrl<TPath, 'type', TExt, Zero>
  type<TypeId extends Scalar>(
    typeId: TypeId
  ): FileUrl<TPath, 'type', TExt, TypeId | Zero>
  type(typeId: Scalar = this.#fallback): FileUrl<TPath, 'type', TExt> {
    const folder = 'type'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const result = `${typeId}.${ext}` as const
    if (this.#type.has(result)) {
      return `${base}/${result}` as const
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }

  /**
   * @param weatherId the weather ID, see {@link Rpc.GameplayWeatherProto.WeatherCondition}
   * @param severityLevel the severity of the weather, see {@link Rpc.InternalWeatherAlertProto.Severity}
   * @param timeOfDay the time of day
   * @returns the src of the weather icon
   */
  weather<
    WeatherId extends
      | EnumVal<typeof Rpc.GameplayWeatherProto.WeatherCondition>
      | Zero = Zero,
    Severity extends
      | EnumVal<typeof Rpc.InternalWeatherAlertProto.Severity>
      | Zero = Zero,
    Time extends TimeOfDay = 'day',
  >(
    weatherId?: WeatherId,
    severityLevel?: Severity,
    timeOfDay?: Time
  ): FileUrl<
    TPath,
    'weather',
    TExt,
    WeatherNameFromArgs<[WeatherId, Severity, Time]>
  >
  weather<
    WeatherId extends Scalar = Zero,
    Severity extends Scalar = Zero,
    Time extends string = 'day',
  >(
    weatherId?: WeatherId,
    severityLevel?: Severity,
    timeOfDay?: Time
  ): FileUrl<
    TPath,
    'weather',
    TExt,
    WeatherNameFromArgs<[WeatherId, Severity, Time]>
  >
  weather(...args: WeatherArgs): FileUrl<TPath, 'weather', TExt> {
    const [
      weatherId = this.#fallback,
      severityLevel = this.#fallback,
      timeOfDay = 'day',
    ] = args
    const folder = 'weather'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)

    const severitySuffixes = severityLevel ? [`_l${severityLevel}`, ''] : ['']
    const timeSuffixes = timeOfDay === 'night' ? ['_n', ''] : ['_d', '']
    for (let s = 0; s < severitySuffixes.length; s += 1) {
      for (let t = 0; t < timeSuffixes.length; t += 1) {
        const result =
          `${weatherId}${severitySuffixes[s]}${timeSuffixes[t]}.${ext}` as const
        if (this.#weather.has(result)) {
          return `${base}/${result}` as const
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}` as const
  }
}
