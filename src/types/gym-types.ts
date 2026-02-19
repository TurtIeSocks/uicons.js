import type { Rpc } from '@na-ji/pogo-protos'
import type {
  EnumVal,
  Optional,
  Scalar,
  TrainerCounts,
  Zero,
} from './general.js'
import type { FlagSuffix } from './helpers.js'

type GymTrainerSuffix<TC extends TrainerCounts | undefined = undefined> =
  TC extends Optional ? '' : '' | `_t${TC}`

type GymPowerSuffix<Power extends Scalar | boolean | undefined = undefined> =
  Power extends undefined | Zero | false
    ? ''
    : Power extends true
      ? '' | '_p'
      : '' | `_p${Power}`

type GymFileName<
  TeamId extends Scalar,
  TC extends TrainerCounts | undefined = undefined,
  Battle extends boolean | undefined = undefined,
  Ex extends boolean | undefined = undefined,
  Ar extends boolean | undefined = undefined,
  Power extends Scalar | boolean | undefined = undefined,
> = `${TeamId}${GymTrainerSuffix<TC>}${FlagSuffix<Battle, '_b'>}${FlagSuffix<
  Ex,
  '_ex'
>}${FlagSuffix<Ar, '_ar'>}${GymPowerSuffix<Power>}`

export type GymArgs =
  | []
  | [teamId: Scalar]
  | [teamId: Scalar, trainerCount: TrainerCounts]
  | [teamId: Scalar, trainerCount: TrainerCounts, inBattle: boolean]
  | [
      teamId: Scalar,
      trainerCount: TrainerCounts,
      inBattle: boolean,
      ex: boolean,
    ]
  | [
      teamId: Scalar,
      trainerCount: TrainerCounts,
      inBattle: boolean,
      ex: boolean,
      ar: boolean,
    ]
  | [
      teamId: Scalar,
      trainerCount: TrainerCounts,
      inBattle: boolean,
      ex: boolean,
      ar: boolean,
      power: boolean | EnumVal<typeof Rpc.FortPowerUpLevel>,
    ]

export type GymNameFromArgs<Args extends GymArgs> = Args extends []
  ? Zero
  : Args extends [infer TeamId extends Scalar]
    ? GymFileName<TeamId> | Zero
    : Args extends [infer TeamId extends Scalar, infer TC extends TrainerCounts]
      ? GymFileName<TeamId, TC> | Zero
      : Args extends [
            infer TeamId extends Scalar,
            infer TC extends TrainerCounts,
            infer Battle extends boolean,
          ]
        ? GymFileName<TeamId, TC, Battle> | Zero
        : Args extends [
              infer TeamId extends Scalar,
              infer TC extends TrainerCounts,
              infer Battle extends boolean,
              infer Ex extends boolean,
            ]
          ? GymFileName<TeamId, TC, Battle, Ex> | Zero
          : Args extends [
                infer TeamId extends Scalar,
                infer TC extends TrainerCounts,
                infer Battle extends boolean,
                infer Ex extends boolean,
                infer Ar extends boolean,
              ]
            ? GymFileName<TeamId, TC, Battle, Ex, Ar> | Zero
            : Args extends [
                  infer TeamId extends Scalar,
                  infer TC extends TrainerCounts,
                  infer Battle extends boolean,
                  infer Ex extends boolean,
                  infer Ar extends boolean,
                  infer Power extends boolean | Scalar,
                ]
              ? GymFileName<TeamId, TC, Battle, Ex, Ar, Power> | Zero
              : Zero
