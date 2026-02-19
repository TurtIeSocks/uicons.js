import type { Scalar, Zero } from './general.js'

type InvasionConfirmedSuffix<Confirmed extends boolean = false> =
  Confirmed extends true ? '' : '' | '_u'

type InvasionFileName<
  GruntId extends Scalar,
  Confirmed extends boolean = false,
> = `${GruntId}${InvasionConfirmedSuffix<Confirmed>}`

export type InvasionNameFromArgs<
  Args extends [] | [gruntId: Scalar] | [gruntId: Scalar, confirmed: boolean],
> = Args extends []
  ? Zero
  : Args extends [infer GruntId extends Scalar]
    ? InvasionFileName<GruntId> | Zero
    : Args extends [
          infer GruntId extends Scalar,
          infer Confirmed extends boolean,
        ]
      ? InvasionFileName<GruntId, Confirmed> | Zero
      : Zero
