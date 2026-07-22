# uicons.js

**Type-safe UICONS client for Pokémon GO — resolves icon & audio URLs to exact template-literal types, with no runtime dependencies.**

[![npm version](https://img.shields.io/npm/v/uicons.js.svg?logo=npm&color=cb3837)](https://www.npmjs.com/package/uicons.js)
[![npm downloads](https://img.shields.io/npm/dm/uicons.js.svg?color=cb3837)](https://www.npmjs.com/package/uicons.js)
[![minzipped size](https://img.shields.io/bundlejs/size/uicons.js?color=44cc11)](https://bundlejs.com/?q=uicons.js)
[![types included](https://img.shields.io/npm/types/uicons.js.svg?color=3178c6)](https://www.npmjs.com/package/uicons.js)
[![license](https://img.shields.io/npm/l/uicons.js.svg?color=3178c6)](./LICENSE)

uicons.js is a JavaScript/TypeScript class based on the [UICONS](https://github.com/UIcons/UIcons) specification. It provides a simple way to utilize the UICONS standard in your projects and reduces the need for tedious boilerplate code.

### [Demo Page](https://turtiesocks.github.io/uicons.js/)

## Installation

```bash
npm install uicons.js
yarn add uicons.js
pnpm add uicons.js
```

## Features

- File extension agnostic
- Provides helpful IntelliSense in your IDE based on latest protos
- Works in the browser and server
- Supports both remote and local initialization of the index.json file
- Exact template-literal return types when initialized with literal index data (TypeScript 5.0+)

## Usage

- View the [example](./example/) code to see implementation details for both audio and image files
- See [tests](./src/uicons.test.ts) for additional examples.

```typescript
import { UICONS } from 'uicons.js'

const uicons = new UICONS('https://www.uicons-repo.com')

// Async initialization fetches the index.json file for you
await uicons.remoteInit()

// Sync initialization if you already have contents of the index.json
const indexJson = await fetch('https://www.uicons-repo.com/index.json').then(
  (res) => res.json()
)
uicons.init(indexJson)

// The constructor also accepts an options object
const uiconsWithOptions = new UICONS({
  // base URL of the UICONS repository
  path: 'https://www.uicons-repo.com',
  // optional label used in debug warnings, defaults to the path
  label: 'cagemons',
  // optional type-level hint for return types when using remoteInit()
  extension: 'webp',
  // optional index.json contents to initialize synchronously in the constructor
  data: indexJson,
})

// Every icon method takes a single optional object argument
// Below are some example usages with variable names for demonstration, see intellisense in your IDE for type information
// Please note that in some cases, such as with Stardust, the `rewardId` is the `amount` of the reward
const background = uicons.background({ id: background_id })
const device = uicons.device({ online })
const gym = uicons.gym({
  teamId: team_id,
  trainerCount: trainer_count,
  inBattle: in_battle,
  ex,
  ar,
  power: power_level,
})
const invasion = uicons.invasion({ gruntId: grunt_id, confirmed })
const misc = uicons.misc({ fileName: filename_without_extension })
const nest = uicons.nest({ typeId: type_id })
const pokemon = uicons.pokemon({
  pokemonId: pokemon_id,
  evolution: evolution_id,
  form: form_id,
  costume: costume_id,
  gender: gender_id,
  alignment: alignment_id,
  bread: bread_id,
  shiny,
})
const pokestop = uicons.pokestop({
  lureId: lure_id,
  displayTypeId: display,
  questActive: quest_active,
  ar,
  power,
})
const egg = uicons.raidEgg({ level: raid_level, hatched, ex })
const reward = uicons.reward({
  questRewardType: reward_type,
  rewardId: reward_id,
  amount,
})
const evolutionReward = uicons.reward({
  questRewardType: reward_type,
  rewardId: reward_id,
  amount,
  evolution: evolution_id,
})
const rewardWithoutId = uicons.reward({ questRewardType: reward_type, amount })
const spawnpoint = uicons.spawnpoint({ hasTth: has_known_tth })
const station = uicons.station({ active })
const tappable = uicons.tappable({ tappableType: tappable_type })
const team = uicons.team({ teamId: team_id })
const type = uicons.type({ typeId: type_id })
const weather = uicons.weather({
  weatherId: weather_id,
  severityLevel: severity,
  timeOfDay: 'day',
})

// `has` stays positional: dot notation folder path + filename without extension
const exists = uicons.has('team', 1)
```

## Exact return types

When the constructor receives a literal `path` and literal index `data`, every method resolves its exact return URL at the type level — including the same fallback search the runtime performs. No `as const` needed; the constructor captures literals via const type parameters.

```typescript
const uicons = new UICONS({
  path: 'https://example.com/uicons',
  data: { team: ['0.webp', '1.webp'] },
})

const mystic = uicons.team({ teamId: 1 })
//    ^? "https://example.com/uicons/team/1.webp"

// `9.webp` is not in the index, so the type falls back to `0.webp`,
// exactly like the runtime does
const missing = uicons.team({ teamId: 9 })
//    ^? "https://example.com/uicons/team/0.webp"
```

When the index data is not statically known (e.g. with `remoteInit()`), pass the `extension` option as a type-level hint and literal arguments narrow to a union of the candidate URLs:

```typescript
const uicons = await new UICONS({
  path: 'https://example.com/uicons',
  extension: 'webp',
}).remoteInit()

const url = uicons.team({ teamId: 1 })
//    ^? "https://example.com/uicons/team/1.webp" | "https://example.com/uicons/team/0.webp"
```

Notes:

- Requires TypeScript >= 5.0 (const type parameters).
- Type-level only — runtime behavior is unchanged. The `extension` option never affects the returned URL; extensions are always derived from the index data at runtime.
- Widened arguments (e.g. a plain `number`) degrade to a broader-but-honest string type, categories statically absent from the provided `data` return type `''`, and `has()` returns literal `true`/`false` when statically resolvable.

## Development

```bash
# Clone Repository
git clone https://github.com/TurtIeSocks/uicons.js.git
cd uicons.js

# Install Dependencies
pnpm install

# Build and Run Example
pnpm run start

# Run Tests
pnpm run test
```
