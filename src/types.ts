import type { Rpc } from '@na-ji/pogo-protos'

export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

export type TimeOfDay = 'day' | 'night'

export interface UiconsIndex<Type extends string[] = string[]> {
  device?: Type
  gym?: Type
  invasion?: Type
  misc?: Type
  nest?: Type
  pokemon?: Type
  pokestop?: Type
  raid?: {
    egg?: Type
  }
  reward?: { [key in RewardTypeKeys]?: Type }
  spawnpoint?: Type
  team?: Type
  type?: Type
  weather?: Type
}

export type ExtensionMap<T = UiconsIndex> = {
  [K in keyof T]: T[K] extends string[] | readonly string[]
    ? string
    : ExtensionMap<T[K]>
}

type DeepKeys<T, P extends string = ''> = {
  [K in keyof T]-?: K extends string
    ? P extends ''
      ? `${K}` | `${K}.${DeepKeys<T[K], K>}`
      : `${P}.${K}.${DeepKeys<T[K], P & K>}`
    : never
}[keyof T]

type ConfigPaths<T extends object> = DeepKeys<T>

type PathValue<T, P> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends DeepKeys<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never

type ConfigPathValue<T extends object, P extends ConfigPaths<T>> = PathValue<
  T,
  P
>

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never

type Prev = [never, 0, 1, ...0[]]

export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never
    }[keyof T]
  : ''
