import type { Rpc } from '@na-ji/pogo-protos'
import type {
  BackgroundUrl,
  DeviceUrl,
  EnumVal,
  ExtensionMap,
  GymUrl,
  HasResult,
  Hint,
  InvasionUrl,
  LureIDs,
  MiscUrl,
  NestUrl,
  Options,
  Paths,
  PokemonUrl,
  PokestopUrl,
  RaidEggUrl,
  RewardTypeKeys,
  RewardUrl,
  Scalar,
  SpawnpointUrl,
  StationUrl,
  TappableUrl,
  TeamUrl,
  TimeOfDay,
  TrainerCounts,
  TypeUrl,
  UiconsIndex,
  WeatherUrl,
} from './types.js'

const CATEGORIES = [
  'background',
  'device',
  'gym',
  'invasion',
  'misc',
  'nest',
  'pokemon',
  'pokestop',
  'tappable',
  'spawnpoint',
  'station',
  'team',
  'type',
  'weather',
] as const

/** Categories whose files live in a folder named after the category itself. */
type FlatCategory = (typeof CATEGORIES)[number]

const buildFiles = (data: UiconsIndex<readonly string[]> = {}) =>
  Object.fromEntries(
    CATEGORIES.map((category) => [category, new Set(data[category] || [])])
  ) as Record<FlatCategory, Set<string>>

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
  // set by init(); every icon method is guarded by #isReady() before use
  #extensionMap!: ExtensionMap
  #label: string

  #files: Record<FlatCategory, Set<string>> = buildFiles()
  #raid: { egg: Set<string> } = { egg: new Set() }
  #reward: { [key in RewardTypeKeys]?: Set<string> } = {}

  /**
   * @param options The options object for the UICONS instance
   */
  constructor(options: Options<Path, Ext, Index>)
  /**
   * @param path The base URL of the UICONS repository
   */
  constructor(path: Path)
  constructor(
    optionsOrPath: Path | Options<Path, Ext, Index>,
    oldLabel?: string
  ) {
    const { path, label, data } =
      typeof optionsOrPath === 'string'
        ? ({ path: optionsOrPath, label: oldLabel } as Options<
            Path,
            Ext,
            Index
          >)
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
   * Probe the cross product of suffix options against a category's file list,
   * most specific candidate first (the first dimension is the outermost
   * "loop"), returning the first file present, else the `0.{ext}` fallback.
   * This is the runtime twin of the type-level `CrossAll`/`FirstMatch` search.
   */
  #search(
    files: Set<string>,
    baseUrl: string,
    id: Scalar,
    suffixDims: string[][],
    ext: string | undefined
  ): string {
    const names = suffixDims.reduce<string[]>(
      (acc, dim) =>
        acc.flatMap((prefix) => dim.map((suffix) => prefix + suffix)),
      [`${id}`]
    )
    for (const name of names) {
      const file = `${name}.${ext}`
      if (files.has(file)) {
        return `${baseUrl}/${file}`
      }
    }
    return `${baseUrl}/0.${ext}`
  }

  /**
   * `#search` for the categories whose file set, folder name, and extension
   * all derive from the category key. `raid/egg` and `reward/{type}` have
   * nested folders and use `#search` directly.
   */
  #resolve(
    category: FlatCategory,
    id: Scalar,
    suffixDims: string[][] = []
  ): string {
    if (!this.#isReady(category)) return ''
    return this.#search(
      this.#files[category],
      `${this.#path}/${category}`,
      id,
      suffixDims,
      this.#extensionMap[category]
    )
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
    this.#files = buildFiles(data)
    this.#raid = { egg: new Set(data.raid?.egg || []) }
    this.#reward = Object.fromEntries(
      Object.entries(data.reward || {})
        .filter(([, v]) => Array.isArray(v) && v.length > 0)
        .map(([k, v]) => [k, new Set(v)])
    )
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
      case 'raid':
        return this.#raid.egg.has(`${fileName}.${this.#extensionMap.raid?.egg}`)
      case 'reward':
        return second in this.#reward
          ? !!this.#reward[second as RewardTypeKeys]?.has(
              `${fileName}.${this.#extensionMap.reward?.[second as RewardTypeKeys]}`
            )
          : false
      default:
        return first in this.#files
          ? this.#files[first as FlatCategory].has(
              `${fileName}.${this.#extensionMap[first as FlatCategory]}`
            )
          : false
    }
  }

  /**
   * @param args.id the background ID
   * @returns the src of the background icon
   */
  background<Id extends Scalar = 0>(args?: {
    id?: Hint<Id, EnumVal<typeof Rpc.EncounterOutProto.Background>>
  }): BackgroundUrl<Index, Path, Ext, Id>
  background(args: { id?: Scalar } = {}): string {
    const { id = 0 } = args
    return this.#resolve('background', id)
  }

  /**
   * @param args.online a boolean to determine if the device is online or offline
   * @returns the src of the device icon
   */
  device<Online extends boolean = false>(args?: {
    online?: Hint<Online, boolean>
  }): DeviceUrl<Index, Path, Ext, Online>
  device(args: { online?: boolean } = {}): string {
    const { online = false } = args
    if (!this.#isReady('device')) return ''

    return online && this.#files.device.has(`1.${this.#extensionMap.device}`)
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
    TeamId extends Scalar = 0,
    TC extends Scalar = 0,
    Battle extends boolean = false,
    Ex extends boolean = false,
    Ar extends boolean = false,
    Power extends boolean | Scalar = false,
  >(args?: {
    teamId?: Hint<TeamId, EnumVal<typeof Rpc.Team>>
    trainerCount?: Hint<TC, TrainerCounts>
    inBattle?: Hint<Battle, boolean>
    ex?: Hint<Ex, boolean>
    ar?: Hint<Ar, boolean>
    power?: Hint<Power, boolean | EnumVal<typeof Rpc.FortPowerUpLevel>>
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
    return this.#resolve('gym', teamId, [
      trainerCount ? [`_t${trainerCount}`, ''] : [''],
      inBattle ? ['_b', ''] : [''],
      ex ? ['_ex', ''] : [''],
      ar ? ['_ar', ''] : [''],
      this.#evalPossiblyEmptyFlag('_p', power),
    ])
  }

  /**
   * @param args.gruntId the grunt id of the invasion, @see Rpc.EnumWrapper.InvasionCharacter
   * @param args.confirmed if the invasion is confirmed - used for giovanni/decoy images
   * @returns the src of the invasion icon
   */
  invasion<
    GruntId extends Scalar = 0,
    Confirmed extends boolean = false,
  >(args?: {
    gruntId?: Hint<GruntId, EnumVal<typeof Rpc.EnumWrapper.InvasionCharacter>>
    confirmed?: Hint<Confirmed, boolean>
  }): InvasionUrl<Index, Path, Ext, GruntId, Confirmed>
  invasion(args: { gruntId?: Scalar; confirmed?: boolean } = {}): string {
    const { gruntId = 0, confirmed = false } = args
    return this.#resolve('invasion', gruntId, [confirmed ? [''] : ['_u', '']])
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
    return this.#resolve('misc', fileName)
  }

  /**
   * @param args.typeId the pokemon type ID that is nesting, @see Rpc.HoloPokemonType
   * @returns the src of the nest icon
   */
  nest<TypeId extends Scalar = 0>(args?: {
    typeId?: Hint<TypeId, EnumVal<typeof Rpc.HoloPokemonType>>
  }): NestUrl<Index, Path, Ext, TypeId>
  nest(args: { typeId?: Scalar } = {}): string {
    const { typeId = 0 } = args
    return this.#resolve('nest', typeId)
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
    Id extends Scalar = 0,
    Evolution extends Scalar = 0,
    Form extends Scalar = 0,
    Costume extends Scalar = 0,
    Gender extends Scalar = 0,
    Alignment extends Scalar = 0,
    Bread extends Scalar = 0,
    Shiny extends boolean = false,
  >(args?: {
    pokemonId?: Hint<Id, EnumVal<typeof Rpc.HoloPokemonId>>
    evolution?: Hint<Evolution, EnumVal<typeof Rpc.HoloTemporaryEvolutionId>>
    form?: Hint<Form, EnumVal<typeof Rpc.PokemonDisplayProto.Form>>
    costume?: Hint<Costume, EnumVal<typeof Rpc.PokemonDisplayProto.Costume>>
    gender?: Hint<Gender, EnumVal<typeof Rpc.PokemonDisplayProto.Gender>>
    alignment?: Hint<
      Alignment,
      EnumVal<typeof Rpc.PokemonDisplayProto.Alignment>
    >
    bread?: Hint<Bread, EnumVal<typeof Rpc.BreadModeEnum.Modifier>>
    shiny?: Hint<Shiny, boolean>
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
    return this.#resolve('pokemon', pokemonId, [
      bread ? [`_b${bread}`, ''] : [''],
      evolution ? [`_e${evolution}`, ''] : [''],
      form ? [`_f${form}`, ''] : [''],
      costume ? [`_c${costume}`, ''] : [''],
      gender ? [`_g${gender}`, ''] : [''],
      alignment ? [`_a${alignment}`, ''] : [''],
      shiny ? ['_s', ''] : [''],
    ])
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
    LureId extends Scalar = 0,
    DisplayTypeId extends boolean | Scalar = false,
    QuestActive extends boolean | Scalar = false,
    Ar extends boolean = false,
    Power extends boolean | Scalar = false,
  >(args?: {
    lureId?: Hint<LureId, LureIDs>
    displayTypeId?: Hint<
      DisplayTypeId,
      boolean | EnumVal<typeof Rpc.IncidentDisplayType>
    >
    questActive?: Hint<QuestActive, boolean>
    ar?: Hint<Ar, boolean>
    power?: Hint<Power, boolean | EnumVal<typeof Rpc.FortPowerUpLevel>>
  }): PokestopUrl<
    Index,
    Path,
    Ext,
    LureId,
    DisplayTypeId,
    QuestActive,
    Ar,
    Power
  >
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
    return this.#resolve('pokestop', lureId, [
      this.#evalPossiblyEmptyFlag('_i', displayTypeId),
      this.#evalPossiblyEmptyFlag('_q', questActive),
      ar ? ['_ar', ''] : [''],
      this.#evalPossiblyEmptyFlag('_p', power),
    ])
  }

  /**
   * @param args.level the level of the raid egg, @see Rpc.RaidLevel
   * @param args.hatched if the raid egg has hatched
   * @param args.ex if the raid egg is an EX raid egg
   * @returns the src of the raid egg icon
   */
  raidEgg<
    Level extends Scalar = 0,
    Hatched extends boolean = false,
    Ex extends boolean = false,
  >(args?: {
    level?: Hint<Level, EnumVal<typeof Rpc.RaidLevel>>
    hatched?: Hint<Hatched, boolean>
    ex?: Hint<Ex, boolean>
  }): RaidEggUrl<Index, Path, Ext, Level, Hatched, Ex>
  raidEgg(
    args: { level?: Scalar; hatched?: boolean; ex?: boolean } = {}
  ): string {
    const { level = 0, hatched = false, ex = false } = args
    if (!this.#isReady('raid')) return ''

    return this.#search(
      this.#raid.egg,
      `${this.#path}/raid/egg`,
      level,
      [hatched ? ['_h', ''] : [''], ex ? ['_ex', ''] : ['']],
      this.#extensionMap.raid?.egg
    )
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
    Evolution extends Scalar = 0,
  >(args?: {
    questRewardType?: Hint<QT, RewardTypeKeys>
    rewardId?: Id
    amount?: Amount
    evolution?: Hint<Evolution, EnumVal<typeof Rpc.HoloTemporaryEvolutionId>>
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
    const safeId = +rewardId || amountSafe || 0

    return this.#search(
      rewardSet,
      baseUrl,
      safeId,
      [
        evolution ? [`_e${evolution}`, ''] : [''],
        Number.isInteger(amountSafe) && amountSafe > 1
          ? [`_a${amount}`, '']
          : [''],
      ],
      this.#extensionMap.reward?.[questRewardType]
    )
  }

  /**
   * @param args.hasTth if the spawnpoint has a confirmed timer or not
   * @returns the src of the spawnpoint icon
   */
  spawnpoint<HasTth extends boolean = false>(args?: {
    hasTth?: Hint<HasTth, boolean>
  }): SpawnpointUrl<Index, Path, Ext, HasTth>
  spawnpoint(args: { hasTth?: boolean } = {}): string {
    const { hasTth = false } = args
    if (!this.#isReady('spawnpoint')) return ''

    return hasTth &&
      this.#files.spawnpoint.has(`1.${this.#extensionMap.spawnpoint}`)
      ? `${this.#path}/spawnpoint/1.${this.#extensionMap.spawnpoint}`
      : `${this.#path}/spawnpoint/0.${this.#extensionMap.spawnpoint}`
  }

  /**
   * @param args.active if the station is active or not
   * @returns the src of the station icon
   */
  station<Active extends boolean = false>(args?: {
    active?: Hint<Active, boolean>
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
    tappableType?: Hint<
      T,
      | 'TAPPABLE_TYPE_POKEBALL'
      | (keyof typeof Rpc.Tappable.TappableType & string)
    >
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
      return this.#files.tappable.has(fileName)
        ? `${baseUrl}/${fileName}`
        : undefined
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
  team<TeamId extends Scalar = 0>(args?: {
    teamId?: Hint<TeamId, EnumVal<typeof Rpc.Team>>
  }): TeamUrl<Index, Path, Ext, TeamId>
  team(args: { teamId?: Scalar } = {}): string {
    const { teamId = 0 } = args
    return this.#resolve('team', teamId)
  }

  /**
   * @param args.typeId the pokemon type ID, @see Rpc.HoloPokemonType
   * @returns the src of the pokemon type icon
   */
  type<TypeId extends Scalar = 0>(args?: {
    typeId?: Hint<TypeId, EnumVal<typeof Rpc.HoloPokemonType>>
  }): TypeUrl<Index, Path, Ext, TypeId>
  type(args: { typeId?: Scalar } = {}): string {
    const { typeId = 0 } = args
    return this.#resolve('type', typeId)
  }

  /**
   * @param args.weatherId the weather ID, @see Rpc.GameplayWeatherProto.WeatherCondition
   * @param args.severityLevel the severity of the weather, @see Rpc.InternalWeatherAlertProto.Severity
   * @param args.timeOfDay the time of day, @see TimeOfDay
   * @returns the src of the weather icon
   */
  weather<
    WeatherId extends Scalar = 0,
    Severity extends Scalar = 0,
    Time extends string = 'day',
  >(args?: {
    weatherId?: Hint<
      WeatherId,
      EnumVal<typeof Rpc.GameplayWeatherProto.WeatherCondition>
    >
    severityLevel?: Hint<
      Severity,
      EnumVal<typeof Rpc.InternalWeatherAlertProto.Severity>
    >
    timeOfDay?: Hint<Time, TimeOfDay>
  }): WeatherUrl<Index, Path, Ext, WeatherId, Severity, Time>
  weather(
    args: {
      weatherId?: Scalar
      severityLevel?: Scalar
      timeOfDay?: string
    } = {}
  ): string {
    const { weatherId = 0, severityLevel = 0, timeOfDay = 'day' } = args
    return this.#resolve('weather', weatherId, [
      severityLevel ? [`_l${severityLevel}`, ''] : [''],
      timeOfDay === 'night' ? ['_n', ''] : ['_d', ''],
    ])
  }
}
