import type { Rpc } from '@na-ji/pogo-protos'

/**
 * Primitive value accepted by icon filename builders.
 */
export type Scalar = string | number

/**
 * Supported lower-cased quest reward categories from {@link Rpc.QuestRewardProto.Type}.
 */
export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

export type RaidKeys = Lowercase<keyof UiconsIndex['raid']>

/**
 * Day or night variant selector used by weather icons.
 */
export type TimeOfDay = 'day' | 'night'

/**
 * Gym defender count values accepted by UICONS gym icons.
 */
export type TrainerCounts = StringOrNumber<0 | 1 | 2 | 3 | 4 | 5 | 6>

/**
 * Pokestop lure IDs derived from `Rpc.Item` `ITEM_TROY_DISK*` enum values.
 */
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
 * Shape of the `index.json` payload published by the UICONS repository.
 */
export interface UiconsIndex<T extends string[] = string[]> {
  background: T
  device: T
  gym: T
  invasion: T
  misc: T
  nest: T
  pokemon: T
  pokestop: T
  tappable: T
  raid: {
    egg: T
  }
  reward: { [K in RewardTypeKeys]: T }
  spawnpoint: T
  station: T
  team: T
  type: T
  weather: T
}

export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T

/**
 * Constructor options for {@link UICONS}.
 */
export interface Options<
  TData extends DeepPartial<UiconsIndex>,
  TPath extends string,
  TExt extends string,
> {
  /**
   * The path to the directory containing the icons.
   */
  path: TPath
  /**
   * The extension of the UICONS files
   */
  extension?: TExt
  /**
   * The index.json data from the uicons repository.
   */
  data?: TData
  /**
   * The label to use when logging messages.
   */
  label?: string
}

/**
 * Per-category extension lookup generated from a UICONS index file.
 */
export type ExtensionMap<T extends object, U extends string> = {
  [K in keyof T]: T[K] extends string[]
    ? U
    : T[K] extends NonArrayObject
      ? ExtensionMap<T[K], U>
      : never
}

type Url<
  Path extends string,
  Folder extends string,
  FileName extends string,
> = `${Path}/${Folder}/${FileName}`

/**
 * Full asset URL type: `${path}/${folder}/${name}.${extension}`.
 */
export type FileUrl<
  Path extends string,
  Folder extends string,
  Extension extends string,
  Name extends Scalar = Scalar,
> = Url<Path, Folder, `${Name}.${Extension}`>

/**
 * Numeric zero sentinel used across optional icon arguments.
 */
export type Zero = 0

/**
 * Numeric one sentinel used by binary icon variants.
 */
export type One = 1

/**
 * Optional numeric value shorthand (`undefined` or `0`).
 */
export type Optional = undefined | Zero

/**
 * String-or-number representation of enum values.
 */
export type EnumVal<T extends Record<number | string, number | string>> =
  StringOrNumber<T[keyof T]>

/**
 * Accepts either numeric values or their stringified equivalents.
 */
export type StringOrNumber<T extends number | string> = `${T}` | T

type KeysEndingWith<T, S extends string> = {
  [K in keyof T]: K extends `${S}${infer _Suffix}` ? K : never
}[keyof T]

/**
 * Picks keys from `T` whose property value types are assignable to `U`.
 */
export type OnlyTypeKeys<T extends object, U> = {
  [K in keyof T]-?: T[K] extends U ? K : never
}[keyof T]

export type NonArrayObject = Record<PropertyKey, unknown>

export type PopNum<T> = T extends `${infer Head}.${infer Tail}`
  ? Tail extends `${number}`
    ? Head
    : `${Head}.${PopNum<Tail>}`
  : T
