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
    const result = icons.background({ id: 1 })
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/background/1.webp`)
  })

  test('fallback', () => {
    const result = icons.background({ id: 999 })
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/background/0.webp`)
  })
})

describe('device', () => {
  test('no args', () => {
    const result = icons.device()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/device/0.webp`)
  })

  test('online', () => {
    const result = icons.device({ online: true })
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/device/1.webp`)
  })
})

describe('gym', () => {
  test('no args', () => {
    const result1 = icons.gym()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/gym/0.webp`)

    const result2 = icons.gym({ teamId: 1 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/gym/0.webp`)
  })

  test('tuple overloads', () => {
    const result1 = icons.gym({ teamId: 2, trainerCount: 3, inBattle: true })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/gym/2_t3_b.webp`)

    const result2 = icons.gym({ teamId: 1, trainerCount: 4, ex: true })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/gym/1_t4_ex.webp`)

    const result3 = icons.gym({ teamId: 3, trainerCount: 6, ar: true })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/gym/3_t6_ar.webp`)

    const result4 = icons.gym({
      teamId: 2,
      trainerCount: 3,
      inBattle: true,
      power: true,
    })
    expect(result4).toBe<typeof result4>(`${BASE_ICON_URL}/gym/2_t3_b_p.webp`)
  })
})

describe('invasion', () => {
  test('no args', () => {
    const result = icons.invasion()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/invasion/0.webp`)
  })

  test('unconfirmed and confirmed', () => {
    const result1 = icons.invasion({ gruntId: '44' })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/invasion/44_u.webp`)

    const result2 = icons.invasion({
      gruntId: Rpc.EnumWrapper.InvasionCharacter.CHARACTER_GIOVANNI,
      confirmed: true,
    })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/invasion/44.webp`)
  })
})

describe('misc', () => {
  test('no args and named icon', () => {
    const result1 = icons.misc()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/misc/0.webp`)

    const result2 = icons.misc({ fileName: 500 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/misc/500.webp`)
  })
})

describe('nest', () => {
  test('no args and specific', () => {
    const result1 = icons.nest()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/nest/0.webp`)

    const result2 = icons.nest({ typeId: '12' })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/nest/12.webp`)
  })
})

describe('pokemon', () => {
  test('no args', () => {
    const result1 = icons.pokemon()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokemon/0.webp`)
  })

  test('overload ladder', () => {
    const result1 = icons.pokemon({ pokemonId: '1' })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokemon/1.webp`)

    const result2 = icons.pokemon({ pokemonId: 4, evolution: 0, form: 896 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/pokemon/4_f896.webp`)

    const result3 = icons.pokemon({
      pokemonId: Rpc.HoloPokemonId.BLASTOISE,
      evolution: Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA,
    })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/pokemon/9_e1.webp`)

    const result4 = icons.pokemon({ pokemonId: 6, shiny: true })
    expect(result4).toBe<typeof result4>(`${BASE_ICON_URL}/pokemon/6_s.webp`)
  })
})

describe('pokestop', () => {
  test('no args', () => {
    const result = icons.pokestop()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/pokestop/0.webp`)
  })

  test('overload ladder', () => {
    const result1 = icons.pokestop({ lureId: 501 })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/pokestop/501.webp`)

    const result2 = icons.pokestop({ lureId: 0, displayTypeId: 0 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/pokestop/0_i.webp`)

    const result3 = icons.pokestop({
      lureId: 0,
      displayTypeId: false,
      questActive: true,
    })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/pokestop/0_q.webp`)

    const result4 = icons.pokestop({
      lureId: 504,
      displayTypeId: 0,
      questActive: false,
      ar: true,
    })
    expect(result4).toBe<typeof result4>(
      `${BASE_ICON_URL}/pokestop/504_i_ar.webp`
    )

    const result5 = icons.pokestop({
      lureId: 0,
      displayTypeId: '8',
      questActive: false,
      ar: false,
      power: 0,
    })
    expect(result5).toBe<typeof result5>(`${BASE_ICON_URL}/pokestop/0_i8.webp`)
  })
})

describe('raidEgg', () => {
  test('no args', () => {
    const result = icons.raidEgg()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/raid/egg/0.webp`)
  })

  test('hatched and ex', () => {
    const result1 = icons.raidEgg({ level: '12', hatched: true })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/raid/egg/12_h.webp`)

    const result2 = icons.raidEgg({ level: 1, hatched: false, ex: true })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/raid/egg/1_ex.webp`)
  })
})

describe('reward', () => {
  test('no args and folder-only', () => {
    const result1 = icons.reward()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/misc/0.webp`)

    const result2 = icons.reward({ questRewardType: 'item' })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/reward/item/0.webp`)
  })

  test('reward ids and amount suffix', () => {
    const result0 = icons.reward({ questRewardType: 'item', rewardIdOrAmount: 20 })
    expect(result0).toBe<typeof result0>(`${BASE_ICON_URL}/reward/item/0.webp`)

    const result00 = icons.reward({
      questRewardType: 'item',
      rewardIdOrAmount: 20,
      amount: 10,
    })
    expect(result00).toBe<typeof result00>(
      `${BASE_ICON_URL}/reward/item/0.webp`
    )

    const result1 = icons.reward({
      questRewardType: 'experience',
      rewardIdOrAmount: 100,
    })
    expect(result1).toBe<typeof result1>(
      `${BASE_ICON_URL}/reward/experience/100.webp`
    )

    const result2 = icons.reward({ questRewardType: 'item', rewardIdOrAmount: 1 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/reward/item/1.webp`)

    const result3 = icons.reward({
      questRewardType: 'item',
      rewardIdOrAmount: 1,
      amount: 10,
    })
    expect(result3).toBe<typeof result3>(
      `${BASE_ICON_URL}/reward/item/1_a10.webp`
    )

    const result4 = icons.reward({
      questRewardType: 'mega_resource',
      rewardIdOrAmount: 6,
      amount: 25,
    })
    expect(result4).toBe<typeof result4>(
      `${BASE_ICON_URL}/reward/mega_resource/6_a25.webp`
    )
  })

  test('reward fallback to folder zero', () => {
    const result = icons.reward({
      questRewardType: 'stardust',
      rewardIdOrAmount: 10_000,
    })
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
    const result1 = custom.tappable({ tappableType: 'TAPPABLE_TYPE_BREAKFAST' })
    expect(result1).toBe<typeof result1>(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_BREAKFAST.webp`
    )

    const result2 = custom.tappable({ tappableType: 'TAPPABLE_TYPE_UNKNOWN' })
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

    const result = empty.tappable({ tappableType: 'TAPPABLE_TYPE_BREAKFAST' })
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/reward/item/1.webp`)
  })
})

describe('spawnpoint', () => {
  test('no args and true', () => {
    const result1 = icons.spawnpoint()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/spawnpoint/0.webp`)

    const result2 = icons.spawnpoint({ hasTth: true })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/spawnpoint/1.webp`)
  })
})

describe('station', () => {
  test('no args and true', () => {
    const result1 = icons.station()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/station/0.webp`)

    const result2 = icons.station({ active: true })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/station/1.webp`)
  })
})

describe('team', () => {
  test('no args, valid, fallback', () => {
    const result1 = icons.team()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/team/0.webp`)

    const result2 = icons.team({ teamId: 3 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/team/3.webp`)

    const result3 = icons.team({ teamId: 99 })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/team/0.webp`)
  })
})

describe('type', () => {
  test('no args and typed enums', () => {
    const result1 = icons.type()
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/type/0.webp`)

    const result2 = icons.type({ typeId: 1 })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/type/1.webp`)

    const result3 = icons.type({ typeId: Rpc.HoloPokemonType.POKEMON_TYPE_BUG })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/type/7.webp`)
  })
})

describe('weather', () => {
  test('no args', () => {
    const result = icons.weather()
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/weather/0.webp`)
  })

  test('severity and time variants', () => {
    const result1 = icons.weather({ weatherId: 2 })
    expect(result1).toBe<typeof result1>(`${BASE_ICON_URL}/weather/2.webp`)

    const result2 = icons.weather({ weatherId: 3, severityLevel: 0, timeOfDay: 'day' })
    expect(result2).toBe<typeof result2>(`${BASE_ICON_URL}/weather/3_d.webp`)

    const result3 = icons.weather({
      weatherId: Rpc.GameplayWeatherProto.WeatherCondition.CLEAR,
      severityLevel: 0,
      timeOfDay: 'night',
    })
    expect(result3).toBe<typeof result3>(`${BASE_ICON_URL}/weather/1_n.webp`)
  })
})

describe('constructor and initialization edge cases', () => {
  test('constructor normalizes trailing slash and keeps default png extension', () => {
    const pngIcons = new UICONS({
      path: 'https://example.com/uicons/',
      data: {
        background: ['0.png', '1.png'],
      },
    })

    const result = pngIcons.background({ id: 1 })
    expect(result).toBe('https://example.com/uicons/background/1.png')
  })

  test('constructor data auto-initializes without calling init', () => {
    const autoInit = new UICONS({
      path: 'https://example.com/uicons',
      extension: 'webp',
      data: {
        team: ['0.webp', '3.webp'],
      },
    })

    const result = autoInit.team({ teamId: 3 })
    expect(result).toBe<typeof result>('https://example.com/uicons/team/3.webp')
  })

  test('calling folder APIs before init throws folder missing error', () => {
    const uninitialized = new UICONS('https://example.com/missing/')
    expect(() => uninitialized.background()).toThrow(
      'Folder: background was not found for https://example.com/missing'
    )
  })

  test('has before init remains safe and returns false', () => {
    const uninitialized = new UICONS('https://example.com/missing')
    expect(uninitialized.has('background', 0)).toBe(false)
  })

  test('remote init throws on non-2xx responses', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockImplementationOnce(async (_input) =>
      toResponse({ message: 'unavailable' }, 503)
    )

    const failing = new UICONS('https://example.com/failure')
    await expect(failing.remoteInit()).rejects.toThrow(
      'Failed to fetch https://example.com/failure'
    )
  })

  test('remote init throws on invalid payloads', async () => {
    const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>
    fetchMock.mockImplementationOnce(async (_input) => toResponse([1, 2, 3]))

    const failing = new UICONS('https://example.com/invalid')
    await expect(failing.remoteInit()).rejects.toThrow(
      'Invalid index.json payload from https://example.com/invalid'
    )
  })

  test('audio instance resolves wav extension correctly', () => {
    const result = audio.pokemon({ pokemonId: 666 })
    expect(result).toBe<typeof result>(`${BASE_AUDIO_URL}/pokemon/666.wav`)
  })
})

describe('has category matrix', () => {
  test.each([
    ['background', 1],
    ['device', 1],
    ['gym', '2_t3_b'],
    ['invasion', 44],
    ['misc', 500],
    ['nest', 12],
    ['pokemon', '4_f896'],
    ['pokestop', '501_i_q'],
    ['tappable', 'TAPPABLE_TYPE_BREAKFAST'],
    ['raid.egg', '12_h'],
    ['reward.experience', 100],
    ['reward.item', '1_a10'],
    ['reward.stardust', 500],
    ['reward.candy', 4],
    ['reward.xl_candy', 98],
    ['reward.mega_resource', '6_a25'],
    ['spawnpoint', 1],
    ['station', 1],
    ['team', 3],
    ['type', 9],
    ['weather', '1_n'],
  ] as const)('returns true for %s/%s', (location, fileName) => {
    expect(icons.has(location, fileName)).toBe(true)
  })

  test('runtime-invalid paths still return false', () => {
    expect(
      (
        icons as unknown as {
          has: (location: string, fileName: string) => boolean
        }
      ).has('unknown', '0')
    ).toBe(false)
    expect(
      (
        icons as unknown as {
          has: (location: string, fileName: string) => boolean
        }
      ).has('raid.unknown', '0')
    ).toBe(false)
    expect(
      (
        icons as unknown as {
          has: (location: string, fileName: string) => boolean
        }
      ).has('reward.unknown', '0')
    ).toBe(false)
  })
})

describe('public API argument matrices', () => {
  test('device explicit false still resolves to offline icon', () => {
    const result = icons.device({ online: false })
    expect(result).toBe<typeof result>(`${BASE_ICON_URL}/device/0.webp`)
  })

  test('misc, nest, team, and type all fallback on unknown ids', () => {
    expect(icons.misc({ fileName: 404 })).toBe(`${BASE_ICON_URL}/misc/0.webp`)
    expect(icons.nest({ typeId: 404 })).toBe(`${BASE_ICON_URL}/nest/0.webp`)
    expect(icons.team({ teamId: '404' })).toBe(`${BASE_ICON_URL}/team/0.webp`)
    expect(icons.type({ typeId: '404' })).toBe(`${BASE_ICON_URL}/type/0.webp`)
  })

  test('gym fallback order covers battle/ex/ar/power suffix permutations', () => {
    const gymIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        gym: ['0.webp', '2_t3.webp', '2_t3_b_p.webp', '1_t4.webp', '3_t6.webp'],
      },
    })

    expect(gymIcons.gym({ teamId: 2, trainerCount: 3, inBattle: true })).toBe(
      `${BASE_ICON_URL}/gym/2_t3.webp`
    )
    expect(
      gymIcons.gym({ teamId: 2, trainerCount: 3, inBattle: true, power: 4 })
    ).toBe(
      `${BASE_ICON_URL}/gym/2_t3_b_p.webp`
    )
    expect(gymIcons.gym({ teamId: 1, trainerCount: 4, ex: true })).toBe(
      `${BASE_ICON_URL}/gym/1_t4.webp`
    )
    expect(gymIcons.gym({ teamId: 3, trainerCount: 6, ar: true })).toBe(
      `${BASE_ICON_URL}/gym/3_t6.webp`
    )
    expect(
      gymIcons.gym({
        teamId: 9,
        trainerCount: 9,
        inBattle: true,
        ex: true,
        ar: true,
        power: true,
      })
    ).toBe(
      `${BASE_ICON_URL}/gym/0.webp`
    )
  })

  test('invasion combinations honor confirmed and unconfirmed fallback behavior', () => {
    const invasionOnlyConfirmed = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        invasion: ['0.webp', '44.webp'],
      },
    })
    const invasionOnlyUnconfirmed = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        invasion: ['0.webp', '44_u.webp'],
      },
    })

    expect(invasionOnlyConfirmed.invasion({ gruntId: 44 })).toBe(
      `${BASE_ICON_URL}/invasion/44.webp`
    )
    expect(invasionOnlyUnconfirmed.invasion({ gruntId: 44 })).toBe(
      `${BASE_ICON_URL}/invasion/44_u.webp`
    )
    expect(
      invasionOnlyUnconfirmed.invasion({ gruntId: 44, confirmed: true })
    ).toBe(
      `${BASE_ICON_URL}/invasion/0.webp`
    )
  })

  test('pokemon supports each positional argument and shiny fallback', () => {
    const pokemonIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        pokemon: [
          '0.webp',
          '25.webp',
          '25_b1.webp',
          '25_e1.webp',
          '25_f2.webp',
          '25_c3.webp',
          '25_g1.webp',
          '25_a1.webp',
          '25_s.webp',
          '25_e1_f2.webp',
          '26.webp',
        ],
      },
    })

    expect(pokemonIcons.pokemon({ pokemonId: 25 })).toBe(
      `${BASE_ICON_URL}/pokemon/25.webp`
    )
    expect(pokemonIcons.pokemon({ pokemonId: 25, evolution: 1 })).toBe(
      `${BASE_ICON_URL}/pokemon/25_e1.webp`
    )
    expect(pokemonIcons.pokemon({ pokemonId: 25, evolution: 0, form: 2 })).toBe(
      `${BASE_ICON_URL}/pokemon/25_f2.webp`
    )
    expect(
      pokemonIcons.pokemon({ pokemonId: 25, evolution: 0, form: 0, costume: 3 })
    ).toBe(
      `${BASE_ICON_URL}/pokemon/25_c3.webp`
    )
    expect(
      pokemonIcons.pokemon({
        pokemonId: 25,
        evolution: 0,
        form: 0,
        costume: 0,
        gender: 1,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokemon/25_g1.webp`
    )
    expect(
      pokemonIcons.pokemon({
        pokemonId: 25,
        evolution: 0,
        form: 0,
        costume: 0,
        gender: 0,
        alignment: 1,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokemon/25_a1.webp`
    )
    expect(
      pokemonIcons.pokemon({
        pokemonId: 25,
        evolution: 0,
        form: 0,
        costume: 0,
        gender: 0,
        alignment: 0,
        bread: 1,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokemon/25_b1.webp`
    )
    expect(pokemonIcons.pokemon({ pokemonId: 25, shiny: true })).toBe(
      `${BASE_ICON_URL}/pokemon/25_s.webp`
    )
    expect(pokemonIcons.pokemon({ pokemonId: 25, evolution: 1, form: 2 })).toBe(
      `${BASE_ICON_URL}/pokemon/25_e1_f2.webp`
    )
    expect(pokemonIcons.pokemon({ pokemonId: 26, shiny: true })).toBe(
      `${BASE_ICON_URL}/pokemon/26.webp`
    )
    expect(
      pokemonIcons.pokemon({
        pokemonId: '999',
        evolution: '1',
        form: '2',
        costume: '3',
        gender: '4',
        alignment: '5',
        bread: '6',
        shiny: true,
      })
    ).toBe(`${BASE_ICON_URL}/pokemon/0.webp`)
  })

  test('pokestop combinations cover display, quest, ar, and power suffix rules', () => {
    const pokestopIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        pokestop: [
          '0.webp',
          '501.webp',
          '0_i.webp',
          '0_i8.webp',
          '0_q.webp',
          '0_q3.webp',
          '0_p.webp',
          '0_p4.webp',
          '504_i_q_ar_p.webp',
        ],
      },
    })

    expect(pokestopIcons.pokestop()).toBe(`${BASE_ICON_URL}/pokestop/0.webp`)
    expect(pokestopIcons.pokestop({ lureId: 501 })).toBe(
      `${BASE_ICON_URL}/pokestop/501.webp`
    )
    expect(pokestopIcons.pokestop({ lureId: 0, displayTypeId: true })).toBe(
      `${BASE_ICON_URL}/pokestop/0_i.webp`
    )
    expect(pokestopIcons.pokestop({ lureId: 0, displayTypeId: 8 })).toBe(
      `${BASE_ICON_URL}/pokestop/0_i8.webp`
    )
    expect(
      pokestopIcons.pokestop({ lureId: 0, displayTypeId: false, questActive: true })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/0_q.webp`
    )
    expect(
      pokestopIcons.pokestop({ lureId: 0, displayTypeId: false, questActive: 3 })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/0_q3.webp`
    )
    expect(
      pokestopIcons.pokestop({
        lureId: 0,
        displayTypeId: false,
        questActive: false,
        ar: false,
        power: true,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/0_p.webp`
    )
    expect(
      pokestopIcons.pokestop({
        lureId: 0,
        displayTypeId: false,
        questActive: false,
        ar: false,
        power: 4,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/0_p4.webp`
    )
    expect(
      pokestopIcons.pokestop({
        lureId: 504,
        displayTypeId: true,
        questActive: true,
        ar: true,
        power: 4,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/504_i_q_ar_p.webp`
    )
    expect(
      pokestopIcons.pokestop({
        lureId: 999,
        displayTypeId: 9,
        questActive: 9,
        ar: true,
        power: 9,
      })
    ).toBe(
      `${BASE_ICON_URL}/pokestop/0.webp`
    )
  })

  test('raidEgg combinations cover hatched/ex ordering and fallback', () => {
    const raidIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        raid: {
          egg: ['0.webp', '5_h_ex.webp', '5_h.webp', '6_ex.webp', '7.webp'],
        },
      },
    })

    expect(raidIcons.raidEgg({ level: 5, hatched: true, ex: true })).toBe(
      `${BASE_ICON_URL}/raid/egg/5_h_ex.webp`
    )
    expect(raidIcons.raidEgg({ level: 5, hatched: true, ex: false })).toBe(
      `${BASE_ICON_URL}/raid/egg/5_h.webp`
    )
    expect(raidIcons.raidEgg({ level: 6, hatched: true, ex: true })).toBe(
      `${BASE_ICON_URL}/raid/egg/6_ex.webp`
    )
    expect(raidIcons.raidEgg({ level: 7, hatched: true, ex: true })).toBe(
      `${BASE_ICON_URL}/raid/egg/7.webp`
    )
    expect(raidIcons.raidEgg({ level: 999, hatched: true, ex: true })).toBe(
      `${BASE_ICON_URL}/raid/egg/0.webp`
    )
  })

  test('reward combinations cover amount parsing and id derivation rules', () => {
    const rewardIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        misc: ['0.webp'],
        reward: {
          item: ['0.webp', '1.webp', '1_a10.webp', '500.webp'],
          stardust: ['0.webp', '500.webp'],
          mega_resource: ['0.webp', '6.webp', '6_a25.webp'],
        },
      },
    })

    expect(rewardIcons.reward({ questRewardType: 'item' })).toBe(
      `${BASE_ICON_URL}/reward/item/0.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'item',
        rewardIdOrAmount: 1,
        amount: 10,
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/item/1_a10.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'item',
        rewardIdOrAmount: 1,
        amount: '10',
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/item/1_a10.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'item',
        rewardIdOrAmount: 1,
        amount: 2.5,
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/item/1.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'item',
        rewardIdOrAmount: 1,
        amount: 99,
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/item/1.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'item',
        rewardIdOrAmount: 'not-a-number',
        amount: 500,
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/item/500.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'stardust',
        rewardIdOrAmount: '500',
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/stardust/500.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'mega_resource',
        rewardIdOrAmount: 6,
        amount: 25,
      })
    ).toBe(
      `${BASE_ICON_URL}/reward/mega_resource/6_a25.webp`
    )
    expect(
      rewardIcons.reward({
        questRewardType: 'invalid_reward' as never,
        rewardIdOrAmount: 1,
      })
    ).toBe(
      `${BASE_ICON_URL}/misc/0.webp`
    )
  })

  test('spawnpoint honors fallback when timer icon is missing', () => {
    const spawnpointIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        spawnpoint: ['0.webp'],
      },
    })

    expect(spawnpointIcons.spawnpoint()).toBe(
      `${BASE_ICON_URL}/spawnpoint/0.webp`
    )
    expect(spawnpointIcons.spawnpoint({ hasTth: true })).toBe(
      `${BASE_ICON_URL}/spawnpoint/0.webp`
    )
  })

  test('station always maps boolean state to 0 or 1 filename', () => {
    const stationIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        station: ['0.webp'],
      },
    })

    expect(stationIcons.station({ active: false })).toBe(
      `${BASE_ICON_URL}/station/0.webp`
    )
    expect(stationIcons.station({ active: true })).toBe(
      `${BASE_ICON_URL}/station/1.webp`
    )
  })

  test('tappable combinations include scalar casting and reward fallback', () => {
    const tappableIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        tappable: ['123.webp', 'TAPPABLE_TYPE_POKEBALL.webp'],
        reward: {
          item: ['1.webp'],
        },
      },
    })
    const noTappableIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        reward: {
          item: ['1.webp'],
        },
      },
    })

    expect(tappableIcons.tappable({ tappableType: 123 })).toBe(
      `${BASE_ICON_URL}/tappable/123.webp`
    )
    expect(tappableIcons.tappable({ tappableType: 'UNKNOWN_TYPE' })).toBe(
      `${BASE_ICON_URL}/tappable/TAPPABLE_TYPE_POKEBALL.webp`
    )
    expect(noTappableIcons.tappable({ tappableType: 'UNKNOWN_TYPE' })).toBe(
      `${BASE_ICON_URL}/reward/item/1.webp`
    )
  })

  test('weather combinations cover severity and time fallback ordering', () => {
    const weatherIcons = new UICONS({
      path: BASE_ICON_URL,
      extension: 'webp',
      data: {
        weather: ['0.webp', '3.webp', '3_l2.webp', '3_l2_d.webp', '4_n.webp'],
      },
    })

    expect(
      weatherIcons.weather({ weatherId: 3, severityLevel: 2, timeOfDay: 'day' })
    ).toBe(
      `${BASE_ICON_URL}/weather/3_l2_d.webp`
    )
    expect(
      weatherIcons.weather({ weatherId: 3, severityLevel: 2, timeOfDay: 'night' })
    ).toBe(
      `${BASE_ICON_URL}/weather/3_l2.webp`
    )
    expect(
      weatherIcons.weather({ weatherId: 3, severityLevel: 0, timeOfDay: 'night' })
    ).toBe(
      `${BASE_ICON_URL}/weather/3.webp`
    )
    expect(
      weatherIcons.weather({ weatherId: 3, severityLevel: 2, timeOfDay: 'dawn' })
    ).toBe(
      `${BASE_ICON_URL}/weather/3_l2_d.webp`
    )
    expect(
      weatherIcons.weather({ weatherId: 4, severityLevel: 0, timeOfDay: 'night' })
    ).toBe(
      `${BASE_ICON_URL}/weather/4_n.webp`
    )
    expect(
      weatherIcons.weather({
        weatherId: 99,
        severityLevel: 9,
        timeOfDay: 'night',
      })
    ).toBe(
      `${BASE_ICON_URL}/weather/0.webp`
    )
  })
})
