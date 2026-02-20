import { Rpc } from '@na-ji/pogo-protos'
import { UICONS } from './uicons.js'

const BASE_ICON_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uicons-webp/main'
const BASE_AUDIO_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uaudio/main'

const iconIndex = {
  background: ['0.webp', '1.webp'],
  device: ['0.webp', '1.webp'],
  gym: [
    '0.webp',
    '2_t3_b.webp',
    '1_t4_ex.webp',
    '3_t6_ar.webp',
    '2_t3_b_p.webp',
  ],
  invasion: ['0.webp', '44_u.webp', '44.webp'],
  misc: ['0.webp', '500.webp'],
  nest: ['0.webp', '12.webp'],
  pokemon: ['0.webp', '1.webp', '4_f896.webp', '9_e1.webp', '6_s.webp'],
  pokestop: [
    '0.webp',
    '501.webp',
    '0_i.webp',
    '502_i.webp',
    '0_q.webp',
    '504_i_ar.webp',
    '0_i8.webp',
    '0_i7.webp',
    '501_i_q.webp',
  ],
  tappable: ['TAPPABLE_TYPE_POKEBALL.webp', 'TAPPABLE_TYPE_BREAKFAST.webp'],
  raid: { egg: ['0.webp', '12_h.webp', '1.webp', '1_ex.webp'] },
  reward: {
    experience: ['0.webp', '100.webp'],
    item: ['0.webp', '1.webp', '1_a10.webp', '2.webp'],
    stardust: ['0.webp', '500.webp'],
    candy: ['0.webp', '4.webp'],
    xl_candy: ['0.webp', '98.webp'],
    mega_resource: ['0.webp', '3.webp', '6_a25.webp'],
  },
  spawnpoint: ['0.webp', '1.webp'],
  station: ['0.webp', '1.webp'],
  team: ['0.webp', '3.webp'],
  type: ['0.webp', '1.webp', '7.webp', '9.webp'],
  weather: ['0.webp', '2.webp', '3_d.webp', '1_n.webp'],
}

const audioIndex = {
  pokemon: ['666.wav'],
}

const icons = new UICONS({ path: BASE_ICON_URL, extension: 'webp' })
const audio = new UICONS({ path: BASE_AUDIO_URL, extension: 'wav' })

const toResponse = <T>(payload: T, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  })

beforeAll(async () => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (url === `${BASE_ICON_URL}/index.json`) {
      return toResponse(iconIndex)
    }

    if (url === `${BASE_AUDIO_URL}/index.json`) {
      return toResponse(audioIndex)
    }

    return toResponse({ message: 'not found' }, 404)
  })

  await icons.remoteInit()
  const audioData = await fetch(`${BASE_AUDIO_URL}/index.json`)
  audio.init(await audioData.json())
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('init', () => {
  test('remote init returns instance', async () => {
    expect(await icons.remoteInit()).toBe(icons)
  })

  test('local init returns instance', async () => {
    const data = await fetch(`${BASE_AUDIO_URL}/index.json`)
    const index = await data.json()
    expect(audio.init(index)).toBe(audio)
  })
})

describe('has', () => {
  test('valid paths', () => {
    expect(icons.has('background', 1)).toBe(true)
    expect(icons.has('raid.egg', 1)).toBe(true)
    expect(icons.has('reward.item', 1)).toBe(true)
    expect(icons.has('reward.xl_candy', 98)).toBe(true)
  })

  test('invalid values', () => {
    expect(icons.has('reward.item', 999)).toBe(false)
    expect(icons.has('gym', 999)).toBe(false)
  })

  test('type-level invalid path checks', () => {
    // @ts-expect-error invalid location path
    icons.has('unknown.folder', 0)
    // @ts-expect-error reward folder key does not exist
    icons.has('reward.unknown_reward', 0)
    expect(true).toBe(true)
  })
})

describe('background', () => {
  test('no args', () => {
    const result = icons.background()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/background/0.webp`)
  })

  test('with id', () => {
    const result = icons.background(1)
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/background/1.webp`)
  })

  test('fallback', () => {
    const result = icons.background(999)
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/background/0.webp`)
  })
})

describe('device', () => {
  test('no args', () => {
    const result = icons.device()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/device/0.webp`)
  })

  test('online', () => {
    const result = icons.device(true)
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/device/1.webp`)
  })
})

describe('gym', () => {
  test('no args', () => {
    const result1 = icons.gym()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/gym/0.webp`)

    const result2 = icons.gym(1, undefined)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/gym/0.webp`)
  })

  test('tuple overloads', () => {
    const result1 = icons.gym(2, 3, true)
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/gym/2_t3_b.webp`)

    const result2 = icons.gym(1, 4, false, true)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/gym/1_t4_ex.webp`)

    const result3 = icons.gym(3, 6, false, false, true)
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/gym/3_t6_ar.webp`)

    const result4 = icons.gym(2, 3, true, false, false, true)
    expect(result4).toBe<typeof result4>(`${BASE_ICON_URL}/gym/2_t3_b_p.webp`)
  })
})

describe('invasion', () => {
  test('no args', () => {
    const result = icons.invasion()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/invasion/0.webp`)
  })

  test('unconfirmed and confirmed', () => {
    const result1 = icons.invasion('44')
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/invasion/44_u.webp`)

    const result2 = icons.invasion(
      Rpc.EnumWrapper.InvasionCharacter.CHARACTER_GIOVANNI,
      true
    )
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/invasion/44.webp`)
  })
})

describe('misc', () => {
  test('no args and named icon', () => {
    const result1 = icons.misc()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/misc/0.webp`)

    const result2 = icons.misc(500)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/misc/500.webp`)
  })
})

describe('nest', () => {
  test('no args and specific', () => {
    const result1 = icons.nest()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/nest/0.webp`)

    const result2 = icons.nest('12')
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/nest/12.webp`)
  })
})

describe('pokemon', () => {
  test('no args', () => {
    const result1 = icons.pokemon()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokemon/0.webp`)
  })

  test('overload ladder', () => {
    const result1 = icons.pokemon('1')
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokemon/1.webp`)

    const result2 = icons.pokemon(4, 0, 896)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/pokemon/4_f896.webp`)

    const result3 = icons.pokemon(
      Rpc.HoloPokemonId.BLASTOISE,
      Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA
    )
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/pokemon/9_e1.webp`)

    const result4 = icons.pokemon(6, 0, 0, 0, 0, 0, 0, true)
    expect(result4).toBe<typeof result4>(`${BASE_ICON_URL}/pokemon/6_s.webp`)
  })
})

describe('pokestop', () => {
  test('no args', () => {
    const result = icons.pokestop()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/pokestop/0.webp`)
  })

  test('overload ladder', () => {
    const result1 = icons.pokestop(501)
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokestop/501.webp`)

    const result2 = icons.pokestop(0, 0)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/pokestop/0_i.webp`)

    const result3 = icons.pokestop(0, false, true)
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/pokestop/0_q.webp`)

    const result4 = icons.pokestop(504, 0, false, true)
    expect(result4).toBe<typeof result4>(
      `${BASE_ICON_URL}/pokestop/504_i_ar.webp`
    )

    const result5 = icons.pokestop(0, '8', false, false, 0)
    expect(result5).toBe<typeof result5>(`${BASE_ICON_URL}/pokestop/0_i8.webp`)
  })
})

describe('raidEgg', () => {
  test('no args', () => {
    const result = icons.raidEgg()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/raid/egg/0.webp`)
  })

  test('hatched and ex', () => {
    const result1 = icons.raidEgg('12', true)
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/raid/egg/12_h.webp`)

    const result2 = icons.raidEgg(1, false, true)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/raid/egg/1_ex.webp`)
  })
})

describe('reward', () => {
  test('no args and folder-only', () => {
    const result1 = icons.reward()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/misc/0.webp`)

    const result2 = icons.reward('item')
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/reward/item/0.webp`)
  })

  test('reward ids and amount suffix', () => {
    const result0 = icons.reward('item', 20)
    expect(result0).toBe<typeof result0>(`${BASE_ICON_URL}/reward/item/0.webp`)

    const result00 = icons.reward('item', 20, 10)
    expect(result00).toBe<typeof result00>(
      `${BASE_ICON_URL}/reward/item/0.webp`
    )

    const result1 = icons.reward('experience', 100)
    expect(result1).toBe<typeof result1>(
      `${BASE_ICON_URL}/reward/experience/100.webp`
    )

    const result2 = icons.reward('item', 1)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/reward/item/1.webp`)

    const result3 = icons.reward('item', 1, 10)
    expect(result3).toBe<typeof result3>(
      `${BASE_ICON_URL}/reward/item/1_a10.webp`
    )

    const result4 = icons.reward('mega_resource', 6, 25)
    expect(result4).toBe<typeof result4>(
      `${BASE_ICON_URL}/reward/mega_resource/6_a25.webp`
    )
  })

  test('reward fallback to folder zero', () => {
    const result = icons.reward('stardust', 10_000)
    expect(result).toBe<typeof result>(
      `${BASE_ICON_URL}/reward/stardust/0.webp`
    )
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
    extension: 'webp',
  })

  test('no args', () => {
    const result = icons.tappable()
    expect(result).toBe<typeof result>(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_POKEBALL.webp`
    )
  })

  test('explicit and default fallback', () => {
    const result1 = custom.tappable('TAPPABLE_TYPE_BREAKFAST')
    expect(result1).toBe<typeof result1>(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_BREAKFAST.webp`
    )

    const result2 = custom.tappable('TAPPABLE_TYPE_UNKNOWN')
    expect(result2).toBe<typeof result2>(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_POKEBALL.webp`
    )
  })

  test('reward fallback when no tappables exist', () => {
    const empty = new UICONS({
      path: BASE_ICON_URL,
      data: {
        reward: {
          item: ['1.webp'],
        },
      },
      extension: 'webp',
    })

    const result = empty.tappable('TAPPABLE_TYPE_BREAKFAST')
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/reward/item/1.webp`)
  })
})

describe('spawnpoint', () => {
  test('no args and true', () => {
    const result1 = icons.spawnpoint()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/spawnpoint/0.webp`)

    const result2 = icons.spawnpoint(true)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/spawnpoint/1.webp`)
  })
})

describe('station', () => {
  test('no args and true', () => {
    const result1 = icons.station()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/station/0.webp`)

    const result2 = icons.station(true)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/station/1.webp`)
  })
})

describe('team', () => {
  test('no args, valid, fallback', () => {
    const result1 = icons.team()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/team/0.webp`)

    const result2 = icons.team(3)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/team/3.webp`)

    const result3 = icons.team(99)
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/team/0.webp`)
  })
})

describe('type', () => {
  test('no args and typed enums', () => {
    const result1 = icons.type()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/type/0.webp`)

    const result2 = icons.type(1)
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/type/1.webp`)

    const result3 = icons.type(Rpc.HoloPokemonType.POKEMON_TYPE_BUG)
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/type/7.webp`)
  })
})

describe('weather', () => {
  test('no args', () => {
    const result = icons.weather()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/weather/0.webp`)
  })

  test('severity and time variants', () => {
    const result1 = icons.weather(2)
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/weather/2.webp`)

    const result2 = icons.weather(3, 0, 'day')
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/weather/3_d.webp`)

    const result3 = icons.weather(
      Rpc.GameplayWeatherProto.WeatherCondition.CLEAR,
      0,
      'night'
    )
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/weather/1_n.webp`)
  })
})
