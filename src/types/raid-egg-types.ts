import type { Scalar, Zero } from './general.js'
import type { FlagSuffix } from './helpers.js'

type RaidEggFileName<
  Level extends Scalar,
  Hatched extends boolean | undefined = undefined,
  Ex extends boolean | undefined = undefined,
> = `${Level}${FlagSuffix<Hatched, '_h'>}${FlagSuffix<Ex, '_ex'>}`

/**
 * Supported positional argument tuples for {@link UICONS.raidEgg}.
 */
export type RaidEggArgs =
  | []
  | [level: Scalar]
  | [level: Scalar, hatched: boolean]
  | [level: Scalar, hatched: boolean, ex: boolean]

/**
 * Type-level raid egg filename candidates generated from {@link RaidEggArgs}.
 */
export type RaidEggNameFromArgs<Args extends RaidEggArgs> = Args extends []
  ? Zero
  : Args extends [infer Level extends Scalar]
    ? RaidEggFileName<Level> | Zero
    : Args extends [infer Level extends Scalar, infer Hatched extends boolean]
      ? RaidEggFileName<Level, Hatched> | Zero
      : Args extends [
            infer Level extends Scalar,
            infer Hatched extends boolean,
            infer Ex extends boolean,
          ]
        ? RaidEggFileName<Level, Hatched, Ex> | Zero
        : Zero
