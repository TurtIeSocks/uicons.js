import type { Rpc } from '@na-ji/pogo-protos'

// ============================================================================
// Public basics
// ============================================================================

export type Scalar = string | number

export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

export type TimeOfDay = 'day' | 'night'

export type TrainerCounts = StringOrNumber<0 | 1 | 2 | 3 | 4 | 5 | 6>

export type LureIDs = StringOrNumber<
  | {
      [K in KeysEndingWith<
        typeof Rpc.Item,
        'ITEM_TROY_DISK'
      >]: (typeof Rpc.Item)[K]
    }[KeysEndingWith<typeof Rpc.Item, 'ITEM_TROY_DISK'>]
  | 0
>

/**
 * Shape of the `index.json` file from a UICONS repository.
 *
 * When passed as a literal to the constructor's `data` option, the file lists
 * are captured as tuples of string literals, which lets every icon method
 * resolve its exact return URL at the type level.
 */
export interface UiconsIndex<
  T extends readonly string[] = string[],
> {
  background?: T
  device?: T
  gym?: T
  invasion?: T
  misc?: T
  nest?: T
  pokemon?: T
  pokestop?: T
  tappable?: T
  raid?: {
    egg?: T
  }
  reward?: { [key in RewardTypeKeys]?: T }
  spawnpoint?: T
  station?: T
  team?: T
  type?: T
  weather?: T
}

export interface Options<
  Path extends string = string,
  Ext extends string = string,
  Index extends UiconsIndex<readonly string[]> = UiconsIndex,
> {
  /**
   * The path to the directory containing the icons.
   */
  path: Path
  /**
   * The index.json data from the uicons repository.
   *
   * Pass it as an object literal to get exact return types from every method.
   */
  data?: Index
  /**
   * Type-level hint for the file extension used by the repository.
   *
   * This is only used to narrow the return types when the index data is not
   * statically known (e.g. when using `remoteInit`). At runtime the extension
   * is always derived from the index data itself.
   */
  extension?: Ext
  /**
   * The label to use when logging messages.
   */
  label?: string
}

/** Runtime shape of the per-category extension lookup built from an index file. */
export type ExtensionMap = {
  [K in keyof UiconsIndex]?: UiconsIndex[K] extends readonly string[] | undefined
    ? string
    : { [K2 in keyof NonNullable<UiconsIndex[K]>]?: string }
}

/** Dot notation paths of the folders in a UICONS repository. */
export type Paths<T> = {
  [K in keyof T & string]: NonNullable<T[K]> extends readonly string[]
    ? K
    : K | `${K}.${keyof NonNullable<T[K]> & string}`
}[keyof T & string]

export type EnumVal<T extends Record<number | string, number | string>> =
  StringOrNumber<T[keyof T]>

export type StringOrNumber<T extends number | string> = `${T}` | T

/**
 * Accepts any `T` while keeping `Vocab`'s literals visible to IntelliSense.
 *
 * Editors resolve completions from the instantiated argument type, and an
 * unresolved type parameter instantiates to its default — which hides the
 * constraint's vocabulary. Putting the vocabulary in the property type fixes
 * that, and the `& {}` keeps its constituents from being taken as the
 * inference result for `T`, so literal arguments still infer exactly.
 */
export type Hint<T, Vocab extends Scalar | boolean> = T | (Vocab & {})

type KeysEndingWith<T, S extends string> = {
  [K in keyof T]: K extends `${S}${infer _Suffix}` ? K : never
}[keyof T]

// ============================================================================
// URL engine — building blocks
//
// The types below mirror the runtime lookup exactly: each method builds a list
// of candidate file names (most specific first), then returns the first one
// found in the repository's file list, falling back to `0.{ext}`. When the
// file list and the arguments are statically known, the same search runs at
// the type level and produces the exact URL literal the method will return.
// ============================================================================

/** Runtime strips a single trailing slash from the path; so does this. */
export type CleanPath<P extends string> = P extends `${infer H}/` ? H : P

type LastSegment<S extends string> = S extends `${string}.${infer R}`
  ? LastSegment<R>
  : S

type IsUnion<T, U = T> = [T] extends [never]
  ? false
  : T extends unknown
    ? [U] extends [T]
      ? false
      : true
    : never

/**
 * `true` only when `T` is a single string/number literal. Unions (including
 * enum-typed variables, which can be thousands of members wide) deliberately
 * fail this check so the candidate machinery never distributes over them.
 *
 * Wideness is tested on the template rendering of `T` rather than on `T`
 * itself: numeric enum literals report `number extends T` as `true` (legacy
 * enum assignability) but still render to a single string literal.
 */
type IsLiteralScalar<T> = [T] extends [Scalar]
  ? IsUnion<T> extends true
    ? false
    : `${number}` extends `${T & Scalar}`
      ? false
      : string extends `${T & Scalar}`
        ? false
        : [T] extends [string]
          ? T extends `${infer N extends number}`
            ? number extends N
              ? false // parses only non-canonically ('02', '1e3', '1.0') — the runtime coerces these, so exact simulation would lie
              : `${N}` extends T
                ? true
                : false
            : true
          : true
  : false

type IsLiteralBool<T> = [T] extends [boolean]
  ? boolean extends T
    ? false
    : true
  : false

type IsLiteralFlag<T> = [T] extends [boolean]
  ? IsLiteralBool<T>
  : IsLiteralScalar<T>

// Collapse non-single-literal args to their runtime defaults before they
// reach the candidate builders. This keeps huge unions (enum-typed variables
// can be thousands of members wide) out of the cross-product machinery, which
// would otherwise explode during checking. When any arg is collapsed the
// `Lit` gate routes to the coarse result anyway, so nothing is lost.
type LitScalar<V, D extends Scalar> = IsLiteralScalar<V> extends true
  ? V & Scalar
  : D

type LitBool<B> = IsLiteralBool<B> extends true ? B : false

type LitFlag<V> = IsLiteralFlag<V> extends true ? V : false

/** `true` when every entry is `true`. */
type AllLit<Checks extends readonly boolean[]> = Checks[number] extends true
  ? true
  : false

type IsTuple<A> = A extends readonly string[]
  ? number extends A['length']
    ? false
    : true
  : false

/** Safe indexed access: `undefined` when the key is not present at all. */
type Get<T, K extends PropertyKey> = K extends keyof T ? T[K] : undefined

type Get2<T, K1 extends PropertyKey, K2 extends PropertyKey> = Get<
  Exclude<Get<T, K1>, undefined>,
  K2
>

/**
 * Extension for a category: derived from its file names when they are
 * statically known, otherwise the constructor's `extension` hint. Tuples use
 * the first file only, mirroring the runtime's `values[0].split('.').pop()`.
 */
type CategoryExt<Files, ExtHint extends string> = Files extends readonly [
  infer F extends string,
  ...string[],
]
  ? F extends `${string}.${string}`
    ? LastSegment<F>
    : ExtHint
  : Files extends readonly string[]
    ? string extends Files[number]
      ? ExtHint
      : Files[number] extends `${string}.${string}`
        ? LastSegment<Files[number]>
        : ExtHint
    : ExtHint

// ---------------------------------------------------------------------------
// Ordered tuple machinery (all tail-recursive)
// ---------------------------------------------------------------------------

type ConcatEach<
  P extends string,
  S extends readonly string[],
  Acc extends readonly string[] = [],
> = S extends readonly [infer H extends string, ...infer R extends readonly string[]]
  ? ConcatEach<P, R, [...Acc, `${P}${H}`]>
  : Acc

type CrossJoin<
  Prefixes extends readonly string[],
  Suffixes extends readonly string[],
  Acc extends readonly string[] = [],
> = Prefixes extends readonly [
  infer H extends string,
  ...infer R extends readonly string[],
]
  ? CrossJoin<R, Suffixes, [...Acc, ...ConcatEach<H, Suffixes>]>
  : Acc

/**
 * Ordered cross product of suffix dimensions. The first dimension is the
 * outermost runtime loop, so candidates come out in exact runtime try-order.
 */
type CrossAll<
  Dims extends readonly (readonly string[])[],
  Acc extends readonly string[] = readonly [''],
> = Dims extends readonly [
  infer H extends readonly string[],
  ...infer R extends readonly (readonly string[])[],
]
  ? CrossAll<R, CrossJoin<Acc, H>>
  : Acc

type AppendEach<
  S extends readonly string[],
  Suf extends string,
  Acc extends readonly string[] = [],
> = S extends readonly [infer H extends string, ...infer R extends readonly string[]]
  ? AppendEach<R, Suf, [...Acc, `${H}${Suf}`]>
  : Acc

/** First candidate present in `Files`, in candidate order, else `Fallback`. */
type FirstMatch<
  Cands extends readonly string[],
  Files extends string,
  Fallback extends string,
> = Cands extends readonly [
  infer H extends string,
  ...infer R extends readonly string[],
]
  ? H extends Files
    ? H
    : FirstMatch<R, Files, Fallback>
  : Fallback

// ---------------------------------------------------------------------------
// Suffix dimensions — each mirrors one runtime suffix-array expression
// ---------------------------------------------------------------------------

/**
 * Mirrors `value ? [`${prefix}${value}`, ''] : ['']` (note: `'0'` is truthy).
 * Only ever instantiated with a single literal — see `IsLiteralScalar`.
 */
type SuffixDim<V, P extends string> = V extends 0 | ''
  ? readonly ['']
  : V extends Scalar
    ? readonly [`${P}${V}`, '']
    : readonly ['']

/** Mirrors `flag ? [suffix, ''] : ['']`. */
type BoolDim<B, S extends string> = B extends true
  ? readonly [S, '']
  : readonly ['']

/** Mirrors `#evalPossiblyEmptyFlag` (boolean | number | numeric string). */
type FlagDim<V, P extends string> = V extends boolean
  ? V extends true
    ? readonly [P, '']
    : readonly ['']
  : V extends 0
    ? readonly [P, '']
    : V extends number
      ? readonly [`${P}${V}`, P, '']
      : V extends `${infer N extends number}`
        ? N extends 0
          ? readonly [P, '']
          : readonly [`${P}${N}`, P, '']
        : readonly [P, '']

/** Mirrors `confirmed ? [''] : ['_u', '']`. */
type ConfirmedDim<C> = C extends true ? readonly [''] : readonly ['_u', '']

/** Mirrors `timeOfDay === 'night' ? ['_n', ''] : ['_d', '']`. */
type TimeDim<T> = T extends 'night' ? readonly ['_n', ''] : readonly ['_d', '']

// ---------------------------------------------------------------------------
// Core resolvers
// ---------------------------------------------------------------------------

/**
 * Resolve the URL for a candidate-search method.
 *
 * - Category known-absent from the index → `Absent` (runtime returns `''`).
 * - All args are single literals (`Lit`):
 *   - file list is a literal tuple → exact simulation of the runtime search,
 *     returning a single URL literal
 *   - otherwise → union of all candidate URLs plus the fallback
 * - Any arg widened or a union → coarse but honest: any file in the list plus
 *   the fallback when the list is known, else `{base}/{folder}/{string}.{ext}`.
 */
type ResolveIcon<
  F,
  Path extends string,
  Folder extends string,
  ExtHint extends string,
  Names extends readonly string[],
  Lit extends boolean,
  Absent = '',
> = [F] extends [undefined]
  ? Absent
  : [Exclude<F, undefined>] extends [readonly []]
    ? Absent // empty file lists are sanitized away at init, same as a missing category
    : ResolvePresent<Exclude<F, undefined>, Path, Folder, ExtHint, Names, Lit>

type ResolvePresent<
  A,
  Path extends string,
  Folder extends string,
  ExtHint extends string,
  Names extends readonly string[],
  Lit extends boolean,
> = A extends readonly string[]
  ? CategoryExt<A, ExtHint> extends infer E extends string
    ? Lit extends true
      ? IsTuple<A> extends true
        ? `${CleanPath<Path>}/${Folder}/${FirstMatch<
            AppendEach<Names, `.${E}`>,
            A[number],
            `0.${E}`
          >}`
        : `${CleanPath<Path>}/${Folder}/${
            | AppendEach<Names, `.${E}`>[number]
            | `0.${E}`}`
      : IsTuple<A> extends true
        ? `${CleanPath<Path>}/${Folder}/${A[number] | `0.${E}`}`
        : `${CleanPath<Path>}/${Folder}/${string}.${E}`
    : never
  : never

/**
 * Resolve the URL for a binary on/off method.
 * `Checked` mirrors whether the runtime verifies `1.{ext}` exists before using it.
 */
type ToggleUrl<
  F,
  Path extends string,
  Folder extends string,
  ExtHint extends string,
  On,
  Checked extends boolean,
> = [F] extends [undefined]
  ? ''
  : [Exclude<F, undefined>] extends [readonly []]
    ? ''
    : Exclude<F, undefined> extends infer A
    ? A extends readonly string[]
      ? CategoryExt<A, ExtHint> extends infer E extends string
        ? On extends true
          ? Checked extends true
            ? IsTuple<A> extends true
              ? `1.${E}` extends A[number]
                ? `${CleanPath<Path>}/${Folder}/1.${E}`
                : `${CleanPath<Path>}/${Folder}/0.${E}`
              : `${CleanPath<Path>}/${Folder}/${'0' | '1'}.${E}`
            : `${CleanPath<Path>}/${Folder}/1.${E}`
          : `${CleanPath<Path>}/${Folder}/0.${E}`
        : never
      : never
    : never

// ---------------------------------------------------------------------------
// Per-method candidate lists (in exact runtime try-order)
// ---------------------------------------------------------------------------

type GymNames<
  TeamId extends Scalar,
  TC extends Scalar,
  Battle extends boolean,
  Ex extends boolean,
  Ar extends boolean,
  Power,
> = CrossAll<
  [
    readonly [`${TeamId}`],
    SuffixDim<TC, '_t'>,
    BoolDim<Battle, '_b'>,
    BoolDim<Ex, '_ex'>,
    BoolDim<Ar, '_ar'>,
    FlagDim<Power, '_p'>,
  ]
>

type PokemonNames<
  Id extends Scalar,
  Bread extends Scalar,
  Evolution extends Scalar,
  Form extends Scalar,
  Costume extends Scalar,
  Gender extends Scalar,
  Alignment extends Scalar,
  Shiny extends boolean,
> = CrossAll<
  [
    readonly [`${Id}`],
    SuffixDim<Bread, '_b'>,
    SuffixDim<Evolution, '_e'>,
    SuffixDim<Form, '_f'>,
    SuffixDim<Costume, '_c'>,
    SuffixDim<Gender, '_g'>,
    SuffixDim<Alignment, '_a'>,
    BoolDim<Shiny, '_s'>,
  ]
>

type PokestopNames<
  LureId extends Scalar,
  DisplayTypeId,
  QuestActive,
  Ar extends boolean,
  Power,
> = CrossAll<
  [
    readonly [`${LureId}`],
    FlagDim<DisplayTypeId, '_i'>,
    FlagDim<QuestActive, '_q'>,
    BoolDim<Ar, '_ar'>,
    FlagDim<Power, '_p'>,
  ]
>

type InvasionNames<GruntId extends Scalar, Confirmed> = CrossAll<
  [readonly [`${GruntId}`], ConfirmedDim<Confirmed>]
>

type RaidEggNames<
  Level extends Scalar,
  Hatched extends boolean,
  Ex extends boolean,
> = CrossAll<
  [readonly [`${Level}`], BoolDim<Hatched, '_h'>, BoolDim<Ex, '_ex'>]
>

type WeatherNames<
  WeatherId extends Scalar,
  Severity extends Scalar,
  Time,
> = CrossAll<
  [readonly [`${WeatherId}`], SuffixDim<Severity, '_l'>, TimeDim<Time>]
>

// --- reward-specific numeric mirroring of `+id || +amount || 0` -------------

type NumOf<S> = S extends number
  ? S
  : string extends S
    ? number
    : S extends `${infer N extends number}`
      ? N
      : never

type SafeAmount<A extends Scalar> = NumOf<A> extends infer NA
  ? [NA] extends [never]
    ? 0
    : [NA] extends [0]
      ? 0
      : NA
  : never

type SafeId<Id extends Scalar, A extends Scalar> = NumOf<Id> extends infer NI
  ? [NI] extends [never]
    ? SafeAmount<A>
    : [NI] extends [0]
      ? SafeAmount<A>
      : NI
  : never

/** Integer greater than 1 (mirrors `Number.isInteger(a) && a > 1`). */
type IsAmountable<N extends number> = N extends 0 | 1
  ? false
  : `${N}` extends `-${string}`
    ? false
    : `${N}` extends `${string}.${string}`
      ? false
      : true

/** Mirrors the `_a{amount}` suffix pair (note: rendered from the raw amount). */
type AmountDim<A> = A extends Scalar
  ? NumOf<A> extends infer N
    ? [N] extends [never]
      ? readonly ['']
      : IsAmountable<N & number> extends true
        ? readonly [`_a${A}`, '']
        : readonly ['']
    : never
  : readonly ['']

type RewardNames<
  Id extends Scalar,
  Amount extends Scalar,
  Evolution extends Scalar,
> = CrossAll<
  [
    readonly [`${SafeId<Id, Amount> & (string | number)}`],
    SuffixDim<Evolution, '_e'>,
    AmountDim<Amount>,
  ]
>

// ---------------------------------------------------------------------------
// Per-method URL types (consumed by the UICONS class signatures)
// ---------------------------------------------------------------------------

export type BackgroundUrl<
  Index,
  Path extends string,
  Ext extends string,
  Id extends Scalar,
> = ResolveIcon<
  Get<Index, 'background'>,
  Path,
  'background',
  Ext,
  readonly [`${LitScalar<Id, 0>}`],
  IsLiteralScalar<Id>
>

export type DeviceUrl<
  Index,
  Path extends string,
  Ext extends string,
  Online,
> = ToggleUrl<Get<Index, 'device'>, Path, 'device', Ext, Online, true>

export type GymUrl<
  Index,
  Path extends string,
  Ext extends string,
  TeamId extends Scalar,
  TC extends Scalar,
  Battle extends boolean,
  Ex extends boolean,
  Ar extends boolean,
  Power,
> = ResolveIcon<
  Get<Index, 'gym'>,
  Path,
  'gym',
  Ext,
  GymNames<
    LitScalar<TeamId, 0>,
    LitScalar<TC, 0>,
    LitBool<Battle>,
    LitBool<Ex>,
    LitBool<Ar>,
    LitFlag<Power>
  >,
  AllLit<
    [
      IsLiteralScalar<TeamId>,
      IsLiteralScalar<TC>,
      IsLiteralBool<Battle>,
      IsLiteralBool<Ex>,
      IsLiteralBool<Ar>,
      IsLiteralFlag<Power>,
    ]
  >
>

export type InvasionUrl<
  Index,
  Path extends string,
  Ext extends string,
  GruntId extends Scalar,
  Confirmed extends boolean,
> = ResolveIcon<
  Get<Index, 'invasion'>,
  Path,
  'invasion',
  Ext,
  InvasionNames<LitScalar<GruntId, 0>, LitBool<Confirmed>>,
  AllLit<[IsLiteralScalar<GruntId>, IsLiteralBool<Confirmed>]>
>

export type MiscUrl<
  Index,
  Path extends string,
  Ext extends string,
  FileName extends Scalar,
> = ResolveIcon<
  Get<Index, 'misc'>,
  Path,
  'misc',
  Ext,
  readonly [`${LitScalar<FileName, 0>}`],
  IsLiteralScalar<FileName>
>

export type NestUrl<
  Index,
  Path extends string,
  Ext extends string,
  TypeId extends Scalar,
> = ResolveIcon<
  Get<Index, 'nest'>,
  Path,
  'nest',
  Ext,
  readonly [`${LitScalar<TypeId, 0>}`],
  IsLiteralScalar<TypeId>
>

export type PokemonUrl<
  Index,
  Path extends string,
  Ext extends string,
  Id extends Scalar,
  Evolution extends Scalar,
  Form extends Scalar,
  Costume extends Scalar,
  Gender extends Scalar,
  Alignment extends Scalar,
  Bread extends Scalar,
  Shiny extends boolean,
> = ResolveIcon<
  Get<Index, 'pokemon'>,
  Path,
  'pokemon',
  Ext,
  PokemonNames<
    LitScalar<Id, 0>,
    LitScalar<Bread, 0>,
    LitScalar<Evolution, 0>,
    LitScalar<Form, 0>,
    LitScalar<Costume, 0>,
    LitScalar<Gender, 0>,
    LitScalar<Alignment, 0>,
    LitBool<Shiny>
  >,
  AllLit<
    [
      IsLiteralScalar<Id>,
      IsLiteralScalar<Evolution>,
      IsLiteralScalar<Form>,
      IsLiteralScalar<Costume>,
      IsLiteralScalar<Gender>,
      IsLiteralScalar<Alignment>,
      IsLiteralScalar<Bread>,
      IsLiteralBool<Shiny>,
    ]
  >
>

export type PokestopUrl<
  Index,
  Path extends string,
  Ext extends string,
  LureId extends Scalar,
  DisplayTypeId,
  QuestActive,
  Ar extends boolean,
  Power,
> = ResolveIcon<
  Get<Index, 'pokestop'>,
  Path,
  'pokestop',
  Ext,
  PokestopNames<
    LitScalar<LureId, 0>,
    LitFlag<DisplayTypeId>,
    LitFlag<QuestActive>,
    LitBool<Ar>,
    LitFlag<Power>
  >,
  AllLit<
    [
      IsLiteralScalar<LureId>,
      IsLiteralFlag<DisplayTypeId>,
      IsLiteralFlag<QuestActive>,
      IsLiteralBool<Ar>,
      IsLiteralFlag<Power>,
    ]
  >
>

export type RaidEggUrl<
  Index,
  Path extends string,
  Ext extends string,
  Level extends Scalar,
  Hatched extends boolean,
  ExRaid extends boolean,
> = ResolveIcon<
  Get2<Index, 'raid', 'egg'>,
  Path,
  'raid/egg',
  Ext,
  RaidEggNames<LitScalar<Level, 0>, LitBool<Hatched>, LitBool<ExRaid>>,
  AllLit<
    [IsLiteralScalar<Level>, IsLiteralBool<Hatched>, IsLiteralBool<ExRaid>]
  >
>

export type MiscZeroUrl<Index, Path extends string, Ext extends string> = [
  Get<Index, 'misc'>,
] extends [undefined]
  ? ''
  : [Exclude<Get<Index, 'misc'>, undefined>] extends [readonly []]
    ? ''
    : `${CleanPath<Path>}/misc/0.${CategoryExt<
        Exclude<Get<Index, 'misc'>, undefined>,
        Ext
      >}`

export type RewardUrl<
  Index,
  Path extends string,
  Ext extends string,
  QT extends RewardTypeKeys,
  Id extends Scalar,
  Amount extends Scalar,
  Evolution extends Scalar,
> = QT extends RewardTypeKeys
  ? [Get<Index, 'reward'>] extends [undefined]
    ? '' // whole reward category missing: runtime bails before the misc fallback
    : Get2<Index, 'reward', QT> extends infer F
      ? [F] extends [undefined]
        ? MiscZeroUrl<Index, Path, Ext>
        : [Exclude<F, undefined>] extends [readonly []]
          ? MiscZeroUrl<Index, Path, Ext> // empty reward lists are dropped at init, so the runtime takes the misc fallback
          : ResolveIcon<
          F,
          Path,
          `reward/${QT}`,
          Ext,
          RewardNames<
            LitScalar<Id, 0>,
            LitScalar<Amount, 0>,
            LitScalar<Evolution, 0>
          >,
          AllLit<
            [
              IsLiteralScalar<Id>,
              IsLiteralScalar<Amount>,
              IsLiteralScalar<Evolution>,
            ]
          >
        >
    : never
  : never

export type SpawnpointUrl<
  Index,
  Path extends string,
  Ext extends string,
  HasTth,
> = ToggleUrl<Get<Index, 'spawnpoint'>, Path, 'spawnpoint', Ext, HasTth, true>

export type StationUrl<
  Index,
  Path extends string,
  Ext extends string,
  Active,
> = ToggleUrl<Get<Index, 'station'>, Path, 'station', Ext, Active, false>

type RewardItemFallback<
  Index,
  Path extends string,
  Ext extends string,
> = RewardUrl<Index, Path, Ext, 'item', 1, 0, 0>

export type TappableUrl<
  Index,
  Path extends string,
  Ext extends string,
  T extends Scalar,
> = Get<Index, 'tappable'> extends infer F
  ? [F] extends [undefined]
    ? RewardItemFallback<Index, Path, Ext>
    : [Exclude<F, undefined>] extends [readonly []]
      ? RewardItemFallback<Index, Path, Ext>
      : Exclude<F, undefined> extends infer A
      ? A extends readonly string[]
        ? CategoryExt<A, Ext> extends infer E extends string
          ? IsLiteralScalar<T> extends true
            ? IsTuple<A> extends true
              ? FirstMatch<
                  [`${T}.${E}`, `TAPPABLE_TYPE_POKEBALL.${E}`],
                  A[number],
                  never
                > extends infer R
                ? [R] extends [never]
                  ? RewardItemFallback<Index, Path, Ext>
                  : `${CleanPath<Path>}/tappable/${R & string}`
                : never
              :
                  | `${CleanPath<Path>}/tappable/${
                      | `${T}.${E}`
                      | `TAPPABLE_TYPE_POKEBALL.${E}`}`
                  | RewardItemFallback<Index, Path, Ext>
            : IsTuple<A> extends true
              ?
                  | `${CleanPath<Path>}/tappable/${A[number]}`
                  | RewardItemFallback<Index, Path, Ext>
              :
                  | `${CleanPath<Path>}/tappable/${string}.${E}`
                  | RewardItemFallback<Index, Path, Ext>
          : never
        : never
      : never
  : never

export type TeamUrl<
  Index,
  Path extends string,
  Ext extends string,
  TeamId extends Scalar,
> = ResolveIcon<
  Get<Index, 'team'>,
  Path,
  'team',
  Ext,
  readonly [`${LitScalar<TeamId, 0>}`],
  IsLiteralScalar<TeamId>
>

export type TypeUrl<
  Index,
  Path extends string,
  Ext extends string,
  TypeId extends Scalar,
> = ResolveIcon<
  Get<Index, 'type'>,
  Path,
  'type',
  Ext,
  readonly [`${LitScalar<TypeId, 0>}`],
  IsLiteralScalar<TypeId>
>

export type WeatherUrl<
  Index,
  Path extends string,
  Ext extends string,
  WeatherId extends Scalar,
  Severity extends Scalar,
  Time extends string,
> = ResolveIcon<
  Get<Index, 'weather'>,
  Path,
  'weather',
  Ext,
  WeatherNames<
    LitScalar<WeatherId, 0>,
    LitScalar<Severity, 0>,
    LitScalar<Time, 'day'>
  >,
  AllLit<
    [
      IsLiteralScalar<WeatherId>,
      IsLiteralScalar<Severity>,
      IsLiteralScalar<Time>,
    ]
  >
>

// ---------------------------------------------------------------------------
// has()
// ---------------------------------------------------------------------------

type FilesAt<Index, L extends string> = L extends 'raid' | 'raid.egg'
  ? Get2<Index, 'raid', 'egg'>
  : L extends `reward.${infer K}`
    ? Get2<Index, 'reward', K>
    : L extends 'reward'
      ? undefined
      : Get<Index, L>

export type HasResult<
  Index,
  L extends string,
  FN extends Scalar,
  Ext extends string,
> = FilesAt<Index, L> extends infer F
  ? [F] extends [undefined]
    ? false
    : [Exclude<F, undefined>] extends [readonly []]
      ? false
      : Exclude<F, undefined> extends infer A
      ? A extends readonly string[]
        ? IsTuple<A> extends true
          ? IsLiteralScalar<FN> extends true
            ? `${FN}.${CategoryExt<A, Ext>}` extends A[number]
              ? true
              : false
            : boolean
          : boolean
        : boolean
      : never
  : never
