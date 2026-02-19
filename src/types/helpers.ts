import type { Scalar, Zero } from './general.js'

export type FlagSuffix<
  Flag extends boolean | undefined,
  Suffix extends string,
> = Flag extends true ? '' | Suffix : ''

export type OptionalScalarSuffix<
  Value extends Scalar | undefined,
  Prefix extends string,
> = Value extends undefined | Zero | '0' ? '' : '' | `${Prefix}${Value}`

export type FlagOrValueSuffix<
  Value extends boolean | Scalar | undefined,
  Prefix extends string,
> = Value extends undefined | false
  ? ''
  : Value extends true | Zero | '0'
    ? '' | Prefix
    : '' | Prefix | `${Prefix}${Value}`
