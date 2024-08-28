import type { Rpc } from '@na-ji/pogo-protos'

export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

export type TimeOfDay = 'day' | 'night'

export type TrainerCounts = StringOrNumber<0 | 1 | 2 | 3 | 4 | 5 | 6>

export interface UiconsIndex<T extends string[] = string[]> {
  device?: T
  gym?: T
  invasion?: T
  misc?: T
  nest?: T
  pokemon?: T
  pokestop?: T
  raid?: {
    egg?: T
  }
  reward?: { [key in RewardTypeKeys]?: T }
  spawnpoint?: T
  team?: T
  type?: T
  weather?: T
}

export type ExtensionMap<T = UiconsIndex> = {
  [K in keyof T]: T[K] extends string[] | readonly string[]
    ? string
    : T[K] extends object
    ? ExtensionMap<T[K]>
    : never
}

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

export type EnumVal<
  T extends Record<number | string, number | string>,
  filter extends string = ''
> = StringOrNumber<T[keyof T]>

export type StringOrNumber<T extends number | string> = `${T}` | T

type KeysEndingWith<T, S extends string> = {
  [K in keyof T]: K extends `${S}${infer _Suffix}` ? K : never
}[keyof T]

export type LureIDs = StringOrNumber<
  | {
      [K in KeysEndingWith<
        typeof Rpc.Item,
        'ITEM_TROY_DISK'
      >]: (typeof Rpc.Item)[K]
    }[KeysEndingWith<typeof Rpc.Item, 'ITEM_TROY_DISK'>]
  | 0
>
