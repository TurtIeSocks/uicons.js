/**
 * Type-level assertions for the exact URL inference, plus offline runtime
 * checks that the values match what the types claim. No network required.
 */
import { Rpc } from '@na-ji/pogo-protos'
import { UICONS } from './uicons.ts'

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false
type Expect<T extends true> = T

const BASE = 'https://example.com/uicons'

const u = new UICONS({
  path: BASE,
  data: {
    team: ['0.webp', '1.webp'],
    device: ['0.webp'],
    station: ['0.webp', '1.webp'],
    spawnpoint: ['0.webp', '1.webp'],
    gym: ['0.webp', '2.webp', '2_t3.webp', '2_t3_b.webp', '1_ex.webp'],
    invasion: ['0.webp', '44.webp', '44_u.webp'],
    weather: ['0.webp', '1_d.webp', '3_l2_n.webp'],
    raid: { egg: ['0.webp', '1.webp', '12_h.webp'] },
    reward: {
      mega_resource: [
        '0.webp',
        '3.webp',
        '6.webp',
        '6_e2.webp',
        '6_e2_a25.webp',
        '26_e3.webp',
        '150_a25.webp',
      ],
      item: ['1.webp'],
    },
    tappable: ['TAPPABLE_TYPE_POKEBALL.webp', 'TAPPABLE_TYPE_BREAKFAST.webp'],
    pokemon: ['0.webp', '9.webp', '9_e1.webp', '4_f896.webp'],
    misc: ['0.webp', '500.webp'],
  },
})

describe('exact literal inference (typed index data)', () => {
  test('team resolves the exact file, including known fallbacks', () => {
    const hit = u.team({ teamId: 1 })
    const miss = u.team({ teamId: 9 })
    const none = u.team()
    type _1 = Expect<Equal<typeof hit, `${typeof BASE}/team/1.webp`>>
    type _2 = Expect<Equal<typeof miss, `${typeof BASE}/team/0.webp`>>
    type _3 = Expect<Equal<typeof none, `${typeof BASE}/team/0.webp`>>
    expect(hit).toBe(`${BASE}/team/1.webp`)
    expect(miss).toBe(`${BASE}/team/0.webp`)
    expect(none).toBe(`${BASE}/team/0.webp`)
  })

  test('enum members behave as literals', () => {
    const mystic = u.team({ teamId: Rpc.Team.TEAM_BLUE })
    type _1 = Expect<Equal<typeof mystic, `${typeof BASE}/team/1.webp`>>
    expect(mystic).toBe(`${BASE}/team/1.webp`)
  })

  test('gym simulates the suffix fallback search', () => {
    const exactHit = u.gym({ teamId: 2, trainerCount: 3, inBattle: true })
    const fallsBack = u.gym({
      teamId: 2,
      trainerCount: 3,
      inBattle: true,
      ex: true,
    })
    type _1 = Expect<Equal<typeof exactHit, `${typeof BASE}/gym/2_t3_b.webp`>>
    type _2 = Expect<Equal<typeof fallsBack, `${typeof BASE}/gym/2_t3_b.webp`>>
    expect(exactHit).toBe(`${BASE}/gym/2_t3_b.webp`)
    expect(fallsBack).toBe(`${BASE}/gym/2_t3_b.webp`)
  })

  test('invasion mirrors the unconfirmed suffix order', () => {
    const unconfirmed = u.invasion({ gruntId: 44 })
    const confirmed = u.invasion({ gruntId: 44, confirmed: true })
    type _1 = Expect<
      Equal<typeof unconfirmed, `${typeof BASE}/invasion/44_u.webp`>
    >
    type _2 = Expect<
      Equal<typeof confirmed, `${typeof BASE}/invasion/44.webp`>
    >
    expect(unconfirmed).toBe(`${BASE}/invasion/44_u.webp`)
    expect(confirmed).toBe(`${BASE}/invasion/44.webp`)
  })

  test('weather resolves time of day and severity', () => {
    const night = u.weather({
      weatherId: 3,
      severityLevel: 2,
      timeOfDay: 'night',
    })
    const day = u.weather({ weatherId: 1 })
    type _1 = Expect<Equal<typeof night, `${typeof BASE}/weather/3_l2_n.webp`>>
    type _2 = Expect<Equal<typeof day, `${typeof BASE}/weather/1_d.webp`>>
    expect(night).toBe(`${BASE}/weather/3_l2_n.webp`)
    expect(day).toBe(`${BASE}/weather/1_d.webp`)
  })

  test('raid egg resolves nested folders', () => {
    const hatched = u.raidEgg({ level: 12, hatched: true })
    type _1 = Expect<
      Equal<typeof hatched, `${typeof BASE}/raid/egg/12_h.webp`>
    >
    expect(hatched).toBe(`${BASE}/raid/egg/12_h.webp`)
  })

  test('reward walks the evolution and amount fallback chain', () => {
    const full = u.reward({
      questRewardType: 'mega_resource',
      rewardId: 6,
      amount: 25,
      evolution: 2,
    })
    const noAmount = u.reward({
      questRewardType: 'mega_resource',
      rewardId: 26,
      amount: 25,
      evolution: 3,
    })
    const noEvolution = u.reward({
      questRewardType: 'mega_resource',
      rewardId: 150,
      amount: 25,
      evolution: 2,
    })
    const plain = u.reward({
      questRewardType: 'mega_resource',
      rewardId: 3,
      amount: 25,
      evolution: 2,
    })
    type _1 = Expect<
      Equal<typeof full, `${typeof BASE}/reward/mega_resource/6_e2_a25.webp`>
    >
    type _2 = Expect<
      Equal<typeof noAmount, `${typeof BASE}/reward/mega_resource/26_e3.webp`>
    >
    type _3 = Expect<
      Equal<
        typeof noEvolution,
        `${typeof BASE}/reward/mega_resource/150_a25.webp`
      >
    >
    type _4 = Expect<
      Equal<typeof plain, `${typeof BASE}/reward/mega_resource/3.webp`>
    >
    expect(full).toBe(`${BASE}/reward/mega_resource/6_e2_a25.webp`)
    expect(noAmount).toBe(`${BASE}/reward/mega_resource/26_e3.webp`)
    expect(noEvolution).toBe(`${BASE}/reward/mega_resource/150_a25.webp`)
    expect(plain).toBe(`${BASE}/reward/mega_resource/3.webp`)
  })

  test('pokemon resolves form and evolution suffixes', () => {
    const mega = u.pokemon({ pokemonId: 9, evolution: 1 })
    const form = u.pokemon({ pokemonId: 4, form: 896 })
    type _1 = Expect<Equal<typeof mega, `${typeof BASE}/pokemon/9_e1.webp`>>
    type _2 = Expect<Equal<typeof form, `${typeof BASE}/pokemon/4_f896.webp`>>
    expect(mega).toBe(`${BASE}/pokemon/9_e1.webp`)
    expect(form).toBe(`${BASE}/pokemon/4_f896.webp`)
  })

  test('device checks membership before returning the online icon', () => {
    // `1.webp` is not in the device list, so online still resolves to 0
    const online = u.device({ online: true })
    const offline = u.device()
    type _1 = Expect<Equal<typeof online, `${typeof BASE}/device/0.webp`>>
    type _2 = Expect<Equal<typeof offline, `${typeof BASE}/device/0.webp`>>
    expect(online).toBe(`${BASE}/device/0.webp`)
    expect(offline).toBe(`${BASE}/device/0.webp`)
  })

  test('station and spawnpoint binary toggles', () => {
    const active = u.station({ active: true })
    const tth = u.spawnpoint({ hasTth: true })
    type _1 = Expect<Equal<typeof active, `${typeof BASE}/station/1.webp`>>
    type _2 = Expect<Equal<typeof tth, `${typeof BASE}/spawnpoint/1.webp`>>
    expect(active).toBe(`${BASE}/station/1.webp`)
    expect(tth).toBe(`${BASE}/spawnpoint/1.webp`)
  })

  test('tappable falls back through pokeball to the reward item icon', () => {
    const hit = u.tappable({ tappableType: 'TAPPABLE_TYPE_BREAKFAST' })
    const pokeball = u.tappable({ tappableType: 'TAPPABLE_TYPE_UNKNOWN' })
    type _1 = Expect<
      Equal<
        typeof hit,
        `${typeof BASE}/tappable/TAPPABLE_TYPE_BREAKFAST.webp`
      >
    >
    type _2 = Expect<
      Equal<
        typeof pokeball,
        `${typeof BASE}/tappable/TAPPABLE_TYPE_POKEBALL.webp`
      >
    >
    expect(hit).toBe(`${BASE}/tappable/TAPPABLE_TYPE_BREAKFAST.webp`)
    expect(pokeball).toBe(`${BASE}/tappable/TAPPABLE_TYPE_POKEBALL.webp`)
  })

  test('categories absent from the index resolve to the empty string', () => {
    const nest = u.nest({ typeId: 12 })
    type _1 = Expect<Equal<typeof nest, ''>>
    expect(nest).toBe('')
  })

  test('has() resolves membership statically', () => {
    const yes = u.has('team', 1)
    const no = u.has('team', 9)
    const nested = u.has('reward.item', 1)
    type _1 = Expect<Equal<typeof yes, true>>
    type _2 = Expect<Equal<typeof no, false>>
    type _3 = Expect<Equal<typeof nested, true>>
    expect(yes).toBe(true)
    expect(no).toBe(false)
    expect(nested).toBe(true)
  })
})

describe('fallback typing without literal index data', () => {
  test('widened args over a literal index resolve to the possible files', () => {
    const n = 5 as number
    const url = u.team({ teamId: n })
    type _1 = Expect<
      Equal<
        typeof url,
        | `${typeof BASE}/team/0.webp`
        | `${typeof BASE}/team/1.webp`
      >
    >
    expect(url).toBe(`${BASE}/team/0.webp`)
  })

  test('extension hint narrows candidate unions when data is unknown', () => {
    const remote = new UICONS({ path: BASE, extension: 'webp' })
    type TeamUrl = ReturnType<typeof remote.team<1>>
    type _1 = Expect<
      Equal<
        TeamUrl,
        `${typeof BASE}/team/1.webp` | `${typeof BASE}/team/0.webp`
      >
    >
    expect(typeof remote).toBe('object')
  })

  test('tappable fallback when the category is missing entirely', () => {
    const noTappable = new UICONS({
      path: BASE,
      data: { reward: { item: ['1.webp'] } },
    })
    const url = noTappable.tappable({ tappableType: 'TAPPABLE_TYPE_UNKNOWN' })
    type _1 = Expect<Equal<typeof url, `${typeof BASE}/reward/item/1.webp`>>
    expect(url).toBe(`${BASE}/reward/item/1.webp`)
  })

  test('reward returns the empty string when the whole category is missing', () => {
    const noReward = new UICONS({
      path: BASE,
      data: { misc: ['0.png'] },
    })
    const url = noReward.reward({ questRewardType: 'item', rewardId: 1 })
    type _1 = Expect<Equal<typeof url, ''>>
    expect(url).toBe('')
  })

  test('reward falls back to the misc icon for missing reward types', () => {
    const partialReward = new UICONS({
      path: BASE,
      data: { misc: ['0.png'], reward: { item: ['1.png'] } },
    })
    const url = partialReward.reward({ questRewardType: 'stardust', rewardId: 500 })
    type _1 = Expect<Equal<typeof url, `${typeof BASE}/misc/0.png`>>
    expect(url).toBe(`${BASE}/misc/0.png`)
  })

  test('non-canonical numeric strings degrade to honest unions', () => {
    // Number('02') === 2 at runtime, which the type system cannot mirror, so
    // the arg must fail the literal gate and produce the coarse union instead.
    const stop = new UICONS({
      path: BASE,
      data: { pokestop: ['0.webp', '0_i2.webp'] },
    })
    const url = stop.pokestop({ displayTypeId: '02' })
    type _1 = Expect<
      Equal<
        typeof url,
        `${typeof BASE}/pokestop/0.webp` | `${typeof BASE}/pokestop/0_i2.webp`
      >
    >
    expect(url).toBe(`${BASE}/pokestop/0_i2.webp`)
  })

  test('empty category lists behave like missing categories', () => {
    const empty = new UICONS({
      path: BASE,
      data: {
        background: [],
        misc: ['0.png'],
        reward: { stardust: [], item: ['1.png'] },
      },
    })
    const bg = empty.background({ id: 1 })
    type _1 = Expect<Equal<typeof bg, ''>>
    expect(bg).toBe('')
    const rw = empty.reward({ questRewardType: 'stardust', rewardId: 500 })
    type _2 = Expect<Equal<typeof rw, `${typeof BASE}/misc/0.png`>>
    expect(rw).toBe(`${BASE}/misc/0.png`)
    const hs = empty.has('background', 0)
    type _3 = Expect<Equal<typeof hs, false>>
    expect(hs).toBe(false)
  })

  test('init rebrands the instance with the provided index data', () => {
    const blank = new UICONS(BASE)
    const ready = blank.init({ team: ['0.png', '3.png'] })
    const url = ready.team({ teamId: 3 })
    type _1 = Expect<Equal<typeof url, `${typeof BASE}/team/3.png`>>
    expect(url).toBe(`${BASE}/team/3.png`)
    expect<object>(ready).toBe(blank)
  })

  test('trailing slashes are stripped at the type level too', () => {
    const slashed = new UICONS({
      path: 'https://example.com/uicons/',
      data: { team: ['0.webp'] },
    })
    const url = slashed.team()
    type _1 = Expect<Equal<typeof url, `${typeof BASE}/team/0.webp`>>
    expect(url).toBe(`${BASE}/team/0.webp`)
  })
})
