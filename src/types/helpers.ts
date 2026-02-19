import type { Scalar, Zero } from './general.js'

/**
 * Appends a static suffix when a boolean flag is `true`.
 */
export type FlagSuffix<
  Flag extends boolean | undefined,
  Suffix extends string,
> = Flag extends true ? '' | Suffix : ''

/**
 * Appends a prefixed scalar value unless the value is absent or zero-like.
 */
export type OptionalScalarSuffix<
  Value extends Scalar | undefined,
  Prefix extends string,
> = Value extends undefined | Zero | '0' ? '' : '' | `${Prefix}${Value}`

/**
 * Appends either a bare prefix (flag-like) or prefixed scalar value.
 */
export type FlagOrValueSuffix<
  Value extends boolean | Scalar | undefined,
  Prefix extends string,
> = Value extends undefined | false
  ? ''
  : Value extends true | Zero | '0'
    ? '' | Prefix
    : '' | Prefix | `${Prefix}${Value}`
