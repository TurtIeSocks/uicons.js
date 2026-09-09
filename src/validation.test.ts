import { UICONS } from './uicons.ts'

const BASE_URL = 'https://example.com'

describe('index filename validation', () => {
  test.each([
    ['{"pokemon":[[],"0.png"]}', 'pokemon[0]', 'array'],
    ['{"pokemon":["0.png",42]}', 'pokemon[1]', 'number'],
    ['{"raid":{"egg":[null]}}', 'raid.egg[0]', 'null'],
    ['{"reward":{"item":[{}]}}', 'reward.item[0]', 'object'],
    ['{"reward":{"item":[false]}}', 'reward.item[0]', 'boolean'],
  ])('rejects malformed filenames in %s', (json, path, type) => {
    const icons = new UICONS(BASE_URL)
    expect(() => icons.init(JSON.parse(json))).toThrow(
      new TypeError(
        `Invalid UICONS index: ${path} must be a filename string; received ${type}`
      )
    )
  })

  test('allows empty arrays and valid nested filename lists', () => {
    const icons = new UICONS(BASE_URL).init({
      pokemon: [],
      raid: { egg: ['0.png', '1.png'] },
      reward: { item: ['0.webp', '1.webp'] },
    })
    expect(icons.pokemon({ pokemonId: 1 })).toBe('')
    expect(icons.has('raid.egg', 1)).toBe(true)
    expect(icons.has('reward.item', 1)).toBe(true)
  })

  test('can initialize successfully after rejecting malformed data', () => {
    const icons = new UICONS(BASE_URL)
    expect(() => icons.init(JSON.parse('{"pokemon":[[]]}'))).toThrow(TypeError)
    icons.init({ pokemon: ['0.png', '1.png'] })
    expect(icons.pokemon({ pokemonId: 1 })).toBe(`${BASE_URL}/pokemon/1.png`)
  })

  test('preserves the previous index when filename validation fails', () => {
    const icons = new UICONS(BASE_URL)
    icons.init({ pokemon: ['0.png', '1.png'] })
    expect(() => icons.init(JSON.parse('{"pokemon":["0.webp",[]]}'))).toThrow(
      TypeError
    )
    expect(icons.has('pokemon', 1)).toBe(true)
    expect(icons.pokemon({ pokemonId: 1 })).toBe(`${BASE_URL}/pokemon/1.png`)
  })

  test('validates indexes supplied to the constructor', () => {
    expect(
      () =>
        new UICONS({
          path: BASE_URL,
          data: JSON.parse('{"pokemon":[[]]}'),
        })
    ).toThrow('pokemon[0] must be a filename string; received array')
  })
})
