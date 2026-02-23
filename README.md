# uicons.js

uicons.js is a JavaScript class based on the [UICONS](https://github.com/UIcons/UIcons) specification. It provides a simple way to utilize the UICONS standard in your projects and reduces the need for tedious boilerplate code.

### [Demo Page](https://turtiesocks.github.io/uicons.js/)

## Installation

[![npm version](https://badge.fury.io/js/uicons.js.svg)](https://badge.fury.io/js/uicons.js)

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

## Usage

- View the [example](./example/) code to see implementation details for both audio and image files
- See [tests](./src/uicons.test.ts) for additional examples.
- Upgrading from positional calls? See [V1 -> V2 Migration Guide](./MIGRATION_V1_TO_V2.md).

```typescript
import { UICONS } from 'uicons.js'

// Constructor option 1: pass a base path string
const uicons = new UICONS('https://www.uicons-repo.com')

// Async initialization fetches the index.json file for you
await uicons.remoteInit()

// Constructor option 2: pass an options object
// specifying the extension does not change the output but it does provide better intellisense
const fromOptions = new UICONS({
  path: 'https://www.uicons-repo.com',
  label: 'my-uicons',
  extension: 'png',
})

// Sync initialization if you already have contents of the index.json
const indexJson = await fetch('https://www.uicons-repo.com/index.json').then(
  (res) => res.json()
)
uicons.init(indexJson)

// Option 2 can also initialize immediately when `data` is provided
const preloaded = new UICONS({
  path: 'https://www.uicons-repo.com',
  data: indexJson,
})

// V2: all public methods use one optional object argument (except `has`)
const background = uicons.background({ id: 1 })
const device = uicons.device({ online: true })
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
  questRewardType: reward_type_id,
  rewardIdOrAmount: reward_id,
  amount,
})
const rewardWithoutId = uicons.reward({ questRewardType: reward_type_id })
const defaultTappable = uicons.tappable()
const spawnpoint = uicons.spawnpoint({ hasTth: has_known_tth })
const station = uicons.station({ active: is_active })
const team = uicons.team({ teamId: team_id })
const type = uicons.type({ typeId: type_id })
const weather = uicons.weather({
  weatherId: weather_id,
  severityLevel: severity,
  timeOfDay: 'day',
})

// `has` remains positional
const exists = uicons.has('reward.item', 1)
```

## API Summary (V2)

- `init(data)`
- `remoteInit()`
- `background(args?)`
- `device(args?)`
- `gym(args?)`
- `invasion(args?)`
- `misc(args?)`
- `nest(args?)`
- `pokemon(args?)`
- `pokestop(args?)`
- `raidEgg(args?)`
- `reward(args?)`
- `spawnpoint(args?)`
- `station(args?)`
- `tappable(args?)`
- `team(args?)`
- `type(args?)`
- `weather(args?)`
- `has(location, fileName)` (unchanged)

## Development

```bash
# Clone Repository
git clone https://github.com/TurtIeSocks/uicons.js.git
cd uicons.js

# Install Dependencies
pnpm install
pnpm --dir example install

# Build and Run Example
pnpm run start

# Run Tests
pnpm run test
```
