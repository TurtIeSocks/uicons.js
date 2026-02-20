import type { FileUrl, RewardTypeKeys, Scalar, Zero } from './general.js'

type RewardAmountSuffix<Amount extends Scalar> = Amount extends
  | Zero
  | '0'
  | 1
  | '1'
  ? ''
  : '' | `_a${Amount}`

type RewardFileName<
  RewardIdOrAmount extends Scalar,
  Amount extends Scalar | undefined = undefined,
> = Amount extends Scalar
  ? `${RewardIdOrAmount}${RewardAmountSuffix<Amount>}`
  : `${RewardIdOrAmount}`

/**
 * Supported positional argument tuples for {@link UICONS.reward}.
 */
export type RewardArgs =
  | []
  | [questRewardType: RewardTypeKeys]
  | [questRewardType: RewardTypeKeys, rewardIdOrAmount: Scalar]
  | [questRewardType: RewardTypeKeys, rewardIdOrAmount: Scalar, amount: Scalar]

/**
 * Type-level reward filename candidates generated from {@link RewardArgs}.
 */
export type RewardNameFromArgs<Args extends RewardArgs> = Args extends []
  ? Zero
  : Args extends [RewardTypeKeys]
    ? Zero
    : Args extends [RewardTypeKeys, infer RewardIdOrAmount extends Scalar]
      ? RewardFileName<RewardIdOrAmount> | Zero
      : Args extends [
            RewardTypeKeys,
            infer RewardIdOrAmount extends Scalar,
            infer Amount extends Scalar,
          ]
        ? RewardFileName<RewardIdOrAmount, Amount> | Zero
        : Zero

type RewardFolderFromArgs<Args extends RewardArgs> = Args extends [
  infer QuestRewardType extends RewardTypeKeys,
  ...unknown[],
]
  ? `reward/${QuestRewardType}`
  : never

/**
 * Type-level reward URL candidates returned by {@link UICONS.reward}.
 */
export type RewardUrlFromArgs<
  Path extends string,
  Extension extends string,
  Args extends RewardArgs,
> = Args extends []
  ? FileUrl<Path, 'misc', Extension, Zero>
  :
      | FileUrl<
          Path,
          RewardFolderFromArgs<Args>,
          Extension,
          RewardNameFromArgs<Args>
        >
      | FileUrl<Path, 'misc', Extension, Zero>
