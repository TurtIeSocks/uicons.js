import { UICONS } from './uicons.ts'

const BASE_URL = 'https://example.com'

describe('non-string filename entries', () => {
  test('skips invalid entries before and after valid filenames', () => {
    const icons = new UICONS(BASE_URL).init(
      JSON.parse('{"pokemon":[[],null,42,{},false,"0.png","1.png",[]]}')
    )
    expect(icons.pokemon({ pokemonId: 1 })).toBe(`${BASE_URL}/pokemon/1.png`)
    expect(icons.pokemon({ pokemonId: 2 })).toBe(`${BASE_URL}/pokemon/0.png`)
    expect(icons.has('pokemon', 1)).toBe(true)
    expect(icons.has('pokemon', 2)).toBe(false)
  })

  test('skips invalid entries in nested raid and reward lists', () => {
    const icons = new UICONS(BASE_URL).init(
      JSON.parse(
        '{"raid":{"egg":[[],"0.png","1.png",null]},"reward":{"item":[false,"0.webp",{},"1.webp"]}}'
      )
    )
    expect(icons.has('raid.egg', 1)).toBe(true)
    expect(icons.has('reward.item', 1)).toBe(true)
    expect(icons.has('raid.egg', 2)).toBe(false)
    expect(icons.has('reward.item', 2)).toBe(false)
  })

  test.each(['[]', '[[],null,42,{},false]'])(
    'treats %s as an empty filename list',
    (entries) => {
      const icons = new UICONS(BASE_URL).init(
        JSON.parse(
          `{"pokemon":${entries},"raid":{"egg":${entries}},"reward":{"item":${entries}}}`
        )
      )
      expect(icons.pokemon({ pokemonId: 1 })).toBe('')
      expect(icons.has('pokemon', 1)).toBe(false)
      expect(icons.has('raid.egg', 1)).toBe(false)
      expect(icons.has('reward.item', 1)).toBe(false)
    }
  )

  test('supports constructor initialization with mixed filename entries', () => {
    const icons = new UICONS({
      path: BASE_URL,
      data: JSON.parse('{"pokemon":[[],"0.png","1.png"]}'),
    })
    expect(icons.pokemon({ pokemonId: 1 })).toBe(`${BASE_URL}/pokemon/1.png`)
  })

  test('can replace an existing index with mixed filename entries', () => {
    const icons = new UICONS(BASE_URL)
    icons.init({ pokemon: ['0.png', '1.png'] })
    icons.init(JSON.parse('{"pokemon":[[],"0.webp","2.webp"]}'))
    expect(icons.has('pokemon', 1)).toBe(false)
    expect(icons.has('pokemon', 2)).toBe(true)
    expect(icons.pokemon({ pokemonId: 2 })).toBe(`${BASE_URL}/pokemon/2.webp`)
  })
})
