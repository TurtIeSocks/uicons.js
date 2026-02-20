import type { Rpc } from '@na-ji/pogo-protos'
import type {
  UiconsIndex,
  DeepPartial,
  EnumVal,
  RewardTypeKeys,
  TrainerCounts,
  LureIDs,
  TimeOfDay,
  Options,
  Zero,
  One,
  Scalar,
  FileUrl,
  OnlyTypeKeys,
  RaidKeys,
  NonArrayObject,
  PopNum,
  ExtensionMap,
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
  TappableRewardFallbackUrl,
  WeatherArgs,
  WeatherNameFromArgs,
} from './types/index.js'
import { Split, Paths } from 'type-fest'

const ZERO: Zero = 0
const ONE: One = 1
const PNG = 'png' as const

/**
 * Universal ICONS Class for Pokémon GO asset management
 *
 * Can be used with any image or audio extensions, as long as they follow the UICONS guidelines
 * @typeParam TPath The typed base URL prefix that all returned URLs will start with
 * @typeParam TExt The typed file extension used for icon files (`png`, `webp`, `svg`, etc.)
 * @see https://github.com/UIcons/UIcons
 * @example
 * ```ts
 * import { UICONS } from 'uicons.js'
 * import { Rpc } from '@na-ji/pogo-protos'
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
 * // With stronger extension typing
 * const uicons = new UICONS({ path: 'https://example.com/uicons', extension: 'png' })
 *
 * // With explicit generic specialization for typed return URLs
 * const typed = new UICONS<'https://cdn.example.com/uicons', 'webp'>({
 *   path: 'https://cdn.example.com/uicons',
 *   extension: 'webp',
 * })
 *
 * // `FileUrl<TPath, ..., TExt, ...>` now resolves with typed path and extension
 * const teamUrl = typed.team(Rpc.Team.TEAM_BLUE)
 * //    ^? "https://cdn.example.com/uicons/team/..."
 * ```
 *
 * @example
 * ```ts
 * // Async initialization fetches the index.json file for you
 * await uicons.remoteInit()
 * // Sync initialization if you already have the index.json and want to load it manually
 * uicons.init(indexJson)
 * ```
 */
export class UICONS<
  TPath extends string = string,
  TExt extends string = typeof PNG,
> {
  #path: TPath
  #extensionMap: {
    [K in keyof UiconsIndex]?: UiconsIndex[K] extends NonArrayObject
      ? { [K2 in keyof UiconsIndex[K]]?: TExt }
      : TExt
  } = {}
  #label: string
  #ext: TExt
  #fallback: Zero = ZERO

  #background: Set<UiconsIndex['background'][number]> = new Set()
  #device: Set<UiconsIndex['device'][number]> = new Set()
  #gym: Set<UiconsIndex['gym'][number]> = new Set()
  #invasion: Set<UiconsIndex['invasion'][number]> = new Set()
  #misc: Set<UiconsIndex['misc'][number]> = new Set()
  #nest: Set<UiconsIndex['nest'][number]> = new Set()
  #pokemon: Set<UiconsIndex['pokemon'][number]> = new Set()
  #pokestop: Set<UiconsIndex['pokestop'][number]> = new Set()
  #tappable: Set<UiconsIndex['tappable'][number]> = new Set()
  #raid: { [K in RaidKeys]: Set<string> } = { egg: new Set() }
  #reward: { [K in RewardTypeKeys]?: Set<string> } = {}
  #spawnpoint: Set<UiconsIndex['spawnpoint'][number]> = new Set()
  #station: Set<UiconsIndex['station'][number]> = new Set()
  #team: Set<UiconsIndex['team'][number]> = new Set()
  #type: Set<UiconsIndex['type'][number]> = new Set()
  #weather: Set<UiconsIndex['weather'][number]> = new Set()

  /**
   * Construct a `UICONS` instance with full options.
   *
   * @param options The options object for the UICONS instance
   * @example
   * ```ts
   * const custom = new UICONS<'https://icons.acme.dev/uicons', 'webp'>({
   *   path: 'https://icons.acme.dev/uicons',
   *   label: 'acme-prod',
   *   extension: 'webp',
   *   data: {
   *     team: ['0.webp', '1.webp', '2.webp', '3.webp'],
   *     weather: ['0_d.webp', '1_d.webp'],
   *   },
   * })
   * ```
   */
  constructor(options: Options<DeepPartial<UiconsIndex>, TPath, TExt>)
  /**
   * Construct a `UICONS` instance from a repository base URL.
   *
   * @param path The base URL of the UICONS repository
   * @example
   * ```ts
   * const uicons = new UICONS('https://raw.githubusercontent.com/UIcons/UIcons/main')
   * await uicons.remoteInit()
   * ```
   */
  constructor(path: TPath)
  constructor(
    optionsOrPath: TPath | Options<DeepPartial<UiconsIndex>, TPath, TExt>
  ) {
    const { path, label, data, extension } =
      typeof optionsOrPath === 'string'
        ? { path: optionsOrPath }
        : optionsOrPath
    this.#path = path.endsWith('/') ? (path.slice(0, -1) as TPath) : path
    this.#label = label ?? this.#path
    this.#ext = extension || (PNG as TExt)

    if (data) this.init(data)
  }

  // ====================================== PUBLIC LOADERS ======================================

  /**
   * Initialize this instance synchronously using a previously fetched `index.json` payload.
   *
   * @param data The index.json file from the UICONS repository
   * @returns The initialized UICONS instance (`this`) for fluent chaining.
   * @example
   * ```ts
   *
   * const uicons = new UICONS<'https://cdn.example.com/uicons', 'png'>({
   *   path: 'https://cdn.example.com/uicons',
   *   extension: 'png',
   * })
   *
   * const indexJson = await fetch('https://cdn.example.com/uicons/index.json').then((r) => r.json())
   *
   * const ready = uicons.init(indexJson)
   * // `ready` and `uicons` are the same initialized instance.
   * const fallbackGym = ready.gym()
   * ```
   *
   * @example
   * ```ts
   * // You can initialize with partial data for focused usage.
   * const mini = new UICONS('https://cdn.example.com/uicons').init({
   *   team: ['0.png', '1.png', '2.png', '3.png'],
   * })
   * const mystic = mini.team(1)
   * ```
   */
  init(data: DeepPartial<UiconsIndex>): this {
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
      Object.entries(data.reward || {}).map(([k, v]) => [k, new Set(v)])
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
   *
   * @param location This is the dot notation path of the folders in the UICONS repository
   * @param fileName The filename without the extension
   * @example
   * ```ts
   * // Numeric and string scalar lookups are both supported.
   * uicons.has('team', 1) // true => file like `team/1.png` exists
   * uicons.has('team', '3') // true => file like `team/3.png` exists
   * ```
   *
   * @example
   * ```ts
   * // Nested folders use dot notation.
   * uicons.has('raid.egg', 5) // checks `raid/egg/5.<ext>`
   * uicons.has('reward.item', 1) // checks `reward/item/1.<ext>`
   * ```
   */
  has(location: Paths<UiconsIndex>, fileName: Scalar): boolean {
    this.#isReady()

    type Parts = Split<PopNum<typeof location>, '.'>
    const [one, two]: Parts = location.split('.') as Parts

    switch (one) {
      case 'background':
        return this.#background.has(
          `${fileName}.${this.#extension('background')}`
        )
      case 'device':
        return this.#device.has(`${fileName}.${this.#extension(one)}`)
      case 'gym':
        return this.#gym.has(`${fileName}.${this.#extension(one)}`)
      case 'invasion':
        return this.#invasion.has(`${fileName}.${this.#extension(one)}`)
      case 'misc':
        return this.#misc.has(`${fileName}.${this.#extension(one)}`)
      case 'nest':
        return this.#nest.has(`${fileName}.${this.#extension(one)}`)
      case 'pokemon':
        return this.#pokemon.has(`${fileName}.${this.#extension(one)}`)
      case 'pokestop':
        return this.#pokestop.has(`${fileName}.${this.#extension(one)}`)
      case 'tappable':
        return this.#tappable.has(`${fileName}.${this.#extension(one)}`)
      case 'raid':
        return (
          !!two &&
          !!this.#raid[two]?.has(`${fileName}.${this.#extension(one, two)}`)
        )
      case 'reward':
        return (
          !!two &&
          !!this.#reward[two]?.has(`${fileName}.${this.#extension(one, two)}`)
        )
      case 'spawnpoint':
        return this.#spawnpoint.has(`${fileName}.${this.#extension(one)}`)
      case 'station':
        return this.#station.has(`${fileName}.${this.#extension(one)}`)
      case 'team':
        return this.#team.has(`${fileName}.${this.#extension(one)}`)
      case 'type':
        return this.#type.has(`${fileName}.${this.#extension(one)}`)
      case 'weather':
        return this.#weather.has(`${fileName}.${this.#extension(one)}`)
      default:
        return false
    }
  }

  // ====================================== PRIMARY PUBLIC APIs ======================================

  /**
   * Resolve a background icon URL.
   *
   * @param id The background ID. Accepts RPC enum values, numeric IDs, or numeric strings.
   * @returns A typed URL like `"{TPath}/background/{id or 0}.{TExt}"`.
   * @example
   * ```ts
   * // Default background fallback: `background/0.<ext>`
   * const fallback = uicons.background()
   * ```
   *
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * // RPC proto enum input
   * const protoUrl = uicons.background(Rpc.EncounterOutProto.Background.BACKGROUND_GRASS)
   *
   * // Scalar number or string input
   * const numericUrl = uicons.background(7)
   * const stringUrl = uicons.background('7')
   * ```
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
   * Resolve a device icon URL.
   *
   * @param online If `true`, prefers the online variant (`1`); otherwise uses offline (`0`).
   * @returns A typed URL like `"{TPath}/device/{0|1}.{TExt}"`.
   * @example
   * ```ts
   * const offline = uicons.device() // defaults to false => `device/0.<ext>`
   * const online = uicons.device(true) // `device/1.<ext>`
   * const explicitOffline = uicons.device(false) // `device/0.<ext>`
   * ```
   */
  device(online: true): FileUrl<TPath, 'device', TExt, One | Zero>
  device(online?: false): FileUrl<TPath, 'device', TExt, Zero>
  device(online = false) {
    const folder = 'device'

    this.#isReady(folder)

    const ext = this.#extension(folder)
    const file = online ? ONE : this.#fallback

    return `${this.#path}/${folder}/${file}.${ext}`
  }

  /**
   * Resolve a gym icon URL with optional modifiers.
   *
   * @param teamId The team ID, see {@link Rpc.Team}
   * @param trainerCount Number of trainers shown on the gym badge (`0-6`)
   * @param inBattle Whether the gym is in battle
   * @param ex Whether the gym is EX-eligible
   * @param ar Whether the gym is AR-eligible
   * @param power Power-up level, boolean shortcut, or {@link Rpc.FortPowerUpLevel}
   * @returns A typed URL like `"{TPath}/gym/{computed-name}.{TExt}"`, with fallback to `0`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * // All args omitted => fallback `gym/0.<ext>`
   * const fallback = uicons.gym()
   *
   * // Proto enums + booleans
   * const full = uicons.gym(
   *   Rpc.Team.TEAM_BLUE,
   *   6,
   *   true,
   *   true,
   *   false,
   *   Rpc.FortPowerUpLevel.FORT_POWERUP_LEVEL_3
   * )
   * ```
   *
   * @example
   * ```ts
   * // Scalars are accepted too (number/string/boolean)
   * const numeric = uicons.gym(2, 3, true)
   * const stringly = uicons.gym('2', '3', false, false, false, '1')
   * const booleanPower = uicons.gym(1, 0, false, false, false, true) // tries `_p` fallback variants
   * ```
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
   * Resolve an invasion icon URL.
   *
   * @param gruntId The invasion character ID, see {@link Rpc.EnumWrapper.InvasionCharacter}
   * @param confirmed If `true`, skips unconfirmed (`_u`) fallback variant.
   * @returns A typed URL like `"{TPath}/invasion/{computed-name}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const defaultInvasion = uicons.invasion() // `invasion/0.<ext>`
   * const protoInvasion = uicons.invasion(Rpc.EnumWrapper.InvasionCharacter.CHARACTER_ROCKET_GRUNT_FEMALE)
   * const confirmedBoss = uicons.invasion('44', true)
   * ```
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
   * Resolve a misc icon URL.
   *
   * @param fileName The filename without extension (number or string)
   * @returns A typed URL like `"{TPath}/misc/{fileName or 0}.{TExt}"`.
   * @example
   * ```ts
   * const fallbackMisc = uicons.misc()
   * const byNumber = uicons.misc(132)
   * const byString = uicons.misc('event-ticket')
   * ```
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
   * Resolve a nest icon URL.
   *
   * @param typeId The nesting type ID, see {@link Rpc.HoloPokemonType}
   * @returns A typed URL like `"{TPath}/nest/{typeId or 0}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const unknownNest = uicons.nest()
   * const protoTypeNest = uicons.nest(Rpc.HoloPokemonType.POKEMON_TYPE_WATER)
   * const scalarNest = uicons.nest('11')
   * ```
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
   * Resolve a Pokémon icon URL with optional visual modifiers.
   *
   * @param pokemonId Pokémon ID
   * @param evolution Mega/temporary evolution ID, see {@link Rpc.HoloTemporaryEvolutionId}
   * @param form Form ID, see {@link Rpc.PokemonDisplayProto.Form}
   * @param costume Costume ID, see {@link Rpc.PokemonDisplayProto.Costume}
   * @param gender Gender ID, see {@link Rpc.PokemonDisplayProto.Gender}
   * @param alignment Alignment ID (for shadow/purified), see {@link Rpc.PokemonDisplayProto.Alignment}
   * @param bread Bread mode modifier, see {@link Rpc.BreadModeEnum.Modifier}
   * @param shiny Whether shiny variants should be attempted
   * @returns A typed URL like `"{TPath}/pokemon/{computed-name}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * // Plain fallback and plain Pokémon ID
   * const fallbackMon = uicons.pokemon()
   * const bulbasaur = uicons.pokemon(Rpc.HoloPokemonId.BULBASAUR)
   *
   * // Rich proto input with many optional flags
   * const complex = uicons.pokemon(
   *   Rpc.HoloPokemonId.MEWTWO,
   *   Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA,
   *   Rpc.PokemonDisplayProto.Form.FORM_NORMAL,
   *   Rpc.PokemonDisplayProto.Costume.COSTUME_2020,
   *   Rpc.PokemonDisplayProto.Gender.GENDER_MALE,
   *   Rpc.PokemonDisplayProto.Alignment.ALIGNMENT_SHADOW,
   *   Rpc.BreadModeEnum.Modifier.BREAD,
   *   true
   * )
   * ```
   *
   * @example
   * ```ts
   * // Number/string/boolean combinations are accepted for flexibility.
   * const scalar = uicons.pokemon(150, 1, 0, 0, 1, 0, 0, true)
   * const stringly = uicons.pokemon('150', '1', '0', '0', '1', '0', '0', false)
   * ```
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
   * Resolve a PokéStop icon URL with optional lure/display/quest/AR/power modifiers.
   *
   * @param lureId Lure ID (`0` for none), see {@link Rpc.Item} `ITEM_TROY_DISK*`
   * @param displayTypeId Display type ID (`0` or `false` for none), see {@link Rpc.IncidentDisplayType}
   * @param questActive Whether the stop has an active quest (or scalar fallback form)
   * @param ar Whether the stop is AR-eligible
   * @param power Power-up level, boolean shortcut, or scalar equivalent
   * @returns A typed URL like `"{TPath}/pokestop/{computed-name}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const plainStop = uicons.pokestop()
   * const protoStop = uicons.pokestop(
   *   Rpc.Item.ITEM_TROY_DISK,
   *   Rpc.IncidentDisplayType.INCIDENT_DISPLAY_ROCKET,
   *   true,
   *   true,
   *   Rpc.FortPowerUpLevel.FORT_POWERUP_LEVEL_2
   * )
   * ```
   *
   * @example
   * ```ts
   * // Scalars and booleans are accepted for compatibility with external payloads.
   * const scalarStop = uicons.pokestop(501, 2, true, false, 3)
   * const stringStop = uicons.pokestop('501', '2', '1', true, '3')
   * const booleanFlagStop = uicons.pokestop(0, false, false, false, true) // tries `_p`
   * ```
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
   * Resolve a raid egg icon URL.
   *
   * @param level Raid level, see {@link Rpc.RaidLevel}
   * @param hatched Whether the egg has hatched
   * @param ex Whether this is an EX raid egg
   * @returns A typed URL like `"{TPath}/raid/egg/{computed-name}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const defaultEgg = uicons.raidEgg()
   * const legendaryEgg = uicons.raidEgg(Rpc.RaidLevel.LEVEL_5)
   * const hatchedEx = uicons.raidEgg(6, true, true)
   * ```
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
    const ext = raidExtension

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
   * Resolve a quest reward icon URL.
   *
   * @param questRewardType Reward folder key (e.g. `item`, `stardust`, `pokemon`, `unset`) mapped from {@link Rpc.QuestRewardProto.Type}
   * @param rewardId ID or amount seed depending on reward type (number/string accepted)
   * @param amount Optional quantity. Some reward icon sets use `_a{amount}` suffixes.
   * @returns A typed reward URL inferred from `RewardUrlFromArgs<TPath, TExt, Args>`.
   * @example
   * ```ts
   * // Folder-key usage (recommended)
   * const itemReward = uicons.reward('item', 1)
   * const stardustReward = uicons.reward('stardust', 500, 500)
   * const pokemonReward = uicons.reward('pokemon', 150)
   * ```
   *
   * @example
   * ```ts
   * // Scalars and strings are accepted for IDs and amounts.
   * const stringItem = uicons.reward('item', '1')
   * const amountVariant = uicons.reward('candy', 150, 3)
   *
   * // Invalid reward types gracefully fallback to `misc/0.<ext>` in dev with warning.
   * const fallbackReward = uicons.reward('unset')
   * ```
   */
  reward<Args extends RewardArgs>(
    ...args: Args
  ): RewardUrlFromArgs<TPath, TExt, Args> {
    const [questRewardType, rewardIdOrAmount, amount] = args
    const safeQuestRewardType: RewardTypeKeys = questRewardType ?? 'unset'
    const safeRewardIdOrAmount = rewardIdOrAmount ?? this.#fallback
    const safeAmount = amount ?? this.#fallback
    this.#isReady()

    const folder = `reward/${safeQuestRewardType}` as const
    const base = `${this.#path}/${folder}` as const
    const rewardSet = this.#reward[safeQuestRewardType]
    const rewardExtension = this.#extension('reward', safeQuestRewardType)
    if (!rewardSet || !rewardExtension) {
      this.#warn('Invalid quest reward type,', safeQuestRewardType)
      return this.#toRewardUrl<Args>(this.misc())
    }
    const ext = rewardExtension

    const amountSafe = typeof safeAmount === 'number' ? safeAmount : +safeAmount
    const amountSuffixes =
      Number.isInteger(amountSafe) && amountSafe > 1
        ? [`_a${safeAmount}`, '']
        : ['']
    const safeId = +safeRewardIdOrAmount || amountSafe || this.#fallback

    for (let a = 0; a < amountSuffixes.length; a += 1) {
      const result = `${safeId}${amountSuffixes[a]}.${ext}` as const
      if (rewardSet.has(result)) {
        return this.#toRewardUrl<Args>(`${base}/${result}`)
      }
    }
    return this.#toRewardUrl<Args>(`${base}/${this.#fallback}.${ext}`)
  }

  /**
   * Resolve a spawnpoint icon URL.
   *
   * @param hasTth Whether the spawnpoint has confirmed TTH timer state
   * @returns A typed URL like `"{TPath}/spawnpoint/{0|1}.{TExt}"`.
   * @example
   * ```ts
   * const unknownTimer = uicons.spawnpoint() // `spawnpoint/0.<ext>`
   * const confirmedTimer = uicons.spawnpoint(true) // prefers `1.<ext>` if present
   * ```
   */
  spawnpoint(): FileUrl<TPath, 'spawnpoint', TExt, Zero>
  spawnpoint(hasTth: true): FileUrl<TPath, 'spawnpoint', TExt, One | Zero>
  spawnpoint(hasTth?: false): FileUrl<TPath, 'spawnpoint', TExt, Zero>
  spawnpoint(hasTth = false): FileUrl<TPath, 'spawnpoint', TExt, Zero | One> {
    const folder = 'spawnpoint'
    this.#isReady(folder)

    const base = `${this.#path}/${folder}` as const
    const ext = this.#extension(folder)
    const file =
      hasTth && this.#spawnpoint.has(`${ONE}.${ext}`) ? ONE : this.#fallback

    return `${base}/${file}.${ext}` as const
  }

  /**
   * Resolve a station icon URL.
   *
   * @param active Whether the station is active
   * @returns A typed URL like `"{TPath}/station/{0|1}.{TExt}"`.
   * @example
   * ```ts
   * const inactive = uicons.station()
   * const active = uicons.station(true)
   * ```
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
   * Resolve a tappable icon URL.
   *
   * @param tappableType Tappable type identifier (usually enum-like string, but numbers/strings are accepted)
   * @returns A typed tappable URL. If category/type is missing, falls back to reward item icon URL.
   * @example
   * ```ts
   * // Defaults to `TAPPABLE_TYPE_POKEBALL` fallback lookup.
   * const defaultTappable = uicons.tappable()
   *
   * // Typical enum-like string keys used by map payloads.
   * const gruntBalloon = uicons.tappable('TAPPABLE_TYPE_ROCKET_BALLOON')
   * const showcase = uicons.tappable('TAPPABLE_TYPE_SHOWCASE')
   * ```
   *
   * @example
   * ```ts
   * // Scalar compatibility for custom pipelines.
   * const numericTappable = uicons.tappable(7)
   * const stringIdTappable = uicons.tappable('7')
   * ```
   */
  tappable(): TappableUrlFromArgs<TPath, TExt, []>
  tappable<TappableType extends Scalar>(
    tappableType: TappableType
  ): TappableUrlFromArgs<TPath, TExt, [TappableType]>
  tappable(
    tappableType?: Scalar
  ): TappableUrlFromArgs<TPath, TExt, [] | [Scalar]> {
    this.#isReady()
    const rewardFallback: TappableRewardFallbackUrl<TPath, TExt> = this.reward(
      'item',
      1
    )

    const folder = 'tappable'
    const extension = this.#extension(folder)
    if (!extension) {
      return rewardFallback
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

    return rewardFallback
  }

  /**
   * Resolve a team icon URL.
   *
   * @param teamId Team ID, see {@link Rpc.Team}
   * @returns A typed URL like `"{TPath}/team/{teamId or 0}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const neutral = uicons.team()
   * const mystic = uicons.team(Rpc.Team.TEAM_BLUE)
   * const valor = uicons.team(2)
   * const instinct = uicons.team('3')
   * ```
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
   * Resolve a Pokémon type icon URL.
   *
   * @param typeId Pokémon type ID, see {@link Rpc.HoloPokemonType}
   * @returns A typed URL like `"{TPath}/type/{typeId or 0}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const unknownType = uicons.type()
   * const fireType = uicons.type(Rpc.HoloPokemonType.POKEMON_TYPE_FIRE)
   * const scalarType = uicons.type(10)
   * ```
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
   * Resolve a weather icon URL.
   *
   * @param weatherId Weather condition ID, see {@link Rpc.GameplayWeatherProto.WeatherCondition}
   * @param severityLevel Alert severity level, see {@link Rpc.InternalWeatherAlertProto.Severity}
   * @param timeOfDay `day` or `night` (`_d`/`_n` variants are attempted)
   * @returns A typed URL like `"{TPath}/weather/{computed-name}.{TExt}"`.
   * @example
   * ```ts
   * import { Rpc } from '@na-ji/pogo-protos'
   *
   * const defaultWeather = uicons.weather()
   * const rainyDay = uicons.weather(
   *   Rpc.GameplayWeatherProto.WeatherCondition.WEATHER_RAINY,
   *   Rpc.InternalWeatherAlertProto.Severity.SEVERE,
   *   'day'
   * )
   * const windyNight = uicons.weather(4, 2, 'night')
   * ```
   *
   * @example
   * ```ts
   * // String scalar compatibility.
   * const fogString = uicons.weather('7', '1', 'night')
   * ```
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
          return `${base}/${result}`
        }
      }
    }
    return `${base}/${this.#fallback}.${ext}`
  }

  // ====================================== PRIVATE HELPERS ======================================

  #warn(...args: unknown[]) {
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn(`[UICONS ${this.#label}]`, ...args)
    }
  }

  #buildExtensions(
    json: Record<string, string[] | Record<string, string[]>>
  ): ExtensionMap<UiconsIndex, TExt> {
    return Object.fromEntries(
      Object.entries(json)
        .map(([category, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            return [category, values[0].split('.').pop()]
          }
          if (typeof values === 'object' && !Array.isArray(values)) {
            return [category, this.#buildExtensions(values)]
          }
          return [category, '']
        })
        .filter(([_, value]) => value !== '')
    )
  }

  #toRewardUrl<Args extends RewardArgs>(
    url: string
  ): RewardUrlFromArgs<TPath, TExt, Args> {
    return url as RewardUrlFromArgs<TPath, TExt, Args>
  }

  #extension<T extends OnlyTypeKeys<UiconsIndex, string[]>>(category: T): TExt
  #extension<T extends OnlyTypeKeys<UiconsIndex, NonArrayObject>>(
    category: T,
    key: OnlyTypeKeys<UiconsIndex[T], string[]>
  ): TExt
  #extension<T extends keyof UiconsIndex>(...args: ExtensionArgs<T>): TExt {
    const [category, key] = args

    if (category === 'raid') {
      return this.#extensionMap[category]?.[key] || this.#ext
    }
    if (category === 'reward') {
      return this.#extensionMap[category]?.[key] || this.#ext
    }
    return this.#extensionMap[category] || this.#ext
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
   *
   * @returns The initialized UICONS instance (`this`) with extension map populated.
   * @example
   * ```ts
   * const uicons = new UICONS<'https://cdn.example.com/uicons', 'png'>({
   *   path: 'https://cdn.example.com/uicons',
   *   extension: 'png',
   * })
   *
   * await uicons.remoteInit()
   * const url = uicons.team(1)
   * //    ^? "https://cdn.example.com/uicons/team/1.png" (when available)
   * ```
   *
   * @example
   * ```ts
   * // Works with path-only constructor too.
   * const pathOnly = new UICONS('https://raw.githubusercontent.com/UIcons/UIcons/main')
   * await pathOnly.remoteInit()
   * const weather = pathOnly.weather(1, 0, 'day')
   * ```
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
}

type ExtensionArgs<T extends keyof UiconsIndex> =
  T extends OnlyTypeKeys<UiconsIndex, string[]>
    ? [category: T]
    : T extends OnlyTypeKeys<UiconsIndex, NonArrayObject>
      ? [category: T, key: OnlyTypeKeys<UiconsIndex[T], string[]>]
      : never
