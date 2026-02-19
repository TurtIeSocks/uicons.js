import type { FileUrl, One, Scalar, Zero } from './general.js'

export type TappableArgs = [] | [tappableType: Scalar]

export type TappableNameFromArgs<Args extends TappableArgs> = Args extends []
  ? 'TAPPABLE_TYPE_POKEBALL'
  : Args extends [infer TappableType extends Scalar]
    ? TappableType | 'TAPPABLE_TYPE_POKEBALL'
    : 'TAPPABLE_TYPE_POKEBALL'

export type TappableRewardFallbackUrl<
  Path extends string,
  Extension extends string,
> =
  | FileUrl<Path, 'reward/item', Extension, One | Zero>
  | FileUrl<Path, 'misc', Extension, Zero>

export type TappableUrlFromArgs<
  Path extends string,
  Extension extends string,
  Args extends TappableArgs,
> =
  | FileUrl<Path, 'tappable', Extension, TappableNameFromArgs<Args>>
  | TappableRewardFallbackUrl<Path, Extension>
