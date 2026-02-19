import type { Scalar, TimeOfDay, Zero } from './general.js'
import type { OptionalScalarSuffix } from './helpers.js'

type WeatherTimeSuffix<Time extends string | undefined = undefined> =
  Time extends 'night' ? '' | '_n' : '' | '_d'

type WeatherFileName<
  WeatherId extends Scalar,
  Severity extends Scalar | undefined = undefined,
  Time extends string | undefined = undefined,
> = `${WeatherId}${OptionalScalarSuffix<Severity, '_l'>}${WeatherTimeSuffix<Time>}`

/**
 * Supported positional argument tuples for {@link UICONS.weather}.
 */
export type WeatherArgs =
  | []
  | [weatherId: Scalar]
  | [weatherId: Scalar, severityLevel: Scalar]
  | [weatherId: Scalar, severityLevel: Scalar, timeOfDay: TimeOfDay | string]

/**
 * Type-level weather filename candidates generated from {@link WeatherArgs}.
 */
export type WeatherNameFromArgs<Args extends WeatherArgs> = Args extends []
  ? Zero
  : Args extends [infer WeatherId extends Scalar]
    ? WeatherFileName<WeatherId> | Zero
    : Args extends [
          infer WeatherId extends Scalar,
          infer Severity extends Scalar,
        ]
      ? WeatherFileName<WeatherId, Severity> | Zero
      : Args extends [
            infer WeatherId extends Scalar,
            infer Severity extends Scalar,
            infer Time extends TimeOfDay | string,
          ]
        ? WeatherFileName<WeatherId, Severity, Time> | Zero
        : Zero
