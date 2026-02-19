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

export type RewardArgs =
  | []
  | [questRewardType: RewardTypeKeys]
  | [questRewardType: RewardTypeKeys, rewardIdOrAmount: Scalar]
  | [questRewardType: RewardTypeKeys, rewardIdOrAmount: Scalar, amount: Scalar]

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

export type RewardUrlFromArgs<
  Path extends string,
  Extension extends string,
  Args extends RewardArgs,
> = Args extends []
  ? FileUrl<Path, 'misc', Extension, Zero>
  :
      | FileUrl<Path, RewardFolderFromArgs<Args>, Extension, RewardNameFromArgs<Args>>
      | FileUrl<Path, 'misc', Extension, Zero>

type RewardCategoryUrlFromParams<
  Path extends string,
  Extension extends string,
  QuestRewardType extends RewardTypeKeys,
  RewardIdOrAmount extends Scalar | undefined,
  Amount extends Scalar | undefined,
> = RewardIdOrAmount extends Scalar
  ? Amount extends Scalar
    ? FileUrl<
        Path,
        `reward/${QuestRewardType}`,
        Extension,
        RewardNameFromArgs<[QuestRewardType, RewardIdOrAmount, Amount]>
      >
    : FileUrl<
        Path,
        `reward/${QuestRewardType}`,
        Extension,
        RewardNameFromArgs<[QuestRewardType, RewardIdOrAmount]>
      >
  : FileUrl<
      Path,
      `reward/${QuestRewardType}`,
      Extension,
      RewardNameFromArgs<[QuestRewardType]>
    >

export type RewardUrlFromParams<
  Path extends string,
  Extension extends string,
  QuestRewardType extends RewardTypeKeys | undefined,
  RewardIdOrAmount extends Scalar | undefined,
  Amount extends Scalar | undefined,
> = QuestRewardType extends RewardTypeKeys
  ?
      | RewardCategoryUrlFromParams<
          Path,
          Extension,
          QuestRewardType,
          RewardIdOrAmount,
          Amount
        >
      | FileUrl<Path, 'misc', Extension, Zero>
  : FileUrl<Path, 'misc', Extension, Zero>
