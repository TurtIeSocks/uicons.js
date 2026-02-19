import type { Rpc } from '@na-ji/pogo-protos'

export type Scalar = string | number

/**
 * Supported lower-cased quest reward categories from {@link Rpc.QuestRewardProto.Type}.
 */
export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

/**
 * Day or night variant selector used by weather icons.
 */
export type TimeOfDay = 'day' | 'night'

/**
 * Supported lower-cased file extensions for image, audio, and video assets.
 */
export type Ext =
  // | 'jpg'
  // | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'svg'
  // | 'avif'
  // | 'bmp'
  // | 'ico'
  // | 'tif'
  // | 'tiff'
  // | 'apng'
  // | 'heif'
  // | 'heic'
  // | 'mp3'
  | 'wav'
  // | 'ogg'
  // | 'm4a'
  // | 'flac'
  // | 'aac'
  // | 'opus'
  // | 'weba'
  // | 'mp4'
  | 'webm'
// | 'mov'
// | 'avi'
// | 'mkv'
// | 'm4v'
// | 'ogv'

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
export interface UiconsIndex<T extends readonly string[] = string[]> {
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

/**
 * Constructor options for {@link UICONS}.
 */
export interface Options<
  TData extends UiconsIndex,
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
export type ExtensionMap<
  T extends UiconsIndex = UiconsIndex,
  U extends string = Ext,
> = {
  [K in keyof T]: T[K] extends string[]
    ? U
    : T[K] extends object
      ? ExtensionMap<T[K], U>
      : never
}

type Url<
  Path extends string,
  Folder extends string,
  FileName extends string,
> = `${Path}/${Folder}/${FileName}`

export type FileUrl<
  Path extends string,
  Folder extends string,
  Extension extends string,
  Name extends Scalar = Scalar,
> = Url<Path, Folder, `${Name}.${Extension}`>

export type Zero = 0
export type One = 1
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

export type OnlyTypeKeys<T extends object, U> = {
  [K in keyof T]-?: T[K] extends U ? K : never
}[keyof T]

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never

export type Paths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K]>>
        : never
    }[keyof T]
  : ''
