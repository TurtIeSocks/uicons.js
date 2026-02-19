import type { Scalar, Zero } from './general.js'
import type { FlagOrValueSuffix, FlagSuffix } from './helpers.js'

type OptionalFlagOrValue = boolean | Scalar | undefined

type PokestopFileName<
  LureId extends Scalar,
  DisplayTypeId extends OptionalFlagOrValue = undefined,
  QuestActive extends OptionalFlagOrValue = undefined,
  Ar extends boolean | undefined = undefined,
  Power extends OptionalFlagOrValue = undefined,
> = `${LureId}${FlagOrValueSuffix<DisplayTypeId, '_i'>}${FlagOrValueSuffix<
  QuestActive,
  '_q'
>}${FlagSuffix<Ar, '_ar'>}${FlagOrValueSuffix<Power, '_p'>}`

export type PokestopArgs =
  | []
  | [lureId: Scalar]
  | [lureId: Scalar, displayTypeId: boolean | Scalar]
  | [
      lureId: Scalar,
      displayTypeId: boolean | Scalar,
      questActive: boolean | Scalar,
    ]
  | [
      lureId: Scalar,
      displayTypeId: boolean | Scalar,
      questActive: boolean | Scalar,
      ar: boolean,
    ]
  | [
      lureId: Scalar,
      displayTypeId: boolean | Scalar,
      questActive: boolean | Scalar,
      ar: boolean,
      power: boolean | Scalar,
    ]

export type PokestopNameFromArgs<Args extends PokestopArgs> = Args extends []
  ? Zero
  : Args extends [infer LureId extends Scalar]
    ? PokestopFileName<LureId> | Zero
    : Args extends [
          infer LureId extends Scalar,
          infer DisplayTypeId extends boolean | Scalar,
        ]
      ? PokestopFileName<LureId, DisplayTypeId> | Zero
      : Args extends [
            infer LureId extends Scalar,
            infer DisplayTypeId extends boolean | Scalar,
            infer QuestActive extends boolean | Scalar,
          ]
        ? PokestopFileName<LureId, DisplayTypeId, QuestActive> | Zero
        : Args extends [
              infer LureId extends Scalar,
              infer DisplayTypeId extends boolean | Scalar,
              infer QuestActive extends boolean | Scalar,
              infer Ar extends boolean,
            ]
          ? PokestopFileName<LureId, DisplayTypeId, QuestActive, Ar> | Zero
          : Args extends [
                infer LureId extends Scalar,
                infer DisplayTypeId extends boolean | Scalar,
                infer QuestActive extends boolean | Scalar,
                infer Ar extends boolean,
                infer Power extends boolean | Scalar,
              ]
            ?
                | PokestopFileName<
                    LureId,
                    DisplayTypeId,
                    QuestActive,
                    Ar,
                    Power
                  >
                | Zero
            : Zero
