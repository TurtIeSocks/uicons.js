import type { Rpc } from '@na-ji/pogo-protos'

export type RewardTypeKeys = Lowercase<keyof typeof Rpc.QuestRewardProto.Type>

export type TimeOfDay = 'day' | 'night'

export interface UiconsIndex {
  device?: string[] | readonly string[]
  gym?: string[] | readonly string[]
  invasion?: string[] | readonly string[]
  misc?: string[] | readonly string[]
  nest?: string[] | readonly string[]
  pokemon?: string[] | readonly string[]
  pokestop?: string[] | readonly string[]
  raid?: {
    egg?: string[] | readonly string[]
  }
  reward?: { [key in RewardTypeKeys]?: string[] | readonly string[] }
  spawnpoint?: string[] | readonly string[]
  team?: string[] | readonly string[]
  type?: string[] | readonly string[]
  weather?: string[] | readonly string[]
}
