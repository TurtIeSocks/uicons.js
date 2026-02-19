import type { FileUrl, One, Scalar, Zero } from './general.js'

/**
 * Supported positional argument tuples for {@link UICONS.tappable}.
 */
export type TappableArgs = [] | [tappableType: Scalar]

/**
 * Type-level tappable filename candidates generated from {@link TappableArgs}.
 */
export type TappableNameFromArgs<Args extends TappableArgs> = Args extends []
  ? 'TAPPABLE_TYPE_POKEBALL'
  : Args extends [infer TappableType extends Scalar]
    ? TappableType | 'TAPPABLE_TYPE_POKEBALL'
    : 'TAPPABLE_TYPE_POKEBALL'

/**
 * Fallback URLs used when tappable assets are unavailable.
 */
export type TappableRewardFallbackUrl<
  Path extends string,
  Extension extends string,
> =
  | FileUrl<Path, 'reward/item', Extension, One | Zero>
  | FileUrl<Path, 'misc', Extension, Zero>

/**
 * Type-level tappable URL candidates returned by {@link UICONS.tappable}.
 */
export type TappableUrlFromArgs<
  Path extends string,
  Extension extends string,
  Args extends TappableArgs,
> =
  | FileUrl<Path, 'tappable', Extension, TappableNameFromArgs<Args>>
  | TappableRewardFallbackUrl<Path, Extension>
