import { UICONS } from './uicons.ts'
import { Rpc } from '@na-ji/pogo-protos'

const BASE_ICON_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uicons-webp/main'
const BASE_AUDIO_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uaudio/main'

const icons = new UICONS(BASE_ICON_URL)
const backgroundIcons = new UICONS({
  path: BASE_ICON_URL,
  data: { background: ['0.webp', '1.webp'] },
})
const branchRewardIcons = new UICONS({
  path: BASE_ICON_URL,
  data: {
    reward: {
      mega_resource: [
        '0.webp',
        '3.webp',
        '6.webp',
        '6_e2.webp',
        '6_e2_a25.webp',
        '26.webp',
        '26_e3.webp',
        '150.webp',
        '150_a25.webp',
      ],
    },
  },
})

describe('webp format', () => {
  test('should fetch remotely', async () => {
    expect(await icons.remoteInit()).toBe(icons)
  })
  test('should have 500.webp for stardust', () => {
    expect(icons.has('reward.stardust', '500')).toBe(true)
  })
})

const audio = new UICONS({ path: BASE_AUDIO_URL })

describe('wav format', () => {
  test('should load locally', async () => {
    const data = await fetch(`${BASE_AUDIO_URL}/index.json`)
    const index = await data.json()
    expect(audio.init(index)).toBe(audio)
  })
  test('should have 666.wav for pokemon', () => {
    expect(icons.has('pokemon', 666)).toBe(true)
  })
})

describe('device', () => {
  test('online icon', () => {
    expect(icons.device({ online: true })).toBe(`${BASE_ICON_URL}/device/1.webp`)
  })
})

describe('gym', () => {
  test('neutral icon', () => {
    expect(icons.gym({ teamId: 0 })).toBe(`${BASE_ICON_URL}/gym/0.webp`)
  })
  test('valor in battle', () => {
    expect(icons.gym({ teamId: 2, trainerCount: 3, inBattle: true })).toBe(
      `${BASE_ICON_URL}/gym/2_t3_b.webp`
    )
  })
  test('mystic ex', () => {
    expect(icons.gym({ teamId: 1, trainerCount: 4, ex: true })).toBe(
      `${BASE_ICON_URL}/gym/1_t4_ex.webp`
    )
  })
  test('instinct ar', () => {
    expect(icons.gym({ teamId: 3, trainerCount: 6, ar: true })).toBe(
      `${BASE_ICON_URL}/gym/3_t6_ar.webp`
    )
  })
})

describe('invasion', () => {
  test('giovanni unconfirmed', () => {
    expect(icons.invasion({ gruntId: '44' })).toBe(
      `${BASE_ICON_URL}/invasion/44_u.webp`
    )
  })
  test('giovanni confirmed', () => {
    expect(
      icons.invasion({
        gruntId: Rpc.EnumWrapper.InvasionCharacter.CHARACTER_GIOVANNI,
        confirmed: true,
      })
    ).toBe(`${BASE_ICON_URL}/invasion/44.webp`)
  })
})

describe('misc', () => {
  test('fallback icon', () => {
    expect(icons.misc({ fileName: 'something_missing' })).toBe(
      `${BASE_ICON_URL}/misc/0.webp`
    )
  })
  test('has great league', () => {
    expect(icons.misc({ fileName: '500' })).toBe(
      `${BASE_ICON_URL}/misc/500.webp`
    )
  })
})

describe('background', () => {
  test('fallback icon', () => {
    expect(backgroundIcons.background({ id: 999 })).toBe(
      `${BASE_ICON_URL}/background/0.webp`
    )
  })
  test('specific background', () => {
    expect(backgroundIcons.background({ id: 1 })).toBe(
      `${BASE_ICON_URL}/background/1.webp`
    )
  })
})

describe('nest', () => {
  test('grass - string', () => {
    expect(icons.nest({ typeId: '12' })).toBe(`${BASE_ICON_URL}/nest/12.webp`)
  })
  test('none - number', () => {
    expect(icons.nest({ typeId: 0 })).toBe(`${BASE_ICON_URL}/nest/0.webp`)
  })
})

describe('pokemon', () => {
  test('bulbasaur', () => {
    expect(icons.pokemon({ pokemonId: '1' })).toBe(
      `${BASE_ICON_URL}/pokemon/1.webp`
    )
  })
  test('charmander form', () => {
    expect(icons.pokemon({ pokemonId: 4, form: 896 })).toBe(
      `${BASE_ICON_URL}/pokemon/4_f896.webp`
    )
  })
  test('mega blastoise', () => {
    expect(
      icons.pokemon({
        pokemonId: Rpc.HoloPokemonId.BLASTOISE,
        evolution: Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA,
      })
    ).toBe(`${BASE_ICON_URL}/pokemon/9_e1.webp`)
  })
})

describe('pokestops', () => {
  test('lure', () => {
    expect(icons.pokestop({ lureId: 501 })).toBe(
      `${BASE_ICON_URL}/pokestop/501.webp`
    )
  })
  test('invasion', () => {
    expect(icons.pokestop({ lureId: 0, displayTypeId: 0 })).toBe(
      `${BASE_ICON_URL}/pokestop/0_i.webp`
    )
  })
  test('invasion & lure', () => {
    expect(icons.pokestop({ lureId: 502, displayTypeId: 0, power: 0 })).toBe(
      `${BASE_ICON_URL}/pokestop/502_i.webp`
    )
  })
  test('quest', () => {
    expect(icons.pokestop({ questActive: true })).toBe(
      `${BASE_ICON_URL}/pokestop/0_q.webp`
    )
    expect(icons.pokestop({ questActive: 0 })).toBe(
      `${BASE_ICON_URL}/pokestop/0_q.webp`
    )
    expect(icons.pokestop({ questActive: '1' })).toBe(
      `${BASE_ICON_URL}/pokestop/0_q.webp`
    )
  })
  test('ar', () => {
    expect(icons.pokestop({ lureId: 504, displayTypeId: 0, ar: true })).toBe(
      `${BASE_ICON_URL}/pokestop/504_i_ar.webp`
    )
  })
  test('kecleon', () => {
    expect(icons.pokestop({ displayTypeId: '8', power: 0 })).toBe(
      `${BASE_ICON_URL}/pokestop/0_i8.webp`
    )
  })
  test('gold coin', () => {
    expect(icons.pokestop({ displayTypeId: 7, power: 0 })).toBe(
      `${BASE_ICON_URL}/pokestop/0_i7.webp`
    )
  })
})

describe('raid', () => {
  test('hatched', () => {
    expect(icons.raidEgg({ level: '12', hatched: true })).toBe(
      `${BASE_ICON_URL}/raid/egg/12_h.webp`
    )
  })
  test('unhatched', () => {
    expect(icons.raidEgg({ level: 1, hatched: false })).toBe(
      `${BASE_ICON_URL}/raid/egg/1.webp`
    )
  })
})

describe('reward', () => {
  test('experience', () => {
    expect(
      icons.reward({ questRewardType: 'experience', rewardId: 100 })
    ).toBe(`${BASE_ICON_URL}/reward/experience/100.webp`)
  })
  test('item without amount', () => {
    expect(icons.reward({ questRewardType: 'item', rewardId: 1 })).toBe(
      `${BASE_ICON_URL}/reward/item/1.webp`
    )
  })
  test('item with amount', () => {
    expect(
      icons.reward({ questRewardType: 'item', rewardId: 1, amount: 10 })
    ).toBe(`${BASE_ICON_URL}/reward/item/1_a10.webp`)
  })
  test('item with missing amount', () => {
    expect(
      icons.reward({ questRewardType: 'item', rewardId: 2, amount: 300 })
    ).toBe(`${BASE_ICON_URL}/reward/item/2.webp`)
  })
  test('stardust with amount', () => {
    expect(icons.reward({ questRewardType: 'stardust', rewardId: 500 })).toBe(
      `${BASE_ICON_URL}/reward/stardust/500.webp`
    )
  })
  test('stardust with missing amount', () => {
    expect(
      icons.reward({ questRewardType: 'stardust', rewardId: 10_000 })
    ).toBe(`${BASE_ICON_URL}/reward/stardust/0.webp`)
  })
  test('candy', () => {
    expect(icons.reward({ questRewardType: 'candy', rewardId: 4 })).toBe(
      `${BASE_ICON_URL}/reward/candy/4.webp`
    )
  })
  test('xl_candy', () => {
    expect(icons.reward({ questRewardType: 'xl_candy', rewardId: '98' })).toBe(
      `${BASE_ICON_URL}/reward/xl_candy/98.webp`
    )
  })
  test('mega_resource', () => {
    expect(
      icons.reward({ questRewardType: 'mega_resource', rewardId: 3 })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/3.webp`)
  })
  test('mega_resource with amount', () => {
    expect(
      icons.reward({ questRewardType: 'mega_resource', rewardId: 6, amount: 25 })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/6_a25.webp`)
  })
  test('mega_resource with evolution and amount', () => {
    expect(
      branchRewardIcons.reward({
        questRewardType: 'mega_resource',
        rewardId: 6,
        amount: 25,
        evolution: Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA_X,
      })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/6_e2_a25.webp`)
  })
  test('mega_resource evolution falls back without amount', () => {
    expect(
      branchRewardIcons.reward({
        questRewardType: 'mega_resource',
        rewardId: 26,
        amount: 25,
        evolution: 3,
      })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/26_e3.webp`)
  })
  test('mega_resource falls back to generic amount', () => {
    expect(
      branchRewardIcons.reward({
        questRewardType: 'mega_resource',
        rewardId: 150,
        amount: 25,
        evolution: 2,
      })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/150_a25.webp`)
  })
  test('mega_resource falls back to generic Pokemon', () => {
    expect(
      branchRewardIcons.reward({
        questRewardType: 'mega_resource',
        rewardId: 3,
        amount: 25,
        evolution: 2,
      })
    ).toBe(`${BASE_ICON_URL}/reward/mega_resource/3.webp`)
  })
})

describe('tappable', () => {
  const custom = new UICONS({
    path: BASE_ICON_URL,
    data: {
      tappable: ['TAPPABLE_TYPE_POKEBALL.webp', 'TAPPABLE_TYPE_BREAKFAST.webp'],
      reward: {
        item: ['1.webp'],
      },
    },
  })

  test('matches explicit type', () => {
    expect(custom.tappable({ tappableType: 'TAPPABLE_TYPE_BREAKFAST' })).toBe(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_BREAKFAST.webp`
    )
  })

  test('fallback to default tappable type', () => {
    expect(custom.tappable({ tappableType: 'TAPPABLE_TYPE_UNKNOWN' })).toBe(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_POKEBALL.webp`
    )
  })

  test('fallback to reward when no tappables exist', () => {
    const empty = new UICONS({
      path: BASE_ICON_URL,
      data: {
        reward: {
          item: ['1.webp'],
        },
      },
    })
    expect(empty.tappable({ tappableType: 'TAPPABLE_TYPE_BREAKFAST' })).toBe(
      `${BASE_ICON_URL}/reward/item/1.webp`
    )
  })
})

describe('spawnpoint', () => {
  test('verified', () => {
    expect(icons.spawnpoint({ hasTth: true })).toBe(
      `${BASE_ICON_URL}/spawnpoint/1.webp`
    )
  })
})

describe('stations', () => {
  test('active', () => {
    expect(icons.station({ active: true })).toBe(
      `${BASE_ICON_URL}/station/1.webp`
    )
  })
  test('inactive', () => {
    expect(icons.station()).toBe(`${BASE_ICON_URL}/station/0.webp`)
  })
})

describe('team', () => {
  test('instinct', () => {
    expect(icons.team({ teamId: 3 })).toBe(`${BASE_ICON_URL}/team/3.webp`)
  })
  test('missing', () => {
    expect(icons.team({ teamId: 10 })).toBe(`${BASE_ICON_URL}/team/0.webp`)
  })
})

describe('type', () => {
  test('fire - number', () => {
    expect(icons.type({ typeId: 1 })).toBe(`${BASE_ICON_URL}/type/1.webp`)
  })
  test('steel - string', () => {
    expect(icons.type({ typeId: '9' })).toBe(`${BASE_ICON_URL}/type/9.webp`)
  })
  test('bug - proto', () => {
    expect(
      icons.type({ typeId: Rpc.HoloPokemonType.POKEMON_TYPE_BUG })
    ).toBe(`${BASE_ICON_URL}/type/7.webp`)
  })
})

describe('weather', () => {
  test('id only', () => {
    expect(icons.weather({ weatherId: 2 })).toBe(
      `${BASE_ICON_URL}/weather/2.webp`
    )
  })
  test('with day', () => {
    expect(icons.weather({ weatherId: 3, timeOfDay: 'day' })).toBe(
      `${BASE_ICON_URL}/weather/3_d.webp`
    )
  })
  test('with night', () => {
    expect(
      icons.weather({
        weatherId: Rpc.GameplayWeatherProto.WeatherCondition.CLEAR,
        timeOfDay: 'night',
      })
    ).toBe(`${BASE_ICON_URL}/weather/1_n.webp`)
  })
})
