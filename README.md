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

// Below are some example usages with variable names for demonstration, see intellisense in your IDE for type information
const pokemon = uicons.pokemon(
  pokemon_id,
  form_id,
  evolution_id,
  gender_id,
  costume_id,
  alignment_id,
  shiny
)
const type = uicons.type(type_id)
const pokestop = uicons.pokestop(
  lure_id,
  power,
  display,
  invasion_active,
  quest_active,
  ar
)
// Please note that in some cases, such as with Stardust, the `reward_id` is the `amount` of the reward
const reward = uicons.reward(reward_type_id, reward_id, amount)
const invasion = uicons.invasion(grunt_id, confirmed)
const gym = uicons.gym(team_id, trainer_count, in_battle, ex, ar)
const egg = uicons.egg(raid_level, hatched, ex)
const team = uicons.team(team_id)
const weather = uicons.weather(weather_id)
const nest = uicons.nest(type_id)
const misc = uicons.misc(filename_without_extension)
const device = uicons.device(online)
const spawnpoint = uicons.spawnpoint(has_known_tth)
```

## Development

```bash
# Clone Repository
git clone https://github.com/TurtIeSocks/uicons.js.git
cd uicons.js

# Install Dependencies
pnpm run install

# Build and Run Example
pnpm run start

# Run Tests
pnpm run test
```
