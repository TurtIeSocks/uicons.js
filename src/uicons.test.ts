import { UICONS } from './uicons.ts'
import { Rpc } from '@na-ji/pogo-protos'

const BASE_ICON_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uicons-webp/main'
const BASE_AUDIO_URL =
  'https://raw.githubusercontent.com/WatWowMap/wwm-uaudio/main'

const icons = new UICONS(BASE_ICON_URL)

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
    expect(icons.device(true)).toBe(`${BASE_ICON_URL}/device/1.webp`)
  })
})

describe('gym', () => {
  test('neutral icon', () => {
    expect(icons.gym(0)).toBe(`${BASE_ICON_URL}/gym/0.webp`)
  })
  test('valor in battle', () => {
    expect(icons.gym(2, 3, true)).toBe(`${BASE_ICON_URL}/gym/2_t3_b.webp`)
  })
  test('mystic ex', () => {
    expect(icons.gym(1, 4, false, true)).toBe(
      `${BASE_ICON_URL}/gym/1_t4_ex.webp`
    )
  })
  test('instinct ar', () => {
    expect(icons.gym(3, 6, false, false, true)).toBe(
      `${BASE_ICON_URL}/gym/3_t6_ar.webp`
    )
  })
})

describe('invasion', () => {
  test('giovanni unconfirmed', () => {
    expect(icons.invasion('44')).toBe(`${BASE_ICON_URL}/invasion/44_u.webp`)
  })
  test('giovanni confirmed', () => {
    expect(
      icons.invasion(Rpc.EnumWrapper.InvasionCharacter.CHARACTER_GIOVANNI, true)
    ).toBe(`${BASE_ICON_URL}/invasion/44.webp`)
  })
})

describe('misc', () => {
  test('fallback icon', () => {
    expect(icons.misc('something_missing')).toBe(`${BASE_ICON_URL}/misc/0.webp`)
  })
  test('has great league', () => {
    expect(icons.misc('500')).toBe(`${BASE_ICON_URL}/misc/500.webp`)
  })
})

describe('nest', () => {
  test('grass - string', () => {
    expect(icons.nest('12')).toBe(`${BASE_ICON_URL}/nest/12.webp`)
  })
  test('none - number', () => {
    expect(icons.nest(0)).toBe(`${BASE_ICON_URL}/nest/0.webp`)
  })
})

describe('pokemon', () => {
  test('bulbasaur', () => {
    expect(icons.pokemon('1')).toBe(`${BASE_ICON_URL}/pokemon/1.webp`)
  })
  test('charmander form', () => {
    expect(icons.pokemon(4, 0, 896)).toBe(
      `${BASE_ICON_URL}/pokemon/4_f896.webp`
    )
  })
  test('mega blastoise', () => {
    expect(
      icons.pokemon(
        Rpc.HoloPokemonId.BLASTOISE,
        Rpc.HoloTemporaryEvolutionId.TEMP_EVOLUTION_MEGA
      )
    ).toBe(`${BASE_ICON_URL}/pokemon/9_e1.webp`)
  })
})

describe('pokestops', () => {
  test('lure', () => {
    expect(icons.pokestop(501)).toBe(`${BASE_ICON_URL}/pokestop/501.webp`)
  })
  test('invasion', () => {
    expect(icons.pokestop(0, 0)).toBe(`${BASE_ICON_URL}/pokestop/0_i.webp`)
  })
  test('quest', () => {
    expect(icons.pokestop(0, false, 0)).toBe(
      `${BASE_ICON_URL}/pokestop/0_q.webp`
    )
  })
  test('ar', () => {
    expect(icons.pokestop(504, 0, false, true)).toBe(
      `${BASE_ICON_URL}/pokestop/504_i_ar.webp`
    )
  })
})

describe('raid', () => {
  test('hatched', () => {
    expect(icons.raidEgg('12', true)).toBe(
      `${BASE_ICON_URL}/raid/egg/12_h.webp`
    )
  })
  test('unhatched', () => {
    expect(icons.raidEgg(1, false)).toBe(`${BASE_ICON_URL}/raid/egg/1.webp`)
  })
})

describe('reward', () => {
  test('experience', () => {
    expect(icons.reward('experience', 100)).toBe(
      `${BASE_ICON_URL}/reward/experience/100.webp`
    )
  })
  test('item without amount', () => {
    expect(icons.reward('item', 1)).toBe(`${BASE_ICON_URL}/reward/item/1.webp`)
  })
  test('item with amount', () => {
    expect(icons.reward('item', 1, 10)).toBe(
      `${BASE_ICON_URL}/reward/item/1_a10.webp`
    )
  })
  test('item with missing amount', () => {
    expect(icons.reward('item', 2, 300)).toBe(
      `${BASE_ICON_URL}/reward/item/2.webp`
    )
  })
  test('stardust with amount', () => {
    expect(icons.reward('stardust', 500)).toBe(
      `${BASE_ICON_URL}/reward/stardust/500.webp`
    )
  })
  test('stardust with missing amount', () => {
    expect(icons.reward('stardust', 10_000)).toBe(
      `${BASE_ICON_URL}/reward/stardust/0.webp`
    )
  })
  test('candy', () => {
    expect(icons.reward('candy', 4)).toBe(
      `${BASE_ICON_URL}/reward/candy/4.webp`
    )
  })
  test('xl_candy', () => {
    expect(icons.reward('xl_candy', '98')).toBe(
      `${BASE_ICON_URL}/reward/xl_candy/98.webp`
    )
  })
  test('mega_resource', () => {
    expect(icons.reward('mega_resource', 3)).toBe(
      `${BASE_ICON_URL}/reward/mega_resource/3.webp`
    )
  })
  test('mega_resource with amount', () => {
    expect(icons.reward('mega_resource', 6, 25)).toBe(
      `${BASE_ICON_URL}/reward/mega_resource/6_a25.webp`
    )
  })
})

describe('spawnpoint', () => {
  test('verified', () => {
    expect(icons.spawnpoint(true)).toBe(`${BASE_ICON_URL}/spawnpoint/1.webp`)
  })
})

describe('stations', () => {
  test('active', () => {
    expect(icons.station(true)).toBe(`${BASE_ICON_URL}/station/1.webp`)
  })
  test('inactive', () => {
    expect(icons.station()).toBe(`${BASE_ICON_URL}/station/0.webp`)
  })
})

describe('team', () => {
  test('instinct', () => {
    expect(icons.team(3)).toBe(`${BASE_ICON_URL}/team/3.webp`)
  })
  test('missing', () => {
    expect(icons.team(10)).toBe(`${BASE_ICON_URL}/team/0.webp`)
  })
})

describe('type', () => {
  test('fire - number', () => {
    expect(icons.type(1)).toBe(`${BASE_ICON_URL}/type/1.webp`)
  })
  test('steel - string', () => {
    expect(icons.type('9')).toBe(`${BASE_ICON_URL}/type/9.webp`)
  })
  test('bug - proto', () => {
    expect(icons.type(Rpc.HoloPokemonType.POKEMON_TYPE_BUG)).toBe(
      `${BASE_ICON_URL}/type/7.webp`
    )
  })
})

describe('weather', () => {
  test('id only', () => {
    expect(icons.weather(2)).toBe(`${BASE_ICON_URL}/weather/2.webp`)
  })
  test('with day', () => {
    expect(icons.weather(3, 0, 'day')).toBe(`${BASE_ICON_URL}/weather/3_d.webp`)
  })
  test('with night', () => {
    expect(
      icons.weather(Rpc.GameplayWeatherProto.WeatherCondition.CLEAR, 0, 'night')
    ).toBe(`${BASE_ICON_URL}/weather/1_n.webp`)
  })
})
